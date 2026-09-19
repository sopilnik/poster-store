import { test, expect } from '@playwright/test'

const paths = ['/', '/shop/', '/products/low-tide/']

for (const path of paths) {
  test(`no console or page errors on ${path}`, async ({ page }) => {
    const errors: string[] = []
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', error => {
      errors.push(error.message)
    })

    await page.goto(path)
    await page.waitForLoadState('networkidle')

    expect(errors).toEqual([])
  })
}
