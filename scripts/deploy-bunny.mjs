// @ts-check
// main() uploads non-HTML files before HTML, then deletes every remote file
// (deepest directories first) that is absent from the current build, then
// purges the pull zone's cache.
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = path.resolve(process.cwd(), 'out')

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

const UPLOAD_RETRIES = 3
const UPLOAD_RETRY_DELAY_MS = 500
const UPLOAD_TIMEOUT_MS = 60_000
const REQUEST_TIMEOUT_MS = 30_000

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * @param {DeployEnv} env
 * @param {string} remote
 * @param {Buffer} body
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<Response>}
 */
async function putFile(env, remote, body, fetchImpl) {
  const url = `https://${env.BUNNY_STORAGE_HOST}/${env.BUNNY_STORAGE_ZONE}/${remote}`
  return fetchImpl(url, {
    method: 'PUT',
    headers: {
      AccessKey: env.BUNNY_STORAGE_PASSWORD,
      'Content-Type': 'application/octet-stream',
    },
    body,
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  })
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

  let lastError
  for (let attempt = 1; attempt <= UPLOAD_RETRIES; attempt += 1) {
    let response
    try {
      response = await putFile(env, remote, body, fetchImpl)
    } catch (error) {
      lastError = error
      if (attempt < UPLOAD_RETRIES) await sleep(UPLOAD_RETRY_DELAY_MS * attempt)
      continue
    }
    if (response.ok) return body.byteLength
    if (response.status < 500) {
      throw new Error(`upload failed (${response.status}) for ${remote}`)
    }
    lastError = new Error(`upload failed (${response.status}) for ${remote}`)
    if (attempt < UPLOAD_RETRIES) await sleep(UPLOAD_RETRY_DELAY_MS * attempt)
  }
  throw lastError
}

/**
 * @param {typeof fetch} fetchImpl
 * @param {string} url
 * @param {RequestInit} options
 * @param {string} describe
 * @param {number} timeoutMs
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(fetchImpl, url, options, describe, timeoutMs) {
  let lastError
  for (let attempt = 1; attempt <= UPLOAD_RETRIES; attempt += 1) {
    let response
    try {
      response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(timeoutMs) })
    } catch (error) {
      lastError = error
      if (attempt < UPLOAD_RETRIES) await sleep(UPLOAD_RETRY_DELAY_MS * attempt)
      continue
    }
    if (response.ok) return response
    if (response.status < 500) {
      throw new Error(`${describe} failed (${response.status})`)
    }
    lastError = new Error(`${describe} failed (${response.status})`)
    if (attempt < UPLOAD_RETRIES) await sleep(UPLOAD_RETRY_DELAY_MS * attempt)
  }
  throw lastError
}

/**
 * @param {DeployEnv} env
 * @param {typeof fetch} fetchImpl
 * @param {string} [dir]
 * @returns {Promise<RemoteEntry[]>}
 */
async function listRemote(env, fetchImpl, dir = '') {
  const url = `https://${env.BUNNY_STORAGE_HOST}/${env.BUNNY_STORAGE_ZONE}/${dir ? `${dir}/` : ''}`
  const response = await fetchWithRetry(fetchImpl, url, { headers: { AccessKey: env.BUNNY_STORAGE_PASSWORD } }, `list for ${dir || '/'}`, REQUEST_TIMEOUT_MS)
  const listing = /** @type {BunnyListingItem[]} */ (/** @type {unknown} */ (await response.json()))

  /** @type {RemoteEntry[]} */
  const entries = []
  for (const item of listing) {
    const entryPath = dir ? `${dir}/${encodeURIComponent(item.ObjectName)}` : encodeURIComponent(item.ObjectName)
    entries.push({ path: entryPath, isDirectory: Boolean(item.IsDirectory) })
    if (item.IsDirectory) entries.push(...(await listRemote(env, fetchImpl, entryPath)))
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
 * @param {string} remote
 * @param {boolean} isDirectory
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<void>}
 */
async function deleteRemote(env, remote, isDirectory, fetchImpl) {
  const url = `https://${env.BUNNY_STORAGE_HOST}/${env.BUNNY_STORAGE_ZONE}/${isDirectory ? `${remote}/` : remote}`
  await fetchWithRetry(fetchImpl, url, { method: 'DELETE', headers: { AccessKey: env.BUNNY_STORAGE_PASSWORD } }, `delete for ${remote}`, REQUEST_TIMEOUT_MS)
}

/**
 * @param {DeployEnv} env
 * @param {RemoteEntry[]} remoteEntries
 * @param {string[]} localPaths
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<{ files: number, dirs: number }>}
 */
async function removeStale(env, remoteEntries, localPaths, fetchImpl) {
  const { staleFiles, staleDirs } = staleEntries(remoteEntries, localPaths)
  for (const remote of staleFiles) await deleteRemote(env, remote, false, fetchImpl)
  for (const remote of staleDirs) await deleteRemote(env, remote, true, fetchImpl)
  return { files: staleFiles.length, dirs: staleDirs.length }
}

/**
 * @param {DeployEnv} env
 * @param {{ fetchImpl?: typeof fetch }} [options]
 * @returns {Promise<void>}
 */
export async function purgeCache(env, { fetchImpl = fetch } = {}) {
  const url = `https://api.bunny.net/pullzone/${env.BUNNY_PULL_ZONE_ID}/purgeCache`
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { AccessKey: env.BUNNY_API_KEY },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`purge failed (${response.status})`)
  }
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
  if (!files.some(file => remotePath(file, outDir) === 'index.html')) {
    throw new Error('out/ has no index.html, refusing to deploy')
  }
  const nonHtmlFiles = files.filter(file => path.extname(file) !== '.html')
  const htmlFiles = files.filter(file => path.extname(file) === '.html')
  const orderedFiles = [...nonHtmlFiles, ...htmlFiles]

  const remoteEntries = await listRemote(env, fetchImpl)

  let totalBytes = 0
  for (const file of orderedFiles) {
    totalBytes += await uploadFile(env, file, { outDir, fetchImpl })
  }

  const removed = await removeStale(env, remoteEntries, orderedFiles.map(file => remotePath(file, outDir)), fetchImpl)

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
