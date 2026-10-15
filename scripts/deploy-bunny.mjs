// @ts-check
// main() uploads non-HTML files before HTML, then deletes every remote file
// (deepest directories first) that is absent from the current build, then
// purges the pull zone's cache.
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = path.resolve(process.cwd(), 'out')
const INDEX_FILE = 'index.html'
const HTML_EXTENSION = '.html'

const REQUIRED_VARS = [
  'BUNNY_STORAGE_ZONE',
  'BUNNY_STORAGE_HOST',
  'BUNNY_PULL_ZONE_ID',
  'BUNNY_STORAGE_PASSWORD',
  'BUNNY_API_KEY',
]

const BUNNY_STORAGE_HOST_PATTERN = /^([a-z0-9-]+\.)?storage\.bunnycdn\.com$/

/**
 * @typedef {Object} DeployEnv
 * @property {string} BUNNY_STORAGE_ZONE
 * @property {string} BUNNY_STORAGE_HOST
 * @property {string} BUNNY_PULL_ZONE_ID
 * @property {string} BUNNY_STORAGE_PASSWORD
 * @property {string} BUNNY_API_KEY
 */

/**
 * @typedef {Object} RemoteEntry
 * @property {string} path
 * @property {boolean} isDirectory
 */

/**
 * @typedef {Object} BunnyListingItem
 * @property {string} ObjectName
 * @property {boolean} [IsDirectory]
 */

/**
 * @param {Record<string, string | undefined>} source
 * @returns {DeployEnv}
 */
export function readEnv(source = process.env) {
  /** @type {Record<string, string>} */
  const raw = {}

  for (const name of REQUIRED_VARS) {
    const value = source[name]

    if (!value) {
      throw new Error(`missing required environment variable ${name}`)
    }

    raw[name] = value
  }

  const env = /** @type {DeployEnv} */ (raw)

  if (!BUNNY_STORAGE_HOST_PATTERN.test(env.BUNNY_STORAGE_HOST)) {
    throw new Error(`BUNNY_STORAGE_HOST must be a bunny storage host, got ${env.BUNNY_STORAGE_HOST}`)
  }

  return env
}

/**
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
export async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const full = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await listFiles(full)))
    } else if (entry.isFile()) {
      files.push(full)
    }
  }

  return files
}

/**
 * @param {string} file
 * @param {string} [outDir]
 * @returns {string}
 */
export function remotePath(file, outDir = OUT_DIR) {
  return path.relative(outDir, file).split(path.sep).map(encodeURIComponent).join('/')
}

const REQUEST_RETRIES = 3
const RETRY_DELAY_MS = 500
const UPLOAD_TIMEOUT_MS = 60_000
const REQUEST_TIMEOUT_MS = 30_000
// Responses from this status up are retried; anything below it fails at once.
const SERVER_ERROR_STATUS = 500
const ACCESS_KEY_HEADER = 'AccessKey'
const CONTENT_TYPE_HEADER = 'Content-Type'
const BUNNY_API_ORIGIN = 'https://api.bunny.net'

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * @param {DeployEnv} env
 * @param {string} storagePath
 * @returns {string}
 */
function storageUrl(env, storagePath) {
  return `https://${env.BUNNY_STORAGE_HOST}/${env.BUNNY_STORAGE_ZONE}/${storagePath}`
}

/**
 * @param {number} attempt
 * @returns {Promise<void>}
 */
async function pauseBeforeRetry(attempt) {
  if (attempt < REQUEST_RETRIES) {
    await sleep(RETRY_DELAY_MS * attempt)
  }
}

/**
 * @typedef {Object} RetriedRequest
 * @property {string} url
 * @property {RequestInit} init
 * @property {string} what the stage named in an error, such as "upload"
 * @property {string} [where] the path named in an error
 * @property {number} [timeoutMs]
 */

/**
 * @param {typeof fetch} fetchImpl
 * @param {RetriedRequest} request
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(fetchImpl, { url, init, what, where, timeoutMs = REQUEST_TIMEOUT_MS }) {
  let lastError

  for (let attempt = 1; attempt <= REQUEST_RETRIES; attempt += 1) {
    let response

    try {
      response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
    } catch (error) {
      lastError = error
      await pauseBeforeRetry(attempt)
      continue
    }

    if (response.ok) {
      return response
    }

    const failure = new Error(`${what} failed (${response.status})${where ? ` for ${where}` : ''}`)

    if (response.status < SERVER_ERROR_STATUS) {
      throw failure
    }

    lastError = failure
    await pauseBeforeRetry(attempt)
  }

  throw lastError
}

/**
 * @param {DeployEnv} env
 * @param {string} file
 * @param {{ outDir?: string, fetchImpl?: typeof fetch }} [options]
 * @returns {Promise<number>}
 */
export async function uploadFile(env, file, { outDir = OUT_DIR, fetchImpl = fetch } = {}) {
  const remote = remotePath(file, outDir)
  const body = await readFile(file)
  const headers = { [ACCESS_KEY_HEADER]: env.BUNNY_STORAGE_PASSWORD, [CONTENT_TYPE_HEADER]: 'application/octet-stream' }
  const init = { method: 'PUT', headers, body }

  await fetchWithRetry(fetchImpl, { url: storageUrl(env, remote), init, what: 'upload', where: remote, timeoutMs: UPLOAD_TIMEOUT_MS })

  return body.byteLength
}

