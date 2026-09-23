// @ts-check
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve('out')
const port = Number(process.env.PORT ?? 4321)

try {
  if (!(await stat(path.join(root, 'index.html'))).isFile()) throw new Error()
} catch {
  console.error('serve: no build in out/ — run pnpm build first')
  process.exit(1)
}

/** @type {Record<string, string>} */
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
}

// The bunny edge rule (README, "Deployment headers") sets seven response headers; this preview
// serves the same set except Strict-Transport-Security and the CSP's upgrade-insecure-requests
// directive, both of which only mean something over https and this preview is plain http.
const securityHeaders = {
  'content-security-policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src https://checkout.stripe.com; " +
    "form-action 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'geolocation=(), camera=(), microphone=(), payment=(), usb=()',
  'cross-origin-opener-policy': 'same-origin',
  'x-robots-tag': 'noindex',
}

/**
 * @param {string} urlPath
 * @returns {Promise<{ file: string, status: number }>}
 */
async function resolve(urlPath) {
  let decoded
  try {
    decoded = decodeURIComponent(/** @type {string} */ (urlPath.split('?')[0]))
  } catch {
    return { file: path.join(root, '404.html'), status: 404 }
  }
  const clean = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '')
  const candidates = clean.endsWith('/')
    ? [path.join(root, clean, 'index.html')]
    : [path.join(root, clean), path.join(root, clean, 'index.html')]
  for (const c of candidates) {
    const rel = path.relative(root, c)
    if (rel.startsWith('..') || path.isAbsolute(rel)) continue
    try {
      if ((await stat(c)).isFile()) return { file: c, status: 200 }
    } catch {
      // a stat failure here just means "try the next candidate"
    }
  }
  return { file: path.join(root, '404.html'), status: 404 }
}

const server = createServer(async (req, res) => {
  const { file, status } = await resolve(req.url ?? '/')
  const body = await readFile(file).catch(() => null)
  if (!body) {
    res.writeHead(404, {
      ...securityHeaders,
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    })
    return res.end('not found')
  }
  res.writeHead(status, {
    ...securityHeaders,
    'content-type': types[path.extname(file)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  })
  res.end(body)
})

server.on('error', (/** @type {NodeJS.ErrnoException} */ error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`serve: port ${port} is in use`)
  } else {
    console.error(`serve: ${error.message}`)
  }
  process.exit(1)
})

server.listen(port, '127.0.0.1', () => console.log(`serving out/ on http://localhost:${port}`))
