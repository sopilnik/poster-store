// @vitest-environment node
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {
  main,
  purgeCache,
  readEnv,
  remotePath,
  staleEntries,
  uploadFile,
} from './deploy-bunny.mjs'

const ENV = {
  BUNNY_STORAGE_ZONE: 'testzone',
  BUNNY_STORAGE_HOST: 'teststorage.storage.bunnycdn.com',
  BUNNY_PULL_ZONE_ID: '123',
  BUNNY_STORAGE_PASSWORD: 'storage-secret',
  BUNNY_API_KEY: 'api-secret',
}

function jsonResponse(body) {
  return { ok: true, status: 200, json: async () => body }
}

async function makeOutDir() {
  return mkdtemp(path.join(os.tmpdir(), 'deploy-bunny-test-'))
}

describe('readEnv', () => {
  test('throws naming the missing variable', () => {
    const source = { ...ENV, BUNNY_API_KEY: '' }
    expect(() => readEnv(source)).toThrow(/BUNNY_API_KEY/)
  })

  test('throws on a storage host outside bunny', () => {
    const source = { ...ENV, BUNNY_STORAGE_HOST: 'evil.example.com' }
    expect(() => readEnv(source)).toThrow(/bunny storage host/)
  })

  test('accepts a regional storage host', () => {
    const source = { ...ENV, BUNNY_STORAGE_HOST: 'ny.storage.bunnycdn.com' }
    expect(readEnv(source).BUNNY_STORAGE_HOST).toBe('ny.storage.bunnycdn.com')
  })
})

describe('remotePath', () => {
  test('percent-encodes a space and a non-ASCII name', () => {
    const outDir = '/build/out'
    const file = path.join(outDir, 'my posters', 'плакат.png')
    expect(remotePath(file, outDir)).toBe('my%20posters/%D0%BF%D0%BB%D0%B0%D0%BA%D0%B0%D1%82.png')
  })
})

describe('staleEntries', () => {
  test('returns remote-minus-local files and deepest-first directories', () => {
    const remoteEntries = [
      { path: 'index.html', isDirectory: false },
      { path: 'old.txt', isDirectory: false },
      { path: 'archive', isDirectory: true },
      { path: 'archive/2024', isDirectory: true },
      { path: 'archive/2024/old.txt', isDirectory: false },
    ]
    const localPaths = ['index.html']

    const result = staleEntries(remoteEntries, localPaths)

    expect(result.staleFiles).toEqual(['old.txt', 'archive/2024/old.txt'])
    expect(result.staleDirs).toEqual(['archive/2024', 'archive'])
  })
})

describe('uploadFile', () => {
  test('retries a 5xx once and succeeds on 200', async () => {
    const outDir = await makeOutDir()
    try {
      const file = path.join(outDir, 'app.js')
      await writeFile(file, 'console.log(1)')

      const calls = []
      const fetchImpl = vi.fn(async (url, options) => {
        calls.push({ url, method: options.method })
        return calls.length === 1 ? { ok: false, status: 503 } : { ok: true, status: 200 }
      })

      const bytes = await uploadFile(ENV, file, { outDir, fetchImpl })

      expect(fetchImpl).toHaveBeenCalledTimes(2)
      expect(calls.every(call => call.method === 'PUT')).toBe(true)
      expect(bytes).toBe(Buffer.byteLength('console.log(1)'))
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }
  }, 10_000)

  test('a 4xx does not retry and throws', async () => {
    const outDir = await makeOutDir()
    try {
      const file = path.join(outDir, 'app.js')
      await writeFile(file, 'console.log(1)')

      const fetchImpl = vi.fn(async () => ({ ok: false, status: 404 }))

      await expect(uploadFile(ENV, file, { outDir, fetchImpl })).rejects.toThrow(/upload failed \(404\)/)
      expect(fetchImpl).toHaveBeenCalledTimes(1)
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }
  })
})

describe('main', () => {
  test('an empty out/ throws before any request', async () => {
    const outDir = await makeOutDir()
    try {
      const fetchImpl = vi.fn()
      await expect(main({ env: ENV, fetchImpl, outDir, log: () => {} })).rejects.toThrow(/index\.html/)
      expect(fetchImpl).not.toHaveBeenCalled()
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }
  })

  test('uploads before deleting stale entries and purges last, in order', async () => {
    const outDir = await makeOutDir()
    try {
      await mkdir(path.join(outDir, 'assets'))
      await writeFile(path.join(outDir, 'index.html'), '<html></html>')
      await writeFile(path.join(outDir, 'assets', 'app.js'), 'console.log(1)')

      const rootUrl = `https://${ENV.BUNNY_STORAGE_HOST}/${ENV.BUNNY_STORAGE_ZONE}/`
      const oldDirUrl = `https://${ENV.BUNNY_STORAGE_HOST}/${ENV.BUNNY_STORAGE_ZONE}/old-dir/`
      const listings = {
        [rootUrl]: [
          { ObjectName: 'old.txt', IsDirectory: false },
          { ObjectName: 'old-dir', IsDirectory: true },
        ],
        [oldDirUrl]: [{ ObjectName: 'inner.txt', IsDirectory: false }],
      }

      const calls = []
      const fetchImpl = vi.fn(async (url, options = {}) => {
        const method = options.method ?? 'GET'
        calls.push({ method, url })
        if (method === 'GET') return jsonResponse(listings[url] ?? [])
        return { ok: true, status: 200 }
      })

      const logLines = []
      await main({ env: ENV, fetchImpl, outDir, log: line => logLines.push(line) })

      const methods = calls.map(call => call.method)
      const getCount = methods.filter(method => method === 'GET').length
      const lastPutIndex = methods.lastIndexOf('PUT')
      const firstDeleteIndex = methods.indexOf('DELETE')
      const postIndex = methods.indexOf('POST')

      expect(getCount).toBe(2)
      expect(methods.slice(0, 2)).toEqual(['GET', 'GET'])
      expect(lastPutIndex).toBeLessThan(firstDeleteIndex)
      expect(postIndex).toBe(methods.length - 1)

      const putCalls = calls.filter(call => call.method === 'PUT')
      expect(putCalls[0].url.endsWith('/assets/app.js')).toBe(true)
      expect(putCalls[1].url.endsWith('/index.html')).toBe(true)

      const deleteCalls = calls.filter(call => call.method === 'DELETE')
      expect(deleteCalls[0].url.endsWith('/old.txt')).toBe(true)
      expect(deleteCalls[1].url.endsWith('/old-dir/inner.txt')).toBe(true)
      expect(deleteCalls[2].url.endsWith('/old-dir/')).toBe(true)

      expect(logLines).toHaveLength(1)
      expect(logLines[0]).toMatch(/uploaded 2 file\(s\)/)
      expect(logLines[0]).toMatch(/removed 2 file\(s\) and 1 empty directory\(ies\)/)
      expect(logLines[0]).toMatch(/cache purged/)
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }
  })
})

describe('purgeCache', () => {
  test('retries a 5xx and succeeds on the next attempt', async () => {
    const calls = []
    const fetchImpl = vi.fn(async (url, options) => {
      calls.push({ url, method: options.method })
      return calls.length === 1 ? { ok: false, status: 503 } : { ok: true, status: 200 }
    })

    await expect(purgeCache(ENV, { fetchImpl })).resolves.toBeUndefined()

    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(calls.every(call => call.method === 'POST')).toBe(true)
  }, 10_000)

  test('a 4xx does not retry and throws', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 404 }))

    await expect(purgeCache(ENV, { fetchImpl })).rejects.toThrow(/purge failed \(404\)/)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})
