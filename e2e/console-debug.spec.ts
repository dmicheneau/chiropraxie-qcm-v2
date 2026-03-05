import { test, expect } from '@playwright/test';

test('debug console logs', async ({ page }) => {
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', exception => console.log('PAGE ERROR:', exception));

  await page.goto('/');
  
  // Wait a bit to catch startup logs
  await page.waitForTimeout(5000);
  
  const body = await page.innerHTML('body');
  console.log('BODY HTML:', body);
});
