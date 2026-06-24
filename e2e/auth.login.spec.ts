import { test, expect } from '@playwright/test';

async function loginAsStudent(page) {
  const csrfResp = await page.request.get('/api/auth/csrf');
  const { csrfToken } = await csrfResp.json();
  await page.request.post('/api/auth/callback/mock-lms', {
    form: { csrfToken, email: 'e2e@test.edu', password: 'testpass' },
  });
}

test.describe('Authentication', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('h1')).toContainText('Sign In');
  });

  test('mock LMS provider button exists', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('button:has-text("Mock LMS")').first()).toBeVisible();
  });

  test('can log in via mock LMS provider', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/dashboard');
    await expect(page).toHaveTitle(/Student Burnout/i);
  });
});
