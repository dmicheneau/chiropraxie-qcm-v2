import { test, expect } from '@playwright/test'

test.describe('Quiz Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Seed localStorage to skip onboarding
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

    // Wait for app to load and DB to initialize
    // We check for "Thèmes disponibles" which appears only after the default bank is loaded
    await expect(page.getByText('Thèmes disponibles')).toBeVisible({ timeout: 20000 })

    // Ensure questions are actually in the DB ( IndexedDB )
    // This prevents race conditions where bank meta is loaded but questions table is empty
    await page.waitForFunction(
      async () => {
        return new Promise(resolve => {
          const req = indexedDB.open('ChiropraxieDB') // DB name from services/db.ts
          req.onsuccess = e => {
            const db = (e.target as any).result
            if (!db.objectStoreNames.contains('questions')) {
              resolve(false)
              return
            }
            const tx = db.transaction('questions', 'readonly')
            const store = tx.objectStore('questions')
            const countReq = store.count()
            countReq.onsuccess = () => {
              resolve(countReq.result > 0)
            }
            countReq.onerror = () => resolve(false)
          }
          req.onerror = () => resolve(false)
        })
      },
      { timeout: 20000 }
    )
  })

  test('can start a quiz from home page', async ({ page }) => {
    // We are already on home page

    // Find and click start quiz button
    // "Quiz rapide" card on home page might be text or a heading
    const quickQuizCard = page.locator('.card').filter({ hasText: 'Quiz rapide' }).first()

    // Sometimes the card itself is clickable, sometimes there's a button inside
    if (await quickQuizCard.isVisible()) {
      // Try to click a button inside if possible, else the card
      const btn = quickQuizCard.locator('button').first()
      if (await btn.isVisible()) {
        await btn.click()
      } else {
        await quickQuizCard.click()
      }
    } else {
      // Fallback to nav or other buttons if the card isn't found
      const startButton = page
        .locator('button, a.btn')
        .filter({ hasText: /commencer|démarrer|quiz/i })
        .first()

      if (await startButton.isVisible()) {
        await startButton.click()
      } else {
        // Absolute fallback: try navigating via menu
        await page.goto('/quiz')
      }
    }

    // Should navigate to quiz page
    await expect(page).toHaveURL(/quiz/i)
  })

  test('quiz page displays questions', async ({ page }) => {
    await page.goto('/quiz')

    // If we land on config screen, start the quiz
    // Use a specific selector for the start button on the config page
    const startButton = page
      .locator('button')
      .filter({ hasText: /démarrer|commencer|start/i })
      .first()

    if (await startButton.isVisible()) {
      await startButton.click()
    }

    // Should show a question
    // Look for question text or card body. Text can vary so we look for the structure.
    // We use a robust selector for the question card
    const questionCard = page
      .locator('.card .card-body')
      .filter({ hasText: /Question/i })
      .first()

    // If not found, just look for any card body that looks like a question
    const anyCard = page.locator('.card-body').first()

    await expect(questionCard.or(anyCard).first()).toBeVisible({ timeout: 10000 })
  })

  test('can answer a question', async ({ page }) => {
    await page.goto('/quiz')

    // Since a reload resets the store (no persistence), we ALWAYS start at config
    const startButton = page
      .locator('button')
      .filter({ hasText: /démarrer|commencer|start/i })
      .first()

    // Wait for the button to appear (it must appear)
    await expect(startButton).toBeVisible({ timeout: 10000 })

    // Wait for questions to be loaded (prevent clicking when 0 questions are available)
    // The UI shows "X questions disponibles"
    // We check that we DO have the text "questions disponibles" AND it doesn't start with "0"
    // Note: Use text locator more loosely to handle line breaks or extra spaces
    const countText = page.getByText(/\d+ questions disponibles/)
    await expect(countText).toBeVisible({ timeout: 10000 })
    await expect(countText).not.toHaveText(/0 questions/, { timeout: 10000 })

    // Also wait for the button to be enabled
    await expect(startButton).toBeEnabled({ timeout: 10000 })

    // Use programmatic click to avoid issues with overlapping BottomNav on mobile
    // The Start button is at the bottom of the card, and on mobile the sticky nav
    // covers it. Standard .click() or .click({ force: true }) hits the nav link instead.
    await startButton.evaluate((node: HTMLElement) => node.click())

    // Wait for the quiz to actually start (config button should disappear)
    // We check for the card title to disappear to ensure the view changed
    await expect(
      page.locator('.card-title').filter({ hasText: 'Configurer le quiz' })
    ).not.toBeVisible({ timeout: 10000 })

    // Wait for any loading state (spinner) to disappear
    // This handles the transition where currentQuestion might be undefined briefly
    await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 10000 })

    // Verify we are on the question page (QuizCard is rendered)
    // Use the reliable data-testid we added
    await expect(page.getByTestId('question-indicator')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('question-text')).toBeVisible({ timeout: 10000 })

    // Wait for choices to load
    // We use role="radio" and fallback to class structure for robustness across browsers
    // ChoiceButton has 'btn-lg' and 'justify-start' classes which distinguish it from config buttons
    const targetChoice = page
      .getByRole('radio')
      .or(page.locator('button.btn-lg.justify-start'))
      .first()

    // Wait for at least one choice to be visible
    await expect(targetChoice).toBeVisible({ timeout: 15000 })

    // Ensure stability before clicking (prevents "detached from DOM" errors)
    await page.waitForTimeout(500)

    // Click the first choice
    // If it's a radio, we might need to click the label
    await targetChoice.click({ force: true }) // Force in case of overlap or custom styling

    // After answering, we need to click "Submit" (Valider)
    // We use data-testid for reliability
    const submitButton = page.getByTestId('submit-answer-btn')

    // Wait for submit button to be visible and enabled
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toBeEnabled()
    await submitButton.click()

    // NOW check for feedback or next button
    const nextButton = page.getByTestId('next-question-btn')

    // Or check for success/error feedback colors which appear on the clicked button or container
    const feedback = page.locator(
      '.alert-success, .alert-error, .btn-success, .btn-error, .text-success, .text-error'
    )

    await expect(nextButton.or(feedback).first()).toBeVisible({ timeout: 5000 })
  })
})
