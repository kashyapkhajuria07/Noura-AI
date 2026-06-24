import { test, expect } from '@playwright/test';

async function loginAsStudent(page) {
  const csrfResp = await page.request.get('/api/auth/csrf');
  const { csrfToken } = await csrfResp.json();
  await page.request.post('/api/auth/callback/mock-lms', {
    form: { csrfToken, email: 'e2e@test.edu', password: 'testpass' },
  });
}

test.describe('Reflection & Journal', () => {
  test('reflection page loads with tabs', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/reflection');
    await expect(page.locator('h1')).toContainText('Journal & Mood Tracking');
    await expect(page.locator('button:has-text("Journal")')).toBeVisible();
    await expect(page.locator('button:has-text("Mood Tracker")')).toBeVisible();
    await expect(page.locator('button:has-text("Progress")')).toBeVisible();
  });
});
