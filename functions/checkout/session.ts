import { productBySlug } from '../../src/catalog/products'
import { parseSku, variantPriceCents } from '../../src/catalog/pricing'
import { PALETTES } from '../../src/catalog/palettes'
import { sizeById } from '../../src/catalog/sizes'
import { shippingCents } from '../../src/cart/totals'
import type { DeliveryId } from '../../src/cart/types'
import type { Env } from './env'
import type { CheckoutSessionInput } from './schema'

export type CheckoutLineItem = {
  quantity: number
  price_data: {
    currency: 'usd'
    unit_amount: number
    product_data: { name: string; images?: string[] }
  }
}

export type CheckoutShippingOption = {
  shipping_rate_data: {
    type: 'fixed_amount'
    fixed_amount: { amount: number; currency: 'usd' }
    display_name: string
  }
}

export type CheckoutSessionParams = {
  mode: 'payment'
  line_items: CheckoutLineItem[]
  shipping_options: CheckoutShippingOption[]
  success_url: string
  cancel_url: string
  metadata: { orderId: string }
  customer_email?: string
}

export type StripeCreatedSessionLike = { id: string; url: string | null }

export type StripeRetrievedSessionLike = {
  id: string
  status: string | null
  payment_status: string
  amount_total: number | null
  currency: string | null
  metadata: Record<string, string> | null
}

export type StripeEventLike = {
  id: string
  type: string
  data: {
    object: {
      id: string
      metadata?: Record<string, string> | null
      payment_status?: string | null
    }
  }
}

export type StripeLike = {
  checkout: {
    sessions: {
      create(
        params: CheckoutSessionParams,
        options?: { idempotencyKey?: string }
      ): Promise<StripeCreatedSessionLike>
      retrieve(id: string): Promise<StripeRetrievedSessionLike>
    }
  }
  webhooks: {
    constructEventAsync(payload: string, signature: string, secret: string): Promise<StripeEventLike>
  }
}

export type LineItemsResult =
  | { ok: true; lineItems: CheckoutLineItem[]; shippingOptions: CheckoutShippingOption[]; totalCents: number }
  | { ok: false }

const DELIVERY_LABELS: Record<DeliveryId, string> = {
  standard: 'Standard shipping',
  express: 'Express shipping',
}

export function buildLineItems(
  items: { sku: string; qty: number }[],
  delivery: DeliveryId,
  siteUrl: string
): LineItemsResult {
  const lineItems: CheckoutLineItem[] = []
  let subtotal = 0
  const withImages = siteUrl.startsWith('https://')

  for (const item of items) {
    const variant = parseSku(item.sku)
    const product = variant ? productBySlug(variant.productSlug) : undefined
    if (!variant || !product) return { ok: false }

    const size = sizeById(variant.sizeId)
    const palette = PALETTES[variant.paletteId]
    const unitCents = variantPriceCents(product, variant.sizeId)
    subtotal += unitCents * item.qty

    lineItems.push({
      quantity: item.qty,
      price_data: {
        currency: 'usd',
        unit_amount: unitCents,
        product_data: {
          name: `${product.name} · ${size.label} · ${palette.name}`,
          ...(withImages ? { images: [`${siteUrl}/posters/${product.slug}.png`] } : {}),
        },
      },
    })
  }

  const shipping = shippingCents(subtotal, delivery)
  const shippingOptions: CheckoutShippingOption[] = [
    {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: shipping, currency: 'usd' },
        display_name: DELIVERY_LABELS[delivery],
      },
    },
  ]

  return { ok: true, lineItems, shippingOptions, totalCents: subtotal + shipping }
}

export async function idempotencyKey(
  orderId: string,
  items: { sku: string; qty: number }[],
  delivery: DeliveryId,
  email?: string
): Promise<string> {
  const sorted = [...items].sort((a, b) => a.sku.localeCompare(b.sku))
  const canonical = `${orderId}|${delivery}|${sorted.map(item => `${item.sku}:${item.qty}`).join(',')}|${email ?? ''}`
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

export type CreateSessionResult =
  | { ok: true; url: string; id: string }
  | { ok: false; status: number; error: string }

export async function createSession(
  stripe: StripeLike,
  input: CheckoutSessionInput,
  env: Env
): Promise<CreateSessionResult> {
  const built = buildLineItems(input.items, input.delivery, env.SITE_URL)
  if (!built.ok) return { ok: false, status: 400, error: 'Unknown SKU' }

  const key = await idempotencyKey(input.orderId, input.items, input.delivery, input.email)
  const params: CheckoutSessionParams = {
    mode: 'payment',
    line_items: built.lineItems,
    shipping_options: built.shippingOptions,
    success_url: `${env.SITE_URL}/checkout/success/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.SITE_URL}/checkout/`,
    metadata: { orderId: input.orderId },
    ...(input.email ? { customer_email: input.email } : {}),
  }

  let session: StripeCreatedSessionLike
  try {
    session = await stripe.checkout.sessions.create(params, { idempotencyKey: key })
  } catch {
    return { ok: false, status: 502, error: 'Could not create a checkout session' }
  }
  if (!session.url) return { ok: false, status: 502, error: 'Stripe did not return a checkout url' }
  return { ok: true, url: session.url, id: session.id }
}

export type GetSessionResult =
  | {
      ok: true
      body: {
        id: string
        status: string | null
        payment_status: string
        amount_total: number | null
        currency: string | null
        orderId: string | null
      }
    }
  | { ok: false; status: number; error: string }

export async function getSession(stripe: StripeLike, id: string): Promise<GetSessionResult> {
  if (!/^cs_[A-Za-z0-9_]{1,255}$/.test(id)) return { ok: false, status: 400, error: 'Invalid session id' }
  try {
    const session = await stripe.checkout.sessions.retrieve(id)
    return {
      ok: true,
      body: {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        orderId: session.metadata?.orderId ?? null,
      },
    }
  } catch (error) {
    const { code, statusCode } = error as { code?: unknown; statusCode?: unknown }
    if (code === 'resource_missing' || statusCode === 404) {
      return { ok: false, status: 404, error: 'Session not found' }
    }
    console.error('checkout: session lookup failed', code ?? statusCode ?? (error instanceof Error ? error.message : 'unknown'))
    return { ok: false, status: 502, error: 'Session lookup failed' }
  }
}
