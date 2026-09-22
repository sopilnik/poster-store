import { test, expect } from '@playwright/test'

test('browse, filter, buy a poster, and confirm the order', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Browse the shop' }).click()
  await expect(page).toHaveURL(/\/shop\/$/)

  const count = page.locator('p[aria-live="polite"]')

  await page.getByRole('combobox', { name: 'Collection' }).click()
  await page.getByRole('option', { name: 'Night' }).click()
  await expect(count).toHaveText('4 posters')

  await page.getByLabel('Search posters').fill('hush')
  await expect(count).toHaveText('1 poster')
  await expect(page).toHaveURL(/\?collection=night&q=hush$/)

  await page.goto('/shop/?collection=night')
  await expect(count).toHaveText('4 posters')
  await page.goto('/shop/?collection=night&q=hush')
  await expect(count).toHaveText('1 poster')
  await page.goBack()
  await expect(count).toHaveText('4 posters')
  await page.goForward()
  await expect(count).toHaveText('1 poster')

  await page.locator('a[href="/products/hush/"]').click()
  await expect(page).toHaveURL(/\/products\/hush\/$/)

  await page.getByRole('combobox', { name: 'Size' }).click()
  await page.getByRole('option', { name: /^A2/ }).click()
  await page.getByRole('textbox', { name: 'Quantity' }).fill('3')
  await page.getByRole('button', { name: 'Add to cart' }).click()

  const openCart = page.getByRole('button', { name: 'Open cart' })
  await expect(openCart).toBeVisible()
  await openCart.click()

  const cart = page.getByRole('dialog')
  await expect(cart.getByText('Hush', { exact: true })).toBeVisible()
  await expect(cart.getByText(/^A2/)).toBeVisible()
  await expect(cart.getByRole('textbox', { name: 'Quantity of Hush, A2' })).toHaveValue('3')

  await cart.getByRole('link', { name: 'Checkout' }).click()
  await expect(page).toHaveURL(/\/checkout\/$/)
  await expect(cart).toBeHidden()

  const summary = page.getByRole('region', { name: 'Order summary' })
  await expect(summary.getByText('Total', { exact: true })).toBeVisible()

  await page.getByLabel('Email').fill('demo@example.com')
  await page.getByLabel('Full name').fill('Ava Petrov')
  await page.getByLabel('Address').fill('12 Harbor Street')
  await page.getByLabel('City').fill('Almaty')
  await page.getByLabel('Postal code').fill('12345')
  await page.getByRole('radio', { name: /^Express/ }).click()

  const submit = page.getByRole('button', { name: /^Place demo order · \$/ })
  await expect(submit).toBeVisible()
  await expect(summary.getByText('$19.00', { exact: true })).toBeVisible()

  await submit.click()

  await expect(page).toHaveURL(/\/checkout\/success\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Thank you for your order')
  await expect(page.getByText(/^Order FL-[A-Z0-9]{6}$/)).toBeVisible()
  await expect(page.getByText('This is a demo. No payment was taken and nothing will ship.')).toBeVisible()

  await page.goBack()
  await expect(page.getByText('Your order was placed.')).toBeVisible()
})
