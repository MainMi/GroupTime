const { test, expect } = require('@playwright/test');

// Smoke test: the public About page (route '/') renders without a backend.
// Proves the toolchain (dev server boot + Playwright) is wired end-to-end.
test('about page renders the GroupTime heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'GroupTime', level: 1 })).toBeVisible();
});
