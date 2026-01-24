import { test, expect } from '@playwright/test'

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Skip onboarding if shown
    const skipButton = page.getByRole('button', { name: 'Passer' })
    if (await skipButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await skipButton.click()
    }
  })

  test('can access settings page', async ({ page }) => {
    await page.goto('/settings')
    
    // Should show settings title
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('can change theme', async ({ page }) => {
    await page.goto('/settings')
    
    // Find theme buttons
    const themeButton = page.locator('button').filter({ hasText: /nocturne|forest|ocean/i }).first()
    
    if (await themeButton.isVisible()) {
      await themeButton.click()
      
      // Theme should be applied to document
      const html = page.locator('html')
      await expect(html).toHaveAttribute('data-theme', /.+/)
    }
  })

  test('displays quiz settings', async ({ page }) => {
    await page.goto('/settings')
    
    // Should have quiz settings section
    const quizSection = page.getByText(/quiz|questions/i)
    await expect(quizSection.first()).toBeVisible()
  })

  test('displays help section', async ({ page }) => {
    await page.goto('/settings')
    
    // Should have help section
    const helpSection = page.getByText(/aide|help|documentation/i)
    await expect(helpSection.first()).toBeVisible()
  })

  test('can expand help accordion', async ({ page }) => {
    await page.goto('/settings')
    
    // Find and click an accordion item
    const accordion = page.locator('.collapse-title').first()
    
    if (await accordion.isVisible()) {
      await accordion.click()
      
      // Content should be visible
      const content = page.locator('.collapse-content').first()
      await expect(content).toBeVisible()
    }
  })
})
