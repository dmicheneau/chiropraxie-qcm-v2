import { test, expect } from '@playwright/test'

test.describe('Quiz Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Skip onboarding if shown
    const skipButton = page.getByRole('button', { name: 'Passer' })
    if (await skipButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await skipButton.click()
    }
  })

  test('can start a quiz from home page', async ({ page }) => {
    await page.goto('/')
    
    // Find and click start quiz button
    const startButton = page.getByRole('button', { name: /commencer|démarrer|quiz/i }).or(
      page.getByRole('link', { name: /commencer|démarrer|quiz/i })
    )
    
    if (await startButton.first().isVisible()) {
      await startButton.first().click()
      
      // Should navigate to quiz page
      await expect(page).toHaveURL(/quiz/i)
    }
  })

  test('quiz page displays questions', async ({ page }) => {
    await page.goto('/quiz')
    
    // Should show a question or quiz controls
    const questionText = page.locator('.card, [class*="question"]')
    await expect(questionText.first()).toBeVisible({ timeout: 5000 })
  })

  test('can answer a question', async ({ page }) => {
    await page.goto('/quiz')
    
    // Wait for choices to load
    const choices = page.getByRole('radio').or(page.locator('button[class*="btn"]'))
    
    // Wait for at least one choice to be visible
    await expect(choices.first()).toBeVisible({ timeout: 5000 })
    
    // Click the first choice
    await choices.first().click()
    
    // After answering, there should be feedback or next button
    const feedbackOrNext = page.getByRole('button', { name: /suivant|next|continuer/i }).or(
      page.locator('.text-success, .text-error')
    )
    
    await expect(feedbackOrNext.first()).toBeVisible({ timeout: 3000 })
  })
})
