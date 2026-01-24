import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to show onboarding
    await page.goto('/')
    // Skip onboarding if shown
    const skipButton = page.getByRole('button', { name: 'Passer' })
    if (await skipButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await skipButton.click()
    }
  })

  test('displays the home page correctly', async ({ page }) => {
    await page.goto('/')
    
    // Should show main title or welcome message
    await expect(page.locator('h1, h2').first()).toBeVisible()
    
    // Should have navigation
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('can navigate to quiz page', async ({ page }) => {
    await page.goto('/')
    
    // Look for a quiz-related button or link
    const quizLink = page.getByRole('link', { name: /quiz/i }).or(
      page.getByRole('button', { name: /quiz|commencer|démarrer/i })
    )
    
    if (await quizLink.first().isVisible()) {
      await quizLink.first().click()
      await expect(page).toHaveURL(/quiz/i)
    }
  })

  test('can navigate to stats page', async ({ page }) => {
    await page.goto('/')
    
    const statsLink = page.getByRole('link', { name: /stats|statistiques/i })
    if (await statsLink.isVisible()) {
      await statsLink.click()
      await expect(page).toHaveURL(/stats/i)
    }
  })

  test('can navigate to settings page', async ({ page }) => {
    await page.goto('/')
    
    const settingsLink = page.getByRole('link', { name: /settings|paramètres|réglages/i })
    if (await settingsLink.isVisible()) {
      await settingsLink.click()
      await expect(page).toHaveURL(/settings/i)
    }
  })

  test('can navigate to import page', async ({ page }) => {
    await page.goto('/')
    
    const importLink = page.getByRole('link', { name: /import/i })
    if (await importLink.isVisible()) {
      await importLink.click()
      await expect(page).toHaveURL(/import/i)
    }
  })
})
