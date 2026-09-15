import { absoluteUrl, SITE_URL } from './site'
test('site url has no trailing slash and joins paths', () => {
  expect(SITE_URL.endsWith('/')).toBe(false)
  expect(absoluteUrl('/shop/')).toBe(`${SITE_URL}/shop/`)
})
