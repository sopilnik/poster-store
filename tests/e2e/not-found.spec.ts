import { test, expect } from '@playwright/test'

test('an unknown path serves the 404 page', async ({ page, request }) => {
  const response = await request.get('/nothing/')
  expect(response.status()).toBe(404)

  await page.goto('/nothing/')
  await expect(page.getByText('This page does not exist.')).toBeVisible()
})
