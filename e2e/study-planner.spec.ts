import { test, expect } from '@playwright/test';

async function loginAsStudent(page) {
  const csrfResp = await page.request.get('/api/auth/csrf');
  const { csrfToken } = await csrfResp.json();
  await page.request.post('/api/auth/callback/mock-lms', {
    form: { csrfToken, email: 'e2e@test.edu', password: 'testpass' },
  });
}

test.describe('Study Planner', () => {
  test('planner page loads with board and calendar tabs', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/study-planner');
    await expect(page.locator('h1')).toContainText('Task Board & Schedule');
    await expect(page.locator('button:has-text("Task Board")')).toBeVisible();
    await expect(page.locator('button:has-text("Calendar")')).toBeVisible();
  });
});
