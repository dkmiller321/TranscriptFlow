import { Page, expect } from '@playwright/test';
import { generateTestEmail, generateTestPassword } from '../fixtures/test-data';

export interface TestUser {
  email: string;
  password: string;
}

/**
 * Sign up a new user via the UI
 */
export async function signUpUser(page: Page, user?: TestUser): Promise<TestUser> {
  const testUser = user || {
    email: generateTestEmail('signup'),
    password: generateTestPassword(),
  };

  await page.goto('/signup');
  await page.fill('input[type="email"]', testUser.email);
  await page.fill('input[type="password"]', testUser.password);
  await page.click('button[type="submit"]');

  // Wait for signup to complete (either redirect or success message)
  await page.waitForLoadState('networkidle');

  return testUser;
}

/**
 * Sign in an existing user via the UI
 */
export async function signInUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');

  // Wait for login to complete and redirect
  await page.waitForLoadState('networkidle');

  // Verify we're logged in (check for user menu or logout button)
  await expect(page.locator('text=/sign out|logout/i')).toBeVisible({ timeout: 10000 });
}

/**
 * Sign out the current user via the UI
 */
export async function signOutUser(page: Page): Promise<void> {
  // Look for sign out button/link
  const signOutButton = page.locator('text=/sign out|logout/i').first();
  await signOutButton.click();

  // Wait for logout to complete
  await page.waitForLoadState('networkidle');

  // Verify we're logged out (check for sign in button)
  await expect(page.locator('text=/sign in|login/i')).toBeVisible({ timeout: 10000 });
}

/**
 * Sign in a user via API (faster for setup in tests)
 */
export async function signInUserViaAPI(page: Page, user: TestUser): Promise<void> {
  const response = await page.request.post('/api/auth/signin', {
    data: {
      email: user.email,
      password: user.password,
    },
  });

  expect(response.ok()).toBeTruthy();

  // Refresh the page to pick up the auth cookie
  await page.reload();
  await page.waitForLoadState('networkidle');
}

/**
 * Create a user with API and sign them in (fastest setup method)
 */
export async function createAndSignInUser(
  page: Page,
  tier: 'free' | 'pro' | 'business' = 'free'
): Promise<TestUser> {
  const testUser = {
    email: generateTestEmail(tier),
    password: generateTestPassword(),
  };

  // Sign up via API
  const signupResponse = await page.request.post('/api/auth/signup', {
    data: {
      email: testUser.email,
      password: testUser.password,
    },
  });

  expect(signupResponse.ok()).toBeTruthy();

  // If not free tier, upgrade the subscription via database
  if (tier !== 'free') {
    // Note: This would require a test helper API endpoint to update subscription
    // For now, we'll sign in and the test can handle tier changes as needed
  }

  // Sign in via API
  await signInUserViaAPI(page, testUser);

  return testUser;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    const signOutButton = page.locator('text=/sign out|logout/i').first();
    await signOutButton.waitFor({ state: 'visible', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Navigate to a protected route and verify authentication is required
 */
export async function verifyProtectedRoute(page: Page, route: string): Promise<void> {
  await page.goto(route);
  await page.waitForLoadState('networkidle');

  // Should redirect to login page
  expect(page.url()).toContain('/login');
}
