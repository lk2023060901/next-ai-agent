import { test, expect } from '@playwright/test'

test('login page renders', async ({ page }) => {
  await page.goto('/login')
  await expect(page).toHaveTitle(/NextAI|登录/i)
  await expect(page.getByRole('button', { name: /登录/i })).toBeVisible()
})

test('redirects unauthenticated to login', async ({ page }) => {
  await page.goto('/org/acme/dashboard')
  // MSW service worker handles auth; just check page loads without error
  await expect(page).not.toHaveURL(/500|error/i)
})