/**
 * @param {DeployEnv} env
 * @param {typeof fetch} fetchImpl
 * @param {string} [dir]
 * @returns {Promise<RemoteEntry[]>}
 */
async function listRemote(env, fetchImpl, dir = '') {
  const url = storageUrl(env, dir ? `${dir}/` : '')
  const init = { headers: { [ACCESS_KEY_HEADER]: env.BUNNY_STORAGE_PASSWORD } }
  const response = await fetchWithRetry(fetchImpl, { url, init, what: 'list', where: dir || '/' })
  const listing = /** @type {BunnyListingItem[]} */ (await response.json())

  /** @type {RemoteEntry[]} */
  const entries = []

  for (const item of listing) {
    const entryPath = dir ? `${dir}/${encodeURIComponent(item.ObjectName)}` : encodeURIComponent(item.ObjectName)

    entries.push({ path: entryPath, isDirectory: Boolean(item.IsDirectory) })

    if (item.IsDirectory) {
      entries.push(...(await listRemote(env, fetchImpl, entryPath)))
    }
  }

  return entries
}

/**
 * @param {RemoteEntry[]} remoteEntries
 * @param {string[]} localPaths
 * @returns {{ staleFiles: string[], staleDirs: string[] }}
 */
export function staleEntries(remoteEntries, localPaths) {
  const local = new Set(localPaths)
  const staleFiles = remoteEntries
    .filter(e => !e.isDirectory)
    .map(e => e.path)
    .filter(p => !local.has(p))
  const staleDirs = remoteEntries
    .filter(e => e.isDirectory)
    .map(e => e.path)
    .filter(dir => ![...local].some(p => p === dir || p.startsWith(`${dir}/`)))
    .sort((a, b) => b.split('/').length - a.split('/').length)

  return { staleFiles, staleDirs }
}

/**
 * @param {DeployEnv} env
 * @param {{ remote: string, isDirectory: boolean }} target
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<void>}
 */
async function deleteRemote(env, { remote, isDirectory }, fetchImpl) {
  const url = storageUrl(env, isDirectory ? `${remote}/` : remote)
  const init = { method: 'DELETE', headers: { [ACCESS_KEY_HEADER]: env.BUNNY_STORAGE_PASSWORD } }

  await fetchWithRetry(fetchImpl, { url, init, what: 'delete', where: remote })
}

/**
 * @param {DeployEnv} env
 * @param {{ remoteEntries: RemoteEntry[], localPaths: string[] }} snapshot
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<{ files: number, dirs: number }>}
 */
async function removeStale(env, { remoteEntries, localPaths }, fetchImpl) {
  const { staleFiles, staleDirs } = staleEntries(remoteEntries, localPaths)

  for (const remote of staleFiles) {
    await deleteRemote(env, { remote, isDirectory: false }, fetchImpl)
  }
  for (const remote of staleDirs) {
    await deleteRemote(env, { remote, isDirectory: true }, fetchImpl)
  }

  return { files: staleFiles.length, dirs: staleDirs.length }
}

/**
 * @param {DeployEnv} env
 * @param {{ fetchImpl?: typeof fetch }} [options]
 * @returns {Promise<void>}
 */
export async function purgeCache(env, { fetchImpl = fetch } = {}) {
  const url = `${BUNNY_API_ORIGIN}/pullzone/${env.BUNNY_PULL_ZONE_ID}/purgeCache`
  const init = { method: 'POST', headers: { [ACCESS_KEY_HEADER]: env.BUNNY_API_KEY } }

  await fetchWithRetry(fetchImpl, { url, init, what: 'purge' })
}

/**
 * @param {{ env: DeployEnv, fetchImpl?: typeof fetch, outDir?: string, log?: (message: string) => void }} options
 * @returns {Promise<void>}
 */
export async function main({ env, fetchImpl = fetch, outDir = OUT_DIR, log = console.log }) {
  const outStat = await stat(outDir).catch(() => null)

  if (!outStat || !outStat.isDirectory()) {
    throw new Error(`build output not found at ${outDir}`)
  }

  const files = await listFiles(outDir)

  if (!files.some(file => remotePath(file, outDir) === INDEX_FILE)) {
    throw new Error('out/ has no index.html, refusing to deploy')
  }

  const nonHtmlFiles = files.filter(file => path.extname(file) !== HTML_EXTENSION)
  const htmlFiles = files.filter(file => path.extname(file) === HTML_EXTENSION)
  const orderedFiles = [...nonHtmlFiles, ...htmlFiles]

  const remoteEntries = await listRemote(env, fetchImpl)

  let totalBytes = 0

  for (const file of orderedFiles) {
    totalBytes += await uploadFile(env, file, { outDir, fetchImpl })
  }

  const localPaths = orderedFiles.map(file => remotePath(file, outDir))
  const removed = await removeStale(env, { remoteEntries, localPaths }, fetchImpl)

  await purgeCache(env, { fetchImpl })

  log(
    `deploy-bunny: uploaded ${files.length} file(s), ${totalBytes} byte(s), ` +
      `removed ${removed.files} file(s) and ${removed.dirs} empty directory(ies), cache purged`
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  Promise.resolve()
    .then(() => main({ env: readEnv() }))
    .catch((error) => {
      console.error(`deploy-bunny: ${error.message}`)
      process.exit(1)
    })
}
