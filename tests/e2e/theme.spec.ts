import { test, expect } from '@playwright/test'

test('the chosen theme survives a reload', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')

  await page.getByRole('radio', { name: 'Dark' }).click()
  await expect(html).toHaveClass(/\bdark\b/)

  await page.reload()
  await expect(html).toHaveClass(/\bdark\b/)
})
