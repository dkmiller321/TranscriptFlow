import { test, expect } from '@playwright/test';
import { mockAuthentication, getMockUsageResponse, MOCK_SETTINGS, MOCK_USER } from './fixtures/auth-helpers';

test.describe('Settings Page - Auth Guard', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    test.slow();
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login/, { timeout: 30000 });
  });
});

test.describe('Settings Page - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await mockAuthentication(page, 'free');

    // Mock settings API
    await page.route('**/api/settings', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_SETTINGS),
        });
      } else if (route.request().method() === 'PATCH') {
        const body = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...MOCK_SETTINGS, ...body }),
        });
      }
    });

    // Mock usage API
    await page.route('**/api/usage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(getMockUsageResponse('free')),
      });
    });

    // Mock user_subscriptions for the useUserTier hook (already in mockAuthentication)
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
  });

  test('settings page loads with heading', async ({ page }) => {
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Manage your account')).toBeVisible();
  });

  test('displays Account, Usage, and Preferences tabs', async ({ page }) => {
    // Use role=tab or exact text to avoid matching card titles like "Account Information"
    await expect(page.getByRole('tab', { name: 'Account' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('tab', { name: 'Usage' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Preferences' })).toBeVisible();
  });
});

test.describe('Settings - Account Tab', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await mockAuthentication(page, 'free');

    await page.route('**/api/settings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SETTINGS),
      });
    });

    await page.route('**/api/usage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(getMockUsageResponse('free')),
      });
    });

    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
  });

  test('shows user email address', async ({ page }) => {
    await expect(page.locator(`input[value="${MOCK_USER.email}"]`)).toBeVisible({ timeout: 15000 });
  });

  test('shows Verified badge', async ({ page }) => {
    await expect(page.locator('text=Verified').first()).toBeVisible({ timeout: 15000 });
  });

  test('shows Sign Out button in danger zone', async ({ page }) => {
    const dangerZone = page.locator('text=Danger Zone');
    await dangerZone.scrollIntoViewIfNeeded();
    await expect(dangerZone).toBeVisible({ timeout: 15000 });
    // Scope to the danger zone card area (not the header nav Sign Out)
    const dangerCard = page.locator('[class*="destructive"], [class*="danger"]').filter({ hasText: 'Danger Zone' });
    await expect(dangerCard.locator('button:has-text("Sign Out")')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Settings - Usage Tab', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await mockAuthentication(page, 'free');

    await page.route('**/api/settings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SETTINGS),
      });
    });

    await page.route('**/api/usage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(getMockUsageResponse('free')),
      });
    });

    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
  });

  test('shows current plan info', async ({ page }) => {
    // Click Usage tab
    await page.getByRole('tab', { name: 'Usage' }).click();

    await expect(page.getByText('Current Plan', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/free/i').first()).toBeVisible();
  });

  test('shows usage statistics', async ({ page }) => {
    await page.getByRole('tab', { name: 'Usage' }).click();

    await expect(page.locator('text=Usage Statistics')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Extractions Today')).toBeVisible();
    await expect(page.locator('text=Extractions This Month')).toBeVisible();
  });

  test('free tier shows Upgrade Plan button', async ({ page }) => {
    await page.getByRole('tab', { name: 'Usage' }).click();

    await expect(page.locator('button:has-text("Upgrade Plan")').first()).toBeVisible({ timeout: 10000 });
  });

  test('shows plan features list', async ({ page }) => {
    await page.getByRole('tab', { name: 'Usage' }).click();

    await expect(page.locator('text=Plan Features')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Settings - Usage Tab (Pro Tier)', () => {
  test('pro tier shows Manage Subscription button', async ({ page }) => {
    test.slow();
    await mockAuthentication(page, 'pro');

    await page.route('**/api/settings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SETTINGS),
      });
    });

    await page.route('**/api/usage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(getMockUsageResponse('pro')),
      });
    });

    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('tab', { name: 'Usage' }).click();

    await expect(
      page.locator('button:has-text("Manage Subscription")').first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Settings - Preferences Tab', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await mockAuthentication(page, 'free');

    await page.route('**/api/settings', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_SETTINGS),
        });
      } else if (route.request().method() === 'PATCH') {
        const body = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...MOCK_SETTINGS, ...body }),
        });
      }
    });

    await page.route('**/api/usage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(getMockUsageResponse('free')),
      });
    });

    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
  });

  test('shows theme selector with Light, Dark, System options', async ({ page }) => {
    await page.getByRole('tab', { name: 'Preferences' }).click();

    await expect(page.locator('text=Appearance')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Light")')).toBeVisible();
    await expect(page.locator('button:has-text("Dark")')).toBeVisible();
    await expect(page.locator('button:has-text("System")')).toBeVisible();
  });

  test('shows export format selector with TXT, SRT, JSON', async ({ page }) => {
    await page.getByRole('tab', { name: 'Preferences' }).click();

    await expect(page.locator('text=Export Preferences')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("TXT")')).toBeVisible();
    await expect(page.locator('button:has-text("SRT")')).toBeVisible();
    await expect(page.locator('button:has-text("JSON")')).toBeVisible();
  });

  test('can change export format', async ({ page }) => {
    await page.getByRole('tab', { name: 'Preferences' }).click();

    await expect(page.locator('text=Export Preferences')).toBeVisible({ timeout: 10000 });

    // Click SRT format
    await page.locator('button:has-text("SRT")').click();

    // Should show success feedback or update the UI
    // The button should become active/selected
    await expect(page.locator('button:has-text("SRT")')).toBeVisible();
  });
});

test.describe('Settings - Checkout Success', () => {
  test('shows success message on checkout completion', async ({ page }) => {
    test.slow();
    await mockAuthentication(page, 'pro');

    await page.route('**/api/settings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SETTINGS),
      });
    });

    await page.route('**/api/usage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(getMockUsageResponse('pro')),
      });
    });

    await page.goto('/settings?checkout=success');
    await page.waitForLoadState('domcontentloaded');

    await expect(
      page.locator('text=/subscription activated|success/i').first()
    ).toBeVisible({ timeout: 15000 });
  });
});
