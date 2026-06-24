import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'e2e-chat@test.edu';
const TEST_PASS = 'testpass';

async function loginAsStudent(page) {
  const csrfResp = await page.request.get('/api/auth/csrf');
  const { csrfToken } = await csrfResp.json();
  await page.request.post('/api/auth/callback/mock-lms', {
    form: { csrfToken, email: TEST_EMAIL, password: TEST_PASS },
  });
}

test.describe('Chat', () => {
  test('chat API returns LLM response', async ({ page }) => {
    await loginAsStudent(page);
    const resp = await page.request.post('/api/chat', {
      data: { message: 'I need help managing my time', history: [] },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.bot.content.length).toBeGreaterThan(10);
    expect(body.data.quickReplies.length).toBeGreaterThanOrEqual(2);
  });

  test('chat history GET returns messages', async ({ page }) => {
    await loginAsStudent(page);
    const historyResp = await page.request.get('/api/chat?limit=10');
    expect(historyResp.status()).toBe(200);
    const history = await historyResp.json();
    expect(Array.isArray(history.data)).toBe(true);
  });

  test('chat API requires authentication', async ({ page }) => {
    const resp = await page.request.post('/api/chat', {
      data: { message: 'hello', history: [] },
    });
    expect(resp.status()).toBe(401);
  });
});
