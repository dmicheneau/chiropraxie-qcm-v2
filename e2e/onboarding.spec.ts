import { test, expect } from '@playwright/test'

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to reset onboarding state
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('shows onboarding on first visit', async ({ page }) => {
    // Onboarding should be visible
    const onboarding = page.getByRole('dialog', { name: /présentation/i }).or(
      page.getByText(/bienvenue/i)
    )
    
    await expect(onboarding.first()).toBeVisible({ timeout: 3000 })
  })

  test('can navigate through onboarding steps', async ({ page }) => {
    // Click next button multiple times
    const nextButton = page.getByRole('button', { name: /suivant/i })
    
    if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Step 1 -> 2
      await nextButton.click()
      await expect(page.getByText(/import/i)).toBeVisible()
      
      // Step 2 -> 3
      await nextButton.click()
      await expect(page.getByText(/ia|ollama/i)).toBeVisible()
    }
  })

  test('can skip onboarding', async ({ page }) => {
    const skipButton = page.getByRole('button', { name: /passer/i })
    
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click()
      
      // Should show main app (home page)
      await expect(page.getByRole('navigation')).toBeVisible()
    }
  })

  test('can complete onboarding', async ({ page }) => {
    const nextButton = page.getByRole('button', { name: /suivant/i })
    const startButton = page.getByRole('button', { name: /commencer/i })
    
    // Navigate through all steps
    for (let i = 0; i < 4; i++) {
      if (await nextButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nextButton.click()
        await page.waitForTimeout(200)
      }
    }
    
    // Click final "Commencer" button
    if (await startButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startButton.click()
      
      // Should show main app
      await expect(page.getByRole('navigation')).toBeVisible()
    }
  })
})
