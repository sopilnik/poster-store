import { test, expect } from '@playwright/test'

test('the response carries the documented security headers', async ({ request }) => {
  const response = await request.get('/')
  const headers = response.headers()

  expect(headers['content-security-policy']).toContain("default-src 'self'")
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(headers['permissions-policy']).toContain('geolocation=()')
  expect(headers['cross-origin-opener-policy']).toBe('same-origin')
  expect(headers['x-robots-tag']).toBe('noindex')
})
