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

async function uploadFile(env, file) {
  const remote = remotePath(file)
  const url = `https://${env.BUNNY_STORAGE_HOST}/${env.BUNNY_STORAGE_ZONE}/${remote}`
  const body = await readFile(file)
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      AccessKey: env.BUNNY_STORAGE_PASSWORD,
      'Content-Type': 'application/octet-stream',
    },
    body,
  })
  if (!response.ok) {
    throw new Error(`upload failed (${response.status}) for ${remote}`)
  }
  return body.byteLength
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
  let totalBytes = 0
  for (const file of files) {
    totalBytes += await uploadFile(env, file)
  }

  await purgeCache(env)

  console.log(`deploy-bunny: uploaded ${files.length} file(s), ${totalBytes} byte(s), cache purged`)
}

main().catch((error) => {
  console.error(`deploy-bunny: ${error.message}`)
  process.exit(1)
})
