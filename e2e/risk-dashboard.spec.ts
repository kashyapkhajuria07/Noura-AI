import { test, expect } from '@playwright/test';

async function loginAsStudent(page) {
  const csrfResp = await page.request.get('/api/auth/csrf');
  const { csrfToken } = await csrfResp.json();
  await page.request.post('/api/auth/callback/mock-lms', {
    form: { csrfToken, email: 'e2e@test.edu', password: 'testpass' },
  });
}

test.describe('Risk Dashboard', () => {
  test('risk page loads and shows dashboard elements', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/risk-dashboard');
    await expect(page.locator('h1')).toContainText('Student Risk Overview');
    await expect(page.locator('text=LOW').first()).toBeVisible();
    await expect(page.locator('text=MEDIUM').first()).toBeVisible();
    await expect(page.locator('text=HIGH').first()).toBeVisible();
  });

  test('chat modal opens from risk page', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/risk-dashboard');
    const chatBtn = page.locator('button:has-text("Chat")');
    if (await chatBtn.isVisible()) {
      await chatBtn.click();
      await expect(page.locator('text=Support Chat')).toBeVisible({ timeout: 3000 });
    }
  });
});
