import { test, expect } from '@playwright/test';
import { signUpUser, signInUser, signOutUser, verifyProtectedRoute } from '../utils/auth-helpers';
import { generateTestEmail, generateTestPassword } from '../fixtures/test-data';

test.describe('Authentication', () => {
  test.describe('Sign Up', () => {
    test('should show error for weak password', async ({ page }) => {
      await page.goto('/signup');
      await page.fill('input[type="email"]', generateTestEmail('weak-pass'));
      await page.fill('input[type="password"]', '12345'); // Too short

      await page.click('button[type="submit"]');

      // Should show password validation error
      const errorMessage = await page.locator('text=/password.*6|password.*strong|password.*invalid/i').first();
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test('should show error for invalid email', async ({ page }) => {
      await page.goto('/signup');
      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[type="password"]', generateTestPassword());

      await page.click('button[type="submit"]');

      // Should show email validation error
      const errorMessage = await page.locator('text=/email.*invalid|enter.*valid.*email/i').first();
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test('should show error for duplicate email', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('duplicate'),
        password: generateTestPassword(),
      };

      // Sign up first time
      await signUpUser(page, testUser);

      // Sign out if logged in
      const signOutButton = await page.locator('text=/sign out|logout/i').first().isVisible().catch(() => false);
      if (signOutButton) {
        await signOutUser(page);
      }

      // Try to sign up with same email
      await page.goto('/signup');
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      await page.click('button[type="submit"]');

      // Should show error about email already registered
      const errorMessage = await page.locator('text=/already.*registered|email.*exists|already.*account/i').first();
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Sign In', () => {
    test('should sign in with valid credentials', async ({ page }) => {
      // First create a user
      const testUser = {
        email: generateTestEmail('signin-valid'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Sign out
      const signOutButton = await page.locator('text=/sign out|logout/i').first().isVisible().catch(() => false);
      if (signOutButton) {
        await signOutUser(page);
      }

      // Sign in
      await signInUser(page, testUser);

      // Should be logged in and on home page
      await expect(page.locator('text=/sign out|logout/i').first()).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'nonexistent@example.com');
      await page.fill('input[type="password"]', 'WrongPassword123!');
      await page.click('button[type="submit"]');

      // Should show error message
      const errorMessage = await page.locator('text=/invalid.*credentials|wrong.*password|incorrect/i').first();
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test('should show error for empty fields', async ({ page }) => {
      await page.goto('/login');
      await page.click('button[type="submit"]');

      // Should show validation errors
      const hasError = await page.locator('text=/required|enter.*email|enter.*password/i').first().isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasError).toBeTruthy();
    });
  });

  test.describe('Sign Out', () => {
    test('should sign out successfully', async ({ page }) => {
      // Create and sign in user
      const testUser = {
        email: generateTestEmail('signout'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Sign out
      await signOutUser(page);

      // Should be signed out
      await expect(page.locator('text=/sign in|login/i').first()).toBeVisible();

      // Should not see sign out button
      const signOutVisible = await page.locator('text=/sign out|logout/i').first().isVisible().catch(() => false);
      expect(signOutVisible).toBe(false);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing history without auth', async ({ page }) => {
      await verifyProtectedRoute(page, '/history');
    });

    test('should redirect to login when accessing library without auth', async ({ page }) => {
      await verifyProtectedRoute(page, '/library');
    });

    test('should redirect to login when accessing settings without auth', async ({ page }) => {
      await verifyProtectedRoute(page, '/settings');
    });

    test('should allow access to protected routes when authenticated', async ({ page }) => {
      // Create and sign in user
      const testUser = {
        email: generateTestEmail('protected-routes'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Should be able to access history
      await page.goto('/history');
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/history');

      // Should be able to access library
      await page.goto('/library');
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/library');

      // Should be able to access settings
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/settings');
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain session after page reload', async ({ page }) => {
      // Create and sign in user
      const testUser = {
        email: generateTestEmail('session-persist'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be signed in
      await expect(page.locator('text=/sign out|logout/i').first()).toBeVisible();
    });

    test('should maintain session across navigation', async ({ page }) => {
      // Create and sign in user
      const testUser = {
        email: generateTestEmail('session-nav'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Navigate to different pages
      await page.goto('/history');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=/sign out|logout/i').first()).toBeVisible();

      await page.goto('/library');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=/sign out|logout/i').first()).toBeVisible();

      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=/sign out|logout/i').first()).toBeVisible();
    });
  });
});
