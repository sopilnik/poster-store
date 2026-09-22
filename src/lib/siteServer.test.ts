import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { absoluteUrl, SITE_URL } from './siteServer'
test('site url has no trailing slash and joins paths', () => {
  expect(SITE_URL.endsWith('/')).toBe(false)
  expect(absoluteUrl('/shop/')).toBe(`${SITE_URL}/shop/`)
})
beforeEach(() => { vi.resetModules() })
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })
test('SITE_URL from the environment loses its trailing slash', async () => {
  vi.stubEnv('SITE_URL', 'https://posters.example.com/')
  const { SITE_URL, absoluteUrl } = await import('./siteServer')
  expect(SITE_URL).toBe('https://posters.example.com')
  expect(absoluteUrl('shop/')).toBe('https://posters.example.com/shop/')
})
