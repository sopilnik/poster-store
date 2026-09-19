import { test, expect } from '@playwright/test'

test('the chosen theme survives a reload', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')
  const toggle = page.getByRole('button', { name: /^Switch theme/ })

  for (let attempt = 0; attempt < 3; attempt++) {
    await toggle.click()
    const classes = (await html.getAttribute('class')) ?? ''
    if (/\bdark\b/.test(classes)) break
  }
  await expect(html).toHaveClass(/\bdark\b/)

  await page.reload()
  await expect(html).toHaveClass(/\bdark\b/)
})
