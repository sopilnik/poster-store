import { expect, test } from 'vitest'
import { absoluteUrl } from '@/lib/siteServer'
import robots from './robots'

test('robots allows everything and points at the sitemap', () => {
  const result = robots()
  expect(result.rules).toEqual({ userAgent: '*', allow: '/' })
  expect(result.sitemap).toBe(absoluteUrl('/sitemap.xml'))
})
