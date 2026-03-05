import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    // Seed localStorage to skip onboarding and land directly on Home
    // This avoids flaky UI interactions with the "Skip" button
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'chiropraxie-qcm-settings',
        JSON.stringify({
          state: {
            hasSeenOnboarding: true,
            theme: 'toulouse',
            quizSettings: {
              defaultQuestionCount: 20,
              showTimer: true,
              timerDuration: 1200,
              shuffleQuestions: true,
              shuffleChoices: true,
              showExplanations: true,
            },
            ollamaSettings: {
              enabled: false,
              apiUrl: 'http://localhost:11434',
              model: 'mistral:7b-instruct',
              timeout: 30000,
            },
          },
          version: 0,
        })
      )
    })

    await page.goto('/')

    // Wait for app to load (spinner to disappear)
    await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 10000 })

    // Wait for the stats cards to appear, which confirms async data loading is done
    // and the page layout is likely stable.
    // The home page uses a grid layout for stats cards, not .stats-vertical (that's settings page)
    await expect(page.locator('.grid').first()).toBeVisible({ timeout: 10000 })

    // Allow a brief moment for final layout shifts
    await page.waitForTimeout(500)
  })

  test('displays the home page correctly', async ({ page }) => {
    // Already on home from beforeEach

    // Should show main title
    // We look for the H1 specifically. The text might vary by translation, so we use a regex.
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Chiropraxie.*QCM/i, {
      timeout: 5000,
    })

    // Should have navigation
    // We check that at least one nav element is visible (desktop or mobile)
    const navs = page.locator('nav:visible, .btm-nav:visible')
    await expect(navs.first()).toBeVisible()
  })

  test('can navigate to quiz page', async ({ page }) => {
    // Navigate to quiz page
    // We target the link specifically in the visible navigation bar
    // Playwright will auto-wait for the element to be visible
    const quizLink = page.locator('a[href="/quiz"]:visible').first()
    await quizLink.click()
    await expect(page).toHaveURL(/\/quiz/)
  })

  test('can navigate to stats page', async ({ page }) => {
    // Use :visible to select the active navigation link (desktop or mobile)
    const statsLink = page.locator('a[href="/stats"]:visible').first()
    await statsLink.click()
    await expect(page).toHaveURL(/\/stats/)
  })

  test('can navigate to settings page', async ({ page }) => {
    const settingsLink = page.locator('a[href="/settings"]:visible').first()
    await settingsLink.click()
    await expect(page).toHaveURL(/\/settings/)
  })

  test('can navigate to import page', async ({ page }) => {
    const importLink = page.locator('a[href="/import"]:visible').first()
    await importLink.click()
    await expect(page).toHaveURL(/\/import/)
  })
})
