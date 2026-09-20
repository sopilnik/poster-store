import { test, expect } from '@playwright/test'

test('an unknown path serves the 404 page', async ({ page, request }) => {
  const response = await request.get('/nothing/')
  expect(response.status()).toBe(404)

  await page.goto('/nothing/')
  const main = page.getByRole('main')
  await expect(page.getByText('This page does not exist.')).toBeVisible()
  await expect(main.getByRole('link', { name: 'Home' })).toBeVisible()
  await expect(main.getByRole('link', { name: 'Shop' })).toBeVisible()
  await expect(page).toHaveTitle('Page not found · Formline')
})
