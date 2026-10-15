import type { Env } from './env'
import { checkoutSessionSchema } from './schema'
import { createSession, getSession, type StripeLike } from './session'
import { dispatchEvent, verifyWebhook } from './webhook'
import { SESSION_ID_PARAM, SESSION_ROUTE, WEBHOOK_ROUTE } from '../../src/checkout/routes'
import {
  ALLOW_HEADERS_HEADER,
  ALLOW_METHODS_HEADER,
  ALLOW_ORIGIN_HEADER,
  ALLOWED_METHODS,
  CACHE_CONTROL_HEADER,
  CONTENT_LENGTH_HEADER,
  CONTENT_TYPE_HEADER,
  JSON_CONTENT_TYPE,
  JSON_RESPONSE_TYPE,
  NO_STORE,
  NOSNIFF,
  NOSNIFF_HEADER,
  ORIGIN_HEADER,
  SIGNATURE_HEADER,
} from './headers'

const MAX_SESSION_BODY_BYTES = 8 * 1024
const MAX_WEBHOOK_BODY_BYTES = 64 * 1024

function jsonResponse(status: number, body: unknown, headers: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      [CONTENT_TYPE_HEADER]: JSON_RESPONSE_TYPE,
      [NOSNIFF_HEADER]: NOSNIFF,
      ...headers,
    },
  })
}

function corsHeaders(request: Request, env: Env): HeadersInit {
  const functionOrigin = new URL(request.url).origin
  const siteOrigin = new URL(env.SITE_URL).origin

  if (functionOrigin === siteOrigin) {
    return {}
  }

  return {
    [ALLOW_ORIGIN_HEADER]: siteOrigin,
    [ALLOW_METHODS_HEADER]: ALLOWED_METHODS,
    [ALLOW_HEADERS_HEADER]: CONTENT_TYPE_HEADER,
  }
}

type ReadBodyResult = { ok: true; text: string } | { ok: false }

async function readBody(request: Request, maxBytes: number): Promise<ReadBodyResult> {
  const contentLength = request.headers.get(CONTENT_LENGTH_HEADER)

  if (contentLength !== null) {
    const length = Number.parseInt(contentLength, 10)

    if (Number.isNaN(length) || length < 0 || length > maxBytes) {
      return { ok: false }
    }
  }
  if (request.body === null) {
    return { ok: true, text: '' }
  }

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  for (;;) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    total += value.byteLength

    if (total > maxBytes) {
      await reader.cancel()

      return { ok: false }
    }

    chunks.push(value)
  }

  const text = new TextDecoder().decode(concatChunks(chunks, total))

  return { ok: true, text }
}

function concatChunks(chunks: Uint8Array[], total: number): Uint8Array {
  const combined = new Uint8Array(total)
  let offset = 0

  for (const chunk of chunks) {
    combined.set(chunk, offset)
    offset += chunk.byteLength
  }

  return combined
}

function isAllowedOrigin(request: Request, env: Env): boolean {
  const origin = request.headers.get(ORIGIN_HEADER)

  if (!origin) {
    return true
  }

  return origin === new URL(env.SITE_URL).origin
}

type RouteContext = {
  env: Env
  makeStripe: (key: string) => StripeLike
  headers: HeadersInit
}

async function handleCreateSession(request: Request, { env, makeStripe, headers }: RouteContext): Promise<Response> {
  const contentType = request.headers.get(CONTENT_TYPE_HEADER) ?? ''

  if (!contentType.startsWith(JSON_CONTENT_TYPE)) {
    return jsonResponse(415, { error: 'Unsupported content type' }, headers)
  }
  if (!isAllowedOrigin(request, env)) {
    return jsonResponse(403, { error: 'Origin not allowed' }, headers)
  }

  const body = await readBody(request, MAX_SESSION_BODY_BYTES)

  if (!body.ok) {
    return jsonResponse(413, { error: 'Request body is too large' }, headers)
  }

  let json: unknown

  try {
    json = JSON.parse(body.text)
  } catch {
    return jsonResponse(400, { error: 'Malformed JSON body' }, headers)
  }

  const parsed = checkoutSessionSchema.safeParse(json)

  if (!parsed.success) {
    return jsonResponse(400, { error: 'Invalid request body' }, headers)
  }

  const result = await createSession(makeStripe(env.STRIPE_SECRET_KEY), parsed.data, env)

  if (!result.ok) {
    return jsonResponse(result.status, { error: result.error }, headers)
  }

  return jsonResponse(200, { url: result.url, id: result.id }, headers)
}

async function handleGetSession(url: URL, { env, makeStripe, headers }: RouteContext): Promise<Response> {
  const id = url.searchParams.get(SESSION_ID_PARAM)

  if (!id) {
    return jsonResponse(400, { error: 'Missing session id' }, headers)
  }

  const result = await getSession(makeStripe(env.STRIPE_SECRET_KEY), id)

  if (!result.ok) {
    return jsonResponse(result.status, { error: result.error }, headers)
  }

  return jsonResponse(200, result.body, headers)
}

async function handleWebhook(request: Request, { env, makeStripe, headers }: RouteContext): Promise<Response> {
  const signature = request.headers.get(SIGNATURE_HEADER)
  const body = await readBody(request, MAX_WEBHOOK_BODY_BYTES)

  if (!body.ok) {
    return jsonResponse(413, { error: 'Request body is too large' }, headers)
  }
  if (!signature) {
    return jsonResponse(400, { error: 'Missing signature' }, headers)
  }

  try {
    const stripe = makeStripe(env.STRIPE_SECRET_KEY)
    const event = await verifyWebhook(stripe, { payload: body.text, signature, secret: env.STRIPE_WEBHOOK_SECRET })

    dispatchEvent(event)
  } catch {
    return jsonResponse(400, { error: 'Invalid signature' }, headers)
  }

  return jsonResponse(200, { received: true }, headers)
}

export async function handle(request: Request, env: Env, makeStripe: (key: string) => StripeLike): Promise<Response> {
  const url = new URL(request.url)
  const headers = { [CACHE_CONTROL_HEADER]: NO_STORE, ...corsHeaders(request, env) }
  const context: RouteContext = { env, makeStripe, headers }

  const pathname = url.pathname.replace(/\/+$/, '')
  const isSessionRoute = pathname === SESSION_ROUTE
  const isWebhookRoute = pathname === WEBHOOK_ROUTE

  if (!isSessionRoute && !isWebhookRoute) {
    return jsonResponse(404, { error: 'Not found' }, headers)
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  if (isSessionRoute) {
    if (request.method === 'POST') {
      return handleCreateSession(request, context)
    }
    if (request.method === 'GET') {
      return handleGetSession(url, context)
    }

    return jsonResponse(405, { error: 'Method not allowed' }, headers)
  }

  if (request.method === 'POST') {
    return handleWebhook(request, context)
  }

  return jsonResponse(405, { error: 'Method not allowed' }, headers)
}
