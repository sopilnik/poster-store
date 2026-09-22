import { test, expect } from '@playwright/test'

test('the quantity field takes focus and input at 390 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/products/quiet-hours/')

  const field = page.getByRole('textbox', { name: 'Quantity' })
  await field.dblclick()
  await expect(field).toBeFocused()

  await page.keyboard.type('7')
  await expect(field).toHaveValue('7')
})
