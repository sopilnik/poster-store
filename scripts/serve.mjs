import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
const root = path.resolve('out'), port = Number(process.env.PORT ?? 4321)
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' }
async function resolve(urlPath) {
  let decoded
  try { decoded = decodeURIComponent(urlPath.split('?')[0]) } catch { return { file: path.join(root, '404.html'), status: 404 } }
  const clean = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '')
  const candidates = clean.endsWith('/') ? [path.join(root, clean, 'index.html')] : [path.join(root, clean), path.join(root, clean, 'index.html')]
  for (const c of candidates) {
    const rel = path.relative(root, c)
    if (rel.startsWith('..') || path.isAbsolute(rel)) continue
    try { if ((await stat(c)).isFile()) return { file: c, status: 200 } } catch {}
  }
  return { file: path.join(root, '404.html'), status: 404 }
}
createServer(async (req, res) => {
  const { file, status } = await resolve(req.url ?? '/')
  const body = await readFile(file).catch(() => null)
  if (!body) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }); return res.end('not found') }
  res.writeHead(status, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' }); res.end(body)
}).listen(port, () => console.log(`serving out/ on http://localhost:${port}`))
