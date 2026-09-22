// main() uploads non-HTML files before HTML, then deletes every remote file
// (deepest directories last) that is absent from the current build, then
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

function readEnv() {
  const env = {}
  for (const name of REQUIRED_VARS) {
    const value = process.env[name]
    if (!value) {
      console.error(`deploy-bunny: missing required environment variable ${name}`)
      process.exit(1)
    }
    env[name] = value
  }
  return env
}

async function listFiles(dir) {
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

function remotePath(file) {
  return path.relative(OUT_DIR, file).split(path.sep).map(encodeURIComponent).join('/')
}

const UPLOAD_RETRIES = 3
const UPLOAD_RETRY_DELAY_MS = 500

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function putFile(env, remote, body) {
  const url = `https://${env.BUNNY_STORAGE_HOST}/${env.BUNNY_STORAGE_ZONE}/${remote}`
  return fetch(url, {
    method: 'PUT',
    headers: {
      AccessKey: env.BUNNY_STORAGE_PASSWORD,
      'Content-Type': 'application/octet-stream',
    },
    body,
  })
}

async function uploadFile(env, file) {
  const remote = remotePath(file)
  const body = await readFile(file)

  let lastError
  for (let attempt = 1; attempt <= UPLOAD_RETRIES; attempt += 1) {
    let response
    try {
      response = await putFile(env, remote, body)
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

async function listRemote(env, dir = '') {
  const url = `https://${env.BUNNY_STORAGE_HOST}/${env.BUNNY_STORAGE_ZONE}/${dir ? `${dir}/` : ''}`
  const response = await fetch(url, { headers: { AccessKey: env.BUNNY_STORAGE_PASSWORD } })
  if (!response.ok) throw new Error(`list failed (${response.status}) for ${dir || '/'}`)
  const listing = await response.json()

  const entries = []
  for (const item of listing) {
    const entryPath = dir ? `${dir}/${encodeURIComponent(item.ObjectName)}` : encodeURIComponent(item.ObjectName)
    entries.push({ path: entryPath, isDirectory: Boolean(item.IsDirectory) })
    if (item.IsDirectory) entries.push(...(await listRemote(env, entryPath)))
  }
  return entries
}

function staleEntries(remoteEntries, localPaths) {
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

async function deleteRemote(env, remote, isDirectory) {
  const url = `https://${env.BUNNY_STORAGE_HOST}/${env.BUNNY_STORAGE_ZONE}/${isDirectory ? `${remote}/` : remote}`
  const response = await fetch(url, { method: 'DELETE', headers: { AccessKey: env.BUNNY_STORAGE_PASSWORD } })
  if (!response.ok) throw new Error(`delete failed (${response.status}) for ${remote}`)
}

async function removeStale(env, localPaths) {
  const remoteEntries = await listRemote(env)
  const { staleFiles, staleDirs } = staleEntries(remoteEntries, localPaths)
  for (const remote of staleFiles) await deleteRemote(env, remote, false)
  for (const remote of staleDirs) await deleteRemote(env, remote, true)
  return { files: staleFiles.length, dirs: staleDirs.length }
}

async function purgeCache(env) {
  const url = `https://api.bunny.net/pullzone/${env.BUNNY_PULL_ZONE_ID}/purgeCache`
  const response = await fetch(url, {
    method: 'POST',
    headers: { AccessKey: env.BUNNY_API_KEY },
  })
  if (!response.ok) {
    throw new Error(`purge failed (${response.status})`)
  }
}

export async function main() {
  const env = readEnv()

  const outStat = await stat(OUT_DIR).catch(() => null)
  if (!outStat || !outStat.isDirectory()) {
    console.error(`deploy-bunny: build output not found at ${OUT_DIR}`)
    process.exit(1)
  }

  const files = await listFiles(OUT_DIR)
  const nonHtmlFiles = files.filter(file => path.extname(file) !== '.html')
  const htmlFiles = files.filter(file => path.extname(file) === '.html')
  const orderedFiles = [...nonHtmlFiles, ...htmlFiles]
  let totalBytes = 0
  for (const file of orderedFiles) {
    totalBytes += await uploadFile(env, file)
  }

  const removed = await removeStale(env, orderedFiles.map(remotePath))

  await purgeCache(env)

  console.log(
    `deploy-bunny: uploaded ${files.length} file(s), ${totalBytes} byte(s), ` +
      `removed ${removed.files} file(s) and ${removed.dirs} empty directory(ies), cache purged`
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`deploy-bunny: ${error.message}`)
    process.exit(1)
  })
}
