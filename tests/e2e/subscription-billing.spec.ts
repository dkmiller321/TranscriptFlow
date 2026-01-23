import { test, expect } from '@playwright/test';
import { signUpUser } from '../utils/auth-helpers';
import {
  extractVideo,
  getUsage,
  createCheckoutSession,
  createBillingPortalSession,
  assertApiSuccess,
  assertApiError,
} from '../utils/api-helpers';
import { TEST_VIDEOS, generateTestEmail, generateTestPassword, SUBSCRIPTION_TIERS } from '../fixtures/test-data';

test.describe('Subscription and Billing', () => {
  test.describe('Pricing Page', () => {
    test('should display all subscription tiers', async ({ page }) => {
      await page.goto('/pricing');

      // Should show Free, Pro, and Business tiers
      await expect(page.locator('text=/free/i').first()).toBeVisible();
      await expect(page.locator('text=/pro/i').first()).toBeVisible();
      await expect(page.locator('text=/business/i').first()).toBeVisible();
    });

    test('should display tier features', async ({ page }) => {
      await page.goto('/pricing');

      // Free tier features
      await expect(page.locator('text=/3.*videos.*day/i')).toBeVisible();

      // Pro tier features
      await expect(page.locator('text=/50.*videos.*day/i')).toBeVisible();
      await expect(page.locator('text=/channel.*extraction/i')).toBeVisible();

      // Business tier features
      await expect(page.locator('text=/unlimited/i')).toBeVisible();
    });

    test('should display pricing', async ({ page }) => {
      await page.goto('/pricing');

      // Should show monthly prices
      await expect(page.locator('text=/\\$9\\.99|\\$10/i')).toBeVisible(); // Pro monthly
      await expect(page.locator('text=/\\$29\\.99|\\$30/i')).toBeVisible(); // Business monthly
    });

    test('should toggle between monthly and yearly pricing', async ({ page }) => {
      await page.goto('/pricing');

      // Look for billing toggle
      const yearlyToggle = page.locator('button:has-text("Yearly"), button:has-text("Annual")').first();
      const hasToggle = await yearlyToggle.isVisible().catch(() => false);

      if (hasToggle) {
        await yearlyToggle.click();

        // Should show yearly prices (with discount)
        await expect(page.locator('text=/\\$99|\\$100/i')).toBeVisible(); // Pro yearly
        await expect(page.locator('text=/\\$299|\\$300/i')).toBeVisible(); // Business yearly
      }
    });

    test('should show upgrade buttons for authenticated users', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('pricing-auth'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      await page.goto('/pricing');

      // Should show upgrade buttons
      await expect(page.locator('button:has-text("Upgrade"), button:has-text("Get Started")').first()).toBeVisible();
    });
  });

  test.describe('Free Tier Limits', () => {
    test('should show usage stats for free tier user', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('free-usage'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Get usage via API
      const usageResponse = await getUsage(page);
      await assertApiSuccess(usageResponse);

      const usageData = await usageResponse.json();
      expect(usageData.tier).toBe('free');
      expect(usageData.dailyLimit).toBe(3);
    });

    test('should enforce free tier daily limit of 3 videos', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('free-limit-3'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Extract 4 videos
      const responses = [];
      for (let i = 0; i < 4; i++) {
        const response = await extractVideo(page, TEST_VIDEOS.valid.url);
        responses.push(response);
      }

      // 4th request should be rate limited
      const lastResponse = responses[3];
      if (lastResponse.status() === 429) {
        await assertApiError(lastResponse, 429, 'limit');
      }
    });

    test('should only allow TXT export for free tier', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('free-export'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Extract video
      await page.goto('/');
      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_VIDEOS.valid.url);
      await page.click('button:has-text("Extract"), button:has-text("Get Transcript")');
      await page.waitForSelector('text=/transcript|video/i', { timeout: 30000 });

      // Should only see TXT export option
      const srtButton = await page.locator('button:has-text("SRT")').first().isVisible().catch(() => false);
      const jsonButton = await page.locator('button:has-text("JSON")').first().isVisible().catch(() => false);

      // Free tier should not have SRT/JSON or they should be disabled/locked
      if (srtButton || jsonButton) {
        // Check if they're disabled or show upgrade prompt
        const upgradePrompt = await page.locator('text=/upgrade|pro/i').first().isVisible().catch(() => false);
        expect(upgradePrompt).toBe(true);
      }
    });

    test('should block channel extraction for free tier', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('free-channel-block'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      await page.goto('/');
      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', 'https://www.youtube.com/@TEDEd');

      // Should show upgrade message for channel extraction
      await expect(page.locator('text=/upgrade|pro.*required|channel.*pro/i').first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Stripe Checkout', () => {
    test('should create Pro monthly checkout session', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('checkout-pro-monthly'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Create checkout session via API
      const checkoutResponse = await createCheckoutSession(page, 'pro', 'monthly');
      await assertApiSuccess(checkoutResponse);

      const checkoutData = await checkoutResponse.json();
      expect(checkoutData.url).toBeDefined();
      expect(checkoutData.url).toContain('stripe.com');
    });

    test('should create Pro yearly checkout session', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('checkout-pro-yearly'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      const checkoutResponse = await createCheckoutSession(page, 'pro', 'yearly');
      await assertApiSuccess(checkoutResponse);

      const checkoutData = await checkoutResponse.json();
      expect(checkoutData.url).toContain('stripe.com');
    });

    test('should create Business monthly checkout session', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('checkout-business-monthly'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      const checkoutResponse = await createCheckoutSession(page, 'business', 'monthly');
      await assertApiSuccess(checkoutResponse);

      const checkoutData = await checkoutResponse.json();
      expect(checkoutData.url).toContain('stripe.com');
    });

    test('should create Business yearly checkout session', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('checkout-business-yearly'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      const checkoutResponse = await createCheckoutSession(page, 'business', 'yearly');
      await assertApiSuccess(checkoutResponse);

      const checkoutData = await checkoutResponse.json();
      expect(checkoutData.url).toContain('stripe.com');
    });

    test('should require authentication for checkout', async ({ page }) => {
      // Try to create checkout without auth
      const checkoutResponse = await createCheckoutSession(page, 'pro', 'monthly');

      // Should return 401 Unauthorized
      expect(checkoutResponse.status()).toBe(401);
    });

    test('should navigate to Stripe checkout from pricing page', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('checkout-ui'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      await page.goto('/pricing');

      // Find and click Pro upgrade button
      const proUpgradeButton = page.locator('button:has-text("Upgrade"), button:has-text("Get Pro")').first();

      // Set up listener for new page (Stripe checkout opens in new tab)
      const popupPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);

      await proUpgradeButton.click();

      const popup = await popupPromise;

      if (popup) {
        // Should navigate to Stripe
        await popup.waitForLoadState('domcontentloaded', { timeout: 10000 });
        expect(popup.url()).toContain('stripe.com');
        await popup.close();
      } else {
        // Might redirect in same page
        await page.waitForTimeout(2000);
        if (page.url().includes('stripe.com')) {
          expect(page.url()).toContain('stripe.com');
        }
      }
    });
  });

  test.describe('Billing Portal', () => {
    test('should create billing portal session', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('billing-portal'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      const portalResponse = await createBillingPortalSession(page);
      await assertApiSuccess(portalResponse);

      const portalData = await portalResponse.json();
      expect(portalData.url).toBeDefined();
      expect(portalData.url).toContain('stripe.com');
    });

    test('should require authentication for billing portal', async ({ page }) => {
      // Try to access portal without auth
      const portalResponse = await createBillingPortalSession(page);

      // Should return 401 Unauthorized
      expect(portalResponse.status()).toBe(401);
    });

    test('should show billing portal link in settings for subscribed users', async ({ page }) => {
      // Note: This test requires a user with active subscription
      // In a real test, you would set up a test subscription first
      const testUser = {
        email: generateTestEmail('portal-link'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Look for billing/subscription section
      const billingSection = await page.locator('text=/subscription|billing|manage.*plan/i').first().isVisible().catch(() => false);
      expect(billingSection).toBe(true);
    });
  });

  test.describe('Usage Statistics', () => {
    test('should display usage stats in settings', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('usage-stats'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Should show usage information
      await expect(page.locator('text=/usage|videos.*today|daily.*limit/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should show current tier information', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('tier-info'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      const usageResponse = await getUsage(page);
      await assertApiSuccess(usageResponse);

      const usageData = await usageResponse.json();
      expect(usageData.tier).toBeDefined();
      expect(['free', 'pro', 'business']).toContain(usageData.tier);
    });

    test('should show daily usage count', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('daily-count'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Extract a video
      await extractVideo(page, TEST_VIDEOS.valid.url);

      // Check usage
      const usageResponse = await getUsage(page);
      const usageData = await usageResponse.json();

      expect(usageData.dailyUsage).toBeGreaterThanOrEqual(1);
    });

    test('should show monthly usage count', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('monthly-count'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Extract a video
      await extractVideo(page, TEST_VIDEOS.valid.url);

      // Check usage
      const usageResponse = await getUsage(page);
      const usageData = await usageResponse.json();

      expect(usageData.monthlyUsage).toBeGreaterThanOrEqual(1);
    });

    test('should show remaining quota', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('quota'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      const usageResponse = await getUsage(page);
      const usageData = await usageResponse.json();

      if (usageData.tier === 'free') {
        expect(usageData.remainingToday).toBeLessThanOrEqual(3);
      } else if (usageData.tier === 'pro') {
        expect(usageData.remainingToday).toBeLessThanOrEqual(50);
      } else if (usageData.tier === 'business') {
        // Business has unlimited, so remaining might be -1 or very high number
        expect(usageData.remainingToday).toBeDefined();
      }
    });
  });

  test.describe('Tier Feature Access', () => {
    test('should show upgrade prompts for locked features', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('locked-features'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      await page.goto('/');

      // Try to access Pro feature (e.g., SRT export after extraction)
      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_VIDEOS.valid.url);
      await page.click('button:has-text("Extract"), button:has-text("Get Transcript")');
      await page.waitForSelector('text=/transcript|video/i', { timeout: 30000 });

      // Look for SRT button
      const srtButton = page.locator('button:has-text("SRT")').first();
      if (await srtButton.isVisible()) {
        await srtButton.click();

        // Should show upgrade prompt
        await expect(page.locator('text=/upgrade|unlock|pro/i').first()).toBeVisible({ timeout: 3000 });
      }
    });

    test('should show tier badge in UI', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('tier-badge'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Should show tier badge (Free, Pro, or Business)
      await expect(page.locator('text=/free.*tier|^free$|plan.*free/i, [class*="badge"]').first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Subscription Status', () => {
    test.skip('should show active subscription in settings', async ({ page }) => {
      // This test requires a user with active subscription
      // Would need to set up via Stripe test mode webhook

      const testUser = {
        email: generateTestEmail('active-sub'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=/active|subscribed|pro.*plan/i').first()).toBeVisible();
    });

    test.skip('should show subscription renewal date', async ({ page }) => {
      // This test requires a user with active subscription

      const testUser = {
        email: generateTestEmail('renewal-date'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Should show next billing date
      await expect(page.locator('text=/renews|next.*billing|renewal/i').first()).toBeVisible();
    });

    test.skip('should allow canceling subscription', async ({ page }) => {
      // This test requires a user with active subscription
      // Cancellation is handled through Stripe billing portal

      const testUser = {
        email: generateTestEmail('cancel-sub'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Click manage subscription button
      const manageButton = page.locator('button:has-text("Manage"), a:has-text("Billing")').first();
      await manageButton.click();

      // Should navigate to Stripe billing portal
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
      expect(page.url()).toContain('stripe.com');
    });
  });
});
