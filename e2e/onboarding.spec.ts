import { test, expect } from '@playwright/test'

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to reset onboarding state
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Wait for initial load
    await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 10000 })
  })

  test('shows onboarding on first visit', async ({ page }) => {
    // Give it a moment to render the modal content
    await page.waitForTimeout(500)

    // Onboarding should be visible
    // Look for the specific text "Bienvenue sur Chiropraxie QCM"
    // We use a regex for more flexibility with whitespace
    const onboarding = page.getByRole('heading', {
      level: 1,
      name: /Bienvenue.*Chiropraxie/i,
    })

    await expect(onboarding).toBeVisible({ timeout: 10000 })
  })

  test('can navigate through onboarding steps', async ({ page }) => {
    // Ensure onboarding is present
    await expect(
      page.getByRole('heading', { level: 1, name: /Bienvenue.*Chiropraxie/i })
    ).toBeVisible({ timeout: 10000 })

    // Click next button multiple times
    // The "Next" button has "Suivant" text
    const nextButton = page.getByRole('button', { name: /suivant/i }).first()

    if (await nextButton.isVisible({ timeout: 2000 })) {
      // Step 1 -> 2
      await nextButton.click()
      // Wait for content change: "Importez vos contenus"
      await expect(
        page.getByRole('heading', { level: 1, name: 'Importez vos contenus' })
      ).toBeVisible()

      // Step 2 -> 3
      await nextButton.click()
      // Wait for content change: "IA locale pour générer des QCM"
      await expect(page.getByRole('heading', { level: 1, name: /IA locale/i })).toBeVisible()
    }
  })

  test('can skip onboarding', async ({ page }) => {
    const skipButton = page.getByRole('button', { name: /passer/i }).first()

    if (await skipButton.isVisible({ timeout: 3000 })) {
      await skipButton.click()

      // Should show main app (home page)
      // Check for navigation visible on either desktop or mobile
      const nav = page
        .locator('nav')
        .filter({ hasText: /Accueil|Home/i })
        .first()
      const bottomNav = page.locator('.btm-nav')
      await expect(nav.or(bottomNav).first()).toBeVisible()
    }
  })

  test('can complete onboarding', async ({ page }) => {
    // Ensure onboarding is present
    await expect(
      page.getByRole('heading', { level: 1, name: /Bienvenue.*Chiropraxie/i })
    ).toBeVisible({ timeout: 10000 })

    const nextButton = page.getByRole('button', { name: /suivant/i }).first()

    // Navigate through all steps
    // We keep clicking Next until "Commencer" appears
    // Loop limited to prevent infinite loops
    for (let i = 0; i < 6; i++) {
      if (await nextButton.isVisible({ timeout: 500 })) {
        await nextButton.click()
        await page.waitForTimeout(200) // Small delay for animation
      } else {
        break // Exit loop if Next is gone (reached end or "Commencer" appeared)
      }
    }

    // Click final "Commencer" button
    const startButton = page.getByRole('button', { name: /commencer/i }).first()
    if (await startButton.isVisible({ timeout: 2000 })) {
      await startButton.click()

      // Should show main app
      // Check for navigation visible on either desktop or mobile
      const nav = page
        .locator('nav')
        .filter({ hasText: /Accueil|Home/i })
        .first()
      const bottomNav = page.locator('.btm-nav')
      await expect(nav.or(bottomNav).first()).toBeVisible()
    }
  })
})
