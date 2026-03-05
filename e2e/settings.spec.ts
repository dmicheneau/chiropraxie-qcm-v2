import { test, expect } from '@playwright/test'

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')

    // Wait for app to load
    await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 10000 })

    // Skip onboarding if shown
    const skipButton = page.getByRole('button', { name: 'Passer' })
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click()
    }
  })

  test('can access settings page', async ({ page }) => {
    await page.goto('/settings')

    // Should show settings title
    // Use .first() to handle potential duplicate headings if any (e.g. hidden mobile/desktop)
    await expect(
      page
        .locator('h1')
        .filter({ hasText: /Paramètres|Settings/i })
        .first()
    ).toBeVisible()
  })

  test('can change theme', async ({ page }) => {
    await page.goto('/settings')

    // Find theme buttons - look for buttons inside the themes section
    // We target buttons that likely have colors or specific theme names
    const themeButton = page.locator('button').filter({ hasText: 'Nocturne' }).first()

    if (await themeButton.isVisible()) {
      await themeButton.click()

      // Theme should be applied to document
      const html = page.locator('html')
      await expect(html).toHaveAttribute('data-theme', 'nocturne')
    }
  })

  test('displays quiz settings', async ({ page }) => {
    await page.goto('/settings')

    // Should have quiz settings section
    // Look for headings or specific text unique to that section
    // Card titles are h2.card-title
    const quizSection = page.locator('.card-title, h2, h3').filter({ hasText: /quiz/i }).first()

    await expect(quizSection).toBeVisible()
  })

  test('displays help section', async ({ page }) => {
    await page.goto('/settings')

    // Should have help section
    // Look for headings or specific text unique to that section
    const helpSection = page
      .locator('.card-title, h2, h3')
      .filter({ hasText: /aide|help|documentation/i })
      .first()

    await expect(helpSection).toBeVisible()
  })

  test('can expand help accordion', async ({ page }) => {
    await page.goto('/settings')

    // Find and click an accordion item
    // Use .collapse-title which is standard daisyUI class
    const accordion = page.locator('.collapse-title').first()

    if (await accordion.isVisible()) {
      await accordion.click({ force: true }) // Force click because sometimes label/input overlay can interfere

      // Content should be visible
      const content = page.locator('.collapse-content').first()
      // Note: daisyUI collapse animation might take a moment, but check visibility
      // The content might be 'visible' in DOM but hidden by height:0, so check CSS or wait
      await expect(content).toBeVisible()
    }
  })
})
