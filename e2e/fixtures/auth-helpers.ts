import { type Page } from '@playwright/test';

/**
 * Supabase project ref extracted from NEXT_PUBLIC_SUPABASE_URL.
 * Used to construct the correct session cookie name.
 */
const SUPABASE_PROJECT_REF = 'jqyawimrdxgjovvaifzt';

/**
 * Mock Supabase user object
 */
export const MOCK_USER = {
  id: 'test-user-id-00000000-0000-0000-0000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  email_confirmed_at: '2024-01-15T10:00:00.000Z',
  created_at: '2024-01-15T10:00:00.000Z',
  updated_at: '2024-01-15T10:00:00.000Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  identities: [],
};

/**
 * Mock Supabase session object (matches gotrue-js v2 Session type)
 */
export const MOCK_SESSION = {
  access_token: 'mock-access-token-for-testing',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'mock-refresh-token-for-testing',
  user: MOCK_USER,
};

/**
 * Sets up a fully mocked authenticated Supabase session for E2E tests.
 *
 * How it works:
 * 1. `addInitScript` injects a Supabase session cookie into `document.cookie`
 *    BEFORE any page JavaScript runs (React hydrate, useAuth hook, etc.)
 * 2. When the Supabase browser client initializes and calls `getUser()`,
 *    it reads the session from the cookie, finds a valid access_token,
 *    and makes a GET request to /auth/v1/user.
 * 3. `page.route()` intercepts that request and returns our mock user.
 *
 * Note: The Next.js middleware runs server-side (not interceptable by Playwright).
 * It calls getUser() but does NOT redirect — it only refreshes cookies.
 * Since the initial HTTP request has no auth cookie, the middleware is a no-op.
 *
 * Call this BEFORE navigating to the page (before page.goto).
 */
export async function mockAuthentication(page: Page, tier: 'free' | 'pro' | 'business' = 'free') {
  const cookieName = `sb-${SUPABASE_PROJECT_REF}-auth-token`;

  // Step 1: Inject session cookie before any page JS executes.
  // The @supabase/ssr createBrowserClient reads from document.cookie using
  // the `cookie` library's parse(), which handles URL-encoded values.
  await page.addInitScript(({ name, sessionJson }) => {
    document.cookie = `${name}=${encodeURIComponent(sessionJson)}; path=/; max-age=3600; SameSite=Lax`;
  }, { name: cookieName, sessionJson: JSON.stringify(MOCK_SESSION) });

  // Step 2: Intercept the Supabase auth /auth/v1/user call (triggered by getUser())
  await page.route('**/auth/v1/user', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USER),
    });
  });

  // Step 3: Intercept token refresh calls
  await page.route('**/auth/v1/token**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SESSION),
    });
  });

  // Step 4: Intercept user_subscriptions query (used by useUserTier hook)
  await page.route('**/rest/v1/user_subscriptions**', async (route) => {
    if (tier === 'free') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
        headers: { 'content-range': '0-0/0' },
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tier }),
      });
    }
  });
}

/**
 * Mock usage API response
 */
export function getMockUsageResponse(tier: 'free' | 'pro' | 'business' = 'free') {
  const limits: Record<string, { daily: number; monthly: number }> = {
    free: { daily: 5, monthly: 50 },
    pro: { daily: 50, monthly: 500 },
    business: { daily: Infinity, monthly: Infinity },
  };

  return {
    today: 2,
    month: 15,
    subscription: {
      tier,
      stripe_customer_id: tier !== 'free' ? 'cus_test123' : null,
      stripe_subscription_id: tier !== 'free' ? 'sub_test123' : null,
      current_period_end: tier !== 'free' ? new Date(Date.now() + 30 * 86400000).toISOString() : null,
    },
    limits: limits[tier],
    rateLimit: {
      remaining: limits[tier].daily - 2,
      resetAt: new Date(Date.now() + 86400000).toISOString(),
    },
  };
}

/**
 * Mock settings API response
 */
export const MOCK_SETTINGS = {
  user_id: MOCK_USER.id,
  default_export_format: 'txt',
  theme: 'system',
  has_youtube_api_key: false,
};
