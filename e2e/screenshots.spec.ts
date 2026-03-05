import { test, expect } from '@playwright/test'

/**
 * Screenshot capture script for README documentation.
 * Generates 7 screenshots showcasing the app's key pages and features.
 *
 * Run with: npx playwright test e2e/screenshots.spec.ts --project=chromium
 */

// Shared localStorage payload to skip onboarding
function makeSettingsPayload(theme = 'toulouse') {
  return JSON.stringify({
    state: {
      hasSeenOnboarding: true,
      theme,
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
}

test.describe.serial('README Screenshots', () => {
  // ──────────────────────────────────────────────────
  // 1. Home page — Toulouse theme, desktop viewport
  // ──────────────────────────────────────────────────
  test('home.png — Home page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    await page.addInitScript((payload: string) => {
      window.localStorage.setItem('chiropraxie-qcm-settings', payload)
    }, makeSettingsPayload('toulouse'))

    await page.goto('/')
    await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 10_000 })

    // Wait for the home title and stat cards
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.grid').first()).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(1500) // let animations settle

    await page.screenshot({ path: 'docs/screenshots/home.png', fullPage: false })
  })

  // ──────────────────────────────────────────────────
  // 2. Quiz config page
  // ──────────────────────────────────────────────────
  test('quiz.png — Quiz configuration', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    await page.addInitScript((payload: string) => {
      window.localStorage.setItem('chiropraxie-qcm-settings', payload)
    }, makeSettingsPayload('toulouse'))

    // Visit home first to initialize the default question bank in IndexedDB
    await page.goto('/')
    await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.grid').first()).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(500)

    await page.goto('/quiz')
    await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 10_000 })

    // Wait for quiz config card to be visible
    await expect(page.getByText('Configurer le quiz')).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(1000)

    await page.screenshot({ path: 'docs/screenshots/quiz.png', fullPage: false })
  })

  // ──────────────────────────────────────────────────
  // 3. Results page — play a quick quiz then capture
  // ──────────────────────────────────────────────────
  test('results.png — Quiz results', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    await page.addInitScript((payload: string) => {
      window.localStorage.setItem('chiropraxie-qcm-settings', payload)
    }, makeSettingsPayload('toulouse'))

    // Visit home first to initialize the default question bank in IndexedDB
    await page.goto('/')
    await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.grid').first()).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(500)

    await page.goto('/quiz')
    await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Configurer le quiz')).toBeVisible({ timeout: 10_000 })

    // Select 10 questions and start
    await page.getByRole('button', { name: '10' }).click()
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: 'Démarrer le quiz' }).click()

    // Wait for first question to appear
    await expect(page.locator('[data-testid="question-text"]')).toBeVisible({ timeout: 10_000 })

    // Answer all questions by clicking the first choice, submitting, then advancing
    for (let i = 0; i < 10; i++) {
      await expect(page.locator('[data-testid="question-text"]')).toBeVisible({ timeout: 5_000 })

      // Click the first choice button (not the submit/next buttons)
      const choices = page.locator('.space-y-3 > button')
      await choices.first().click()
      await page.waitForTimeout(200)

      // Submit
      const submitBtn = page.locator('[data-testid="submit-answer-btn"]')
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(300)
      }

      // Next
      const nextBtn = page.locator('[data-testid="next-question-btn"]')
      if (await nextBtn.isVisible()) {
        await nextBtn.click()
        await page.waitForTimeout(300)
      }
    }

    // Wait for results screen
    await expect(page.getByText(/Résultats|results/i)).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(1000)

    await page.screenshot({ path: 'docs/screenshots/results.png', fullPage: false })
  })

  // ──────────────────────────────────────────────────
  // 4. Stats page — seed progress data for charts
  // ──────────────────────────────────────────────────
  test('stats.png — Statistics dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    await page.addInitScript((payload: string) => {
      window.localStorage.setItem('chiropraxie-qcm-settings', payload)
    }, makeSettingsPayload('toulouse'))

    // Navigate to home first to let the DB initialize with default questions
    await page.goto('/')
    await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.grid').first()).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(1000)

    // Seed progress and session data directly into IndexedDB
    await page.evaluate(async () => {
      // Open the Dexie database directly
      const dbReq = indexedDB.open('chiropraxie-qcm-v2')
      await new Promise<void>((resolve, reject) => {
        dbReq.onsuccess = () => {
          const idb = dbReq.result

          // Fetch question IDs from the questions store
          const qTx = idb.transaction('questions', 'readonly')
          const qStore = qTx.objectStore('questions')
          const allReq = qStore.getAll()

          allReq.onsuccess = () => {
            const questions = allReq.result as Array<{ id: string; theme: string }>

            if (questions.length === 0) {
              resolve()
              return
            }

            const now = new Date().toISOString()
            const today = now.split('T')[0]

            // Create progress entries for the first 25 questions
            const progressTx = idb.transaction('progress', 'readwrite')
            const progressStore = progressTx.objectStore('progress')

            const subset = questions.slice(0, 25)
            for (let i = 0; i < subset.length; i++) {
              const q = subset[i]
              const isCorrect = i % 3 !== 0 // ~67% correct
              progressStore.put({
                questionId: q.id,
                attempts: 2 + (i % 3),
                correctAttempts: isCorrect ? 1 + (i % 2) : 0,
                lastAttemptAt: now,
                nextReview: now,
                easeFactor: 2.5,
                interval: isCorrect ? 1 + i : 0,
                repetitions: isCorrect ? 1 : 0,
              })
            }

            // Create a fake session
            const sessionTx = idb.transaction('sessions', 'readwrite')
            const sessionStore = sessionTx.objectStore('sessions')
            const sessionIds = subset.slice(0, 10).map(q => q.id)

            sessionStore.put({
              id: crypto.randomUUID(),
              bankId: 'default',
              questionsIds: sessionIds,
              answers: Object.fromEntries(sessionIds.map(id => [id, 'A'])),
              score: 7,
              startedAt: now,
              completedAt: now,
            })

            sessionStore.put({
              id: crypto.randomUUID(),
              bankId: 'default',
              questionsIds: sessionIds,
              answers: Object.fromEntries(sessionIds.map(id => [id, 'B'])),
              score: 5,
              startedAt: new Date(Date.now() - 86400000).toISOString(),
              completedAt: new Date(Date.now() - 86400000).toISOString(),
            })

            // Update streak
            const streakTx = idb.transaction('streaks', 'readwrite')
            const streakStore = streakTx.objectStore('streaks')
            streakStore.put({
              id: 'default',
              currentStreak: 5,
              longestStreak: 12,
              lastActivityDate: today,
              totalDaysActive: 18,
              createdAt: now,
              updatedAt: now,
            })

            // Wait for all transactions
            Promise.all([
              new Promise<void>(r => {
                progressTx.oncomplete = () => r()
              }),
              new Promise<void>(r => {
                sessionTx.oncomplete = () => r()
              }),
              new Promise<void>(r => {
                streakTx.oncomplete = () => r()
              }),
            ]).then(() => resolve())
          }

          allReq.onerror = () => reject(allReq.error)
        }
        dbReq.onerror = () => reject(dbReq.error)
      })
    })

    // Navigate to stats (fresh load so the stores pick up the seeded data)
    await page.goto('/stats')
    await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(2000) // let Chart.js render

    await page.screenshot({ path: 'docs/screenshots/stats.png', fullPage: false })
  })

  // ──────────────────────────────────────────────────
  // 5. Settings / Themes picker
  // ──────────────────────────────────────────────────
  test('themes.png — Theme picker in Settings', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    await page.addInitScript((payload: string) => {
      window.localStorage.setItem('chiropraxie-qcm-settings', payload)
    }, makeSettingsPayload('toulouse'))

    await page.goto('/settings')
    await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(1000)

    await page.screenshot({ path: 'docs/screenshots/themes.png', fullPage: false })
  })

  // ──────────────────────────────────────────────────
  // 6. Import page with tabs
  // ──────────────────────────────────────────────────
  test('import.png — Import page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    await page.addInitScript((payload: string) => {
      window.localStorage.setItem('chiropraxie-qcm-settings', payload)
    }, makeSettingsPayload('toulouse'))

    await page.goto('/import')
    await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(1000)

    await page.screenshot({ path: 'docs/screenshots/import.png', fullPage: false })
  })

  // ──────────────────────────────────────────────────
  // 7. Mobile dark — Home with iPhone 14 viewport + Nocturne theme
  // ──────────────────────────────────────────────────
  test('mobile-dark.png — Mobile dark mode (Nocturne)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })

    await page.addInitScript((payload: string) => {
      window.localStorage.setItem('chiropraxie-qcm-settings', payload)
    }, makeSettingsPayload('nocturne'))

    await page.goto('/')
    await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.grid').first()).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(1500)

    await page.screenshot({ path: 'docs/screenshots/mobile-dark.png', fullPage: false })
  })
})
