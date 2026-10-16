// @vitest-environment node
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {
  keptPaths,
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

const STORAGE_ROOT = `https://${ENV.BUNNY_STORAGE_HOST}/${ENV.BUNNY_STORAGE_ZONE}/`

function jsonResponse(body) {
  return { ok: true, status: 200, json: async () => body }
}

// A storage zone whose GET answers come from `responses`, keyed by the path under the zone; every call is recorded.
function fakeStorage(responses) {
  const calls = []
  const fetchImpl = vi.fn(async (url, options = {}) => {
    const method = options.method ?? 'GET'
    const storagePath = url.slice(STORAGE_ROOT.length)

    calls.push({ method, path: storagePath, body: options.body })

    if (method === 'GET') {
      return jsonResponse(responses[storagePath] ?? [])
    }

    return { ok: true, status: 200 }
  })

  return { calls, fetchImpl }
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

      const timeoutSpy = vi.spyOn(AbortSignal, 'timeout')
      const calls = []
      const fetchImpl = vi.fn(async (url, options) => {
        calls.push({ url, method: options.method, body: options.body, accessKey: options.headers.AccessKey })

        return calls.length === 1 ? { ok: false, status: 503 } : { ok: true, status: 200 }
      })

      const bytes = await uploadFile(ENV, file, { outDir, fetchImpl })

      expect(fetchImpl).toHaveBeenCalledTimes(2)
      expect(calls.every(call => call.method === 'PUT')).toBe(true)
      expect(calls[1].body).toBe(calls[0].body)
      expect(calls.every(call => call.accessKey === 'storage-secret')).toBe(true)
      expect(timeoutSpy.mock.calls).toEqual([[60_000], [60_000]])
      expect(bytes).toBe(Buffer.byteLength('console.log(1)'))
    } finally {
      vi.restoreAllMocks()
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

  test('uploads the build, deletes what neither build holds, records the build and purges twice, in order', async () => {
    const outDir = await makeOutDir()
    const { calls, fetchImpl } = fakeStorage({
      '': [
        { ObjectName: 'old.txt', IsDirectory: false },
        { ObjectName: 'old-dir', IsDirectory: true },
        { ObjectName: 'deploy-manifest.json', IsDirectory: false },
      ],
      'old-dir/': [{ ObjectName: 'inner.txt', IsDirectory: false }],
      'deploy-manifest.json': { files: ['index.html'] },
    })
    const pause = async ms => calls.push({ method: 'PAUSE', path: String(ms) })
    const logLines = []

    try {
      await mkdir(path.join(outDir, 'assets'))
      await writeFile(path.join(outDir, 'index.html'), '<html></html>')
      await writeFile(path.join(outDir, 'assets', 'app.js'), 'console.log(1)')

      await main({ env: ENV, fetchImpl, outDir, log: line => logLines.push(line), pause })

      const methods = calls.map(call => call.method)
      const paths = calls.map(call => call.path)

      expect(methods).toEqual(['GET', 'GET', 'GET', 'PUT', 'PUT', 'DELETE', 'DELETE', 'DELETE', 'PUT', 'POST', 'PAUSE', 'POST'])
      expect(paths.slice(0, 9)).toEqual([
        '',
        'old-dir/',
        'deploy-manifest.json',
        'assets/app.js',
        'index.html',
        'old.txt',
        'old-dir/inner.txt',
        'old-dir/',
        'deploy-manifest.json',
      ])
      expect(paths[10]).toBe('60000')

      expect(logLines).toHaveLength(1)
      expect(logLines[0]).toMatch(/uploaded 2 file\(s\)/)
      expect(logLines[0]).toMatch(/removed 2 file\(s\) and 1 empty directory\(ies\)/)
      expect(logLines[0]).toMatch(/cache purged twice/)
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }
  })

  test('a listing that answers 4xx stops the deploy before any upload and names the path', async () => {
    const outDir = await makeOutDir()

    try {
      await writeFile(path.join(outDir, 'index.html'), '<html></html>')

      const timeoutSpy = vi.spyOn(AbortSignal, 'timeout')
      const fetchImpl = vi.fn(async () => ({ ok: false, status: 404 }))

      await expect(main({ env: ENV, fetchImpl, outDir, log: () => {} })).rejects.toThrow(/list failed \(404\) for \//)

      expect(fetchImpl).toHaveBeenCalledTimes(1)
      expect(timeoutSpy.mock.calls).toEqual([[30_000]])
    } finally {
      vi.restoreAllMocks()
      await rm(outDir, { recursive: true, force: true })
    }
  })
})

describe('keptPaths', () => {
  test('keeps this build, the previous build and the manifest', () => {
    const remoteEntries = [
      { path: 'index.html', isDirectory: false },
      { path: 'old.js', isDirectory: false },
    ]

    const kept = keptPaths({ remoteEntries, localPaths: ['index.html', 'new.js'], previousPaths: ['index.html', 'old.js'] })

    expect(kept).toEqual(['index.html', 'new.js', 'index.html', 'old.js', 'deploy-manifest.json'])
  })

  test('without a manifest keeps every remote file', () => {
    const remoteEntries = [
      { path: 'assets', isDirectory: true },
      { path: 'assets/old.js', isDirectory: false },
    ]

    const kept = keptPaths({ remoteEntries, localPaths: ['index.html'], previousPaths: null })

    expect(kept).toEqual(['index.html', 'assets/old.js', 'deploy-manifest.json'])
  })
})

describe('main and the previous build', () => {
  const noPause = async () => {}

  async function deployBuild(responses) {
    const outDir = await makeOutDir()
    const storage = fakeStorage(responses)

    try {
      await mkdir(path.join(outDir, '_next'))
      await writeFile(path.join(outDir, 'index.html'), '<html></html>')
      await writeFile(path.join(outDir, '_next', 'new.js'), 'console.log(2)')

      await main({ env: ENV, fetchImpl: storage.fetchImpl, outDir, log: () => {}, pause: noPause })
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }

    return storage.calls
  }

  test('deletes only what neither build holds and records this build', async () => {
    const calls = await deployBuild({
      '': [{ ObjectName: 'index.html' }, { ObjectName: 'deploy-manifest.json' }, { ObjectName: '_next', IsDirectory: true }],
      '_next/': [{ ObjectName: 'old.js' }, { ObjectName: 'older.js' }],
      'deploy-manifest.json': { files: ['index.html', '_next/old.js'] },
    })

    const deleted = calls.filter(call => call.method === 'DELETE').map(call => call.path)
    const manifestPut = calls.find(call => call.method === 'PUT' && call.path === 'deploy-manifest.json')

    expect(deleted).toEqual(['_next/older.js'])
    expect(JSON.parse(manifestPut.body)).toEqual({ files: ['_next/new.js', 'index.html'] })
  })

  test('without a manifest in storage reads none and deletes nothing', async () => {
    const calls = await deployBuild({
      '': [{ ObjectName: 'index.html' }, { ObjectName: 'old.js' }],
    })

    const reads = calls.filter(call => call.method === 'GET').map(call => call.path)

    expect(reads).toEqual([''])
    expect(calls.some(call => call.method === 'DELETE')).toBe(false)
    expect(calls.some(call => call.method === 'PUT' && call.path === 'deploy-manifest.json')).toBe(true)
  })

  test('an unreadable manifest deletes nothing', async () => {
    const calls = await deployBuild({
      '': [{ ObjectName: 'old.js' }, { ObjectName: 'deploy-manifest.json' }],
      'deploy-manifest.json': [],
    })

    expect(calls.some(call => call.method === 'DELETE')).toBe(false)
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
