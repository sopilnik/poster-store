// This script has not run for real yet: the first deploy is its first live run.
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

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

async function main() {
  const env = readEnv()

  const outStat = await stat(OUT_DIR).catch(() => null)
  if (!outStat || !outStat.isDirectory()) {
    console.error(`deploy-bunny: build output not found at ${OUT_DIR}`)
    process.exit(1)
  }

  const files = await listFiles(OUT_DIR)
  const nonHtmlFiles = files.filter(file => path.extname(file) !== '.html')
  const htmlFiles = files.filter(file => path.extname(file) === '.html')
  let totalBytes = 0
  for (const file of [...nonHtmlFiles, ...htmlFiles]) {
    totalBytes += await uploadFile(env, file)
  }

  await purgeCache(env)

  console.log(`deploy-bunny: uploaded ${files.length} file(s), ${totalBytes} byte(s), cache purged`)
}

main().catch((error) => {
  console.error(`deploy-bunny: ${error.message}`)
  process.exit(1)
})
