import { test, expect } from '@playwright/test'

test('the chosen theme survives a reload', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')

  await page.getByRole('radio', { name: 'Dark' }).click()
  await expect(html).toHaveClass(/\bdark\b/)

  await page.reload()
  await expect(html).toHaveClass(/\bdark\b/)
})

test('an invalid field keeps the destructive border at full strength in the dark theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/products/quiet-hours/')
  await page.getByRole('button', { name: 'Add to cart' }).click()
  // The toast's action button only appears once the hydrated cart has the item,
  // so waiting for it proves the add landed before the test navigates away.
  await expect(page.getByRole('button', { name: 'Open cart' })).toBeVisible()

  await page.goto('/checkout/')
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await page.getByRole('button', { name: /^Place demo order · \$/ }).click()

  const field = page.getByLabel('Email')
  await expect(field).toHaveAttribute('aria-invalid', 'true')

  const destructiveColor = await page.evaluate(() => {
    const probe = document.createElement('div')
    probe.style.color = 'var(--destructive)'
    document.body.appendChild(probe)
    const destructive = getComputedStyle(probe).color
    probe.remove()
    return destructive
  })

  // The border animates in through the field's transition-colors utility, so poll
  // instead of reading getComputedStyle once and racing the transition's end state.
  await expect
    .poll(() => field.evaluate((el) => getComputedStyle(el).borderColor))
    .toBe(destructiveColor)
})
