import { expect, test } from 'vitest'
import { pageMetadata } from './metadata'
import { BRAND } from './site'
import { absoluteUrl } from './siteServer'

test('pageMetadata builds the canonical, the open graph url and the title suffix once', () => {
  const metadata = pageMetadata({ title: 'X', description: 'd', path: '/shop/' })
  expect(metadata.alternates?.canonical).toBe(absoluteUrl('/shop/'))
  expect(metadata.openGraph?.url).toBe(absoluteUrl('/shop/'))
  expect(metadata.title).toEqual({ absolute: `X · ${BRAND}` })
})

test('pageMetadata defaults the open graph image to the default og image', () => {
  const metadata = pageMetadata({ title: 'X', description: 'd', path: '/shop/' })
  const images = metadata.openGraph?.images
  expect(Array.isArray(images) ? images[0] : images).toMatchObject({ url: '/og/default.png' })
})
