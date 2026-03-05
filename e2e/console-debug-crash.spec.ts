import { test, expect } from '@playwright/test';

test('debug crash with seeded storage', async ({ page }) => {
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', exception => console.log('PAGE ERROR:', exception));

  // Seed localStorage like debug-seed.spec.ts
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
  });

  await page.goto('/');
  
  // Wait a bit to catch startup logs and potential crash
  await page.waitForTimeout(5000);
  
  const body = await page.innerHTML('body');
  console.log('BODY HTML:', body);
});
