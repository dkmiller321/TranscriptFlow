import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { SignupPage } from './pages/signup.page';

test.describe('Login Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    test.slow(); // Next.js compiles pages on first visit
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('renders login form correctly', async () => {
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.signUpLink).toBeVisible();
  });

  test('submit button is present with correct text', async () => {
    await expect(loginPage.submitButton).toHaveText(/sign in/i);
  });

  test('email field has correct type and placeholder', async () => {
    await expect(loginPage.emailInput).toHaveAttribute('type', 'email');
    await expect(loginPage.emailInput).toHaveAttribute('placeholder', /example/i);
  });

  test('password field has correct type', async () => {
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('shows error for invalid credentials', async ({ page }) => {
    // Mock Supabase signInWithPassword to return error
    await page.route('**/auth/v1/token**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
        }),
      });
    });

    await loginPage.emailInput.fill('wrong@example.com');
    await loginPage.passwordInput.fill('wrongpassword');
    await loginPage.submitButton.click();

    await expect(loginPage.errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('successful login redirects to home', async ({ page }) => {
    // Mock Supabase signInWithPassword to succeed
    await page.route('**/auth/v1/token**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            email_confirmed_at: '2024-01-15T10:00:00.000Z',
          },
        }),
      });
    });

    // Mock the getUser call after login
    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user-id',
          email: 'test@example.com',
          email_confirmed_at: '2024-01-15T10:00:00.000Z',
        }),
      });
    });

    await loginPage.emailInput.fill('test@example.com');
    await loginPage.passwordInput.fill('TestPassword123!');
    await loginPage.submitButton.click();

    await expect(page).toHaveURL('/', { timeout: 15000 });
  });

  test('sign up link navigates to signup page', async ({ page }) => {
    await loginPage.signUpLink.click();
    await expect(page).toHaveURL(/\/signup/, { timeout: 30000 });
  });
});

test.describe('Signup Page', () => {
  let signupPage: SignupPage;

  test.beforeEach(async ({ page }) => {
    test.slow();
    signupPage = new SignupPage(page);
    await signupPage.goto();
  });

  test('renders signup form correctly', async () => {
    await expect(signupPage.heading).toBeVisible();
    await expect(signupPage.emailInput).toBeVisible();
    await expect(signupPage.passwordInput).toBeVisible();
    await expect(signupPage.confirmPasswordInput).toBeVisible();
    await expect(signupPage.submitButton).toBeVisible();
    await expect(signupPage.signInLink).toBeVisible();
  });

  test('shows error when passwords do not match', async ({ page }) => {
    await signupPage.emailInput.fill('test@example.com');
    await signupPage.passwordInput.fill('Password123!');
    await signupPage.confirmPasswordInput.fill('DifferentPassword!');
    await signupPage.submitButton.click();

    // Should show password mismatch error
    await expect(page.locator('text=/passwords.*match|do not match/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows error for short password', async ({ page }) => {
    await signupPage.emailInput.fill('test@example.com');
    await signupPage.passwordInput.fill('12345');
    await signupPage.confirmPasswordInput.fill('12345');
    await signupPage.submitButton.click();

    // Should show password length error
    await expect(page.locator('text=/at least 6|too short|minimum/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('successful signup shows confirmation message', async ({ page }) => {
    // Mock Supabase signUp to succeed
    await page.route('**/auth/v1/signup', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'new-user-id',
          email: 'newuser@example.com',
          confirmation_sent_at: new Date().toISOString(),
        }),
      });
    });

    await signupPage.emailInput.fill('newuser@example.com');
    await signupPage.passwordInput.fill('StrongPassword123!');
    await signupPage.confirmPasswordInput.fill('StrongPassword123!');
    await signupPage.submitButton.click();

    // Should show "Check your email" confirmation
    await expect(signupPage.successMessage).toBeVisible({ timeout: 10000 });
  });

  test('shows error when email already exists', async ({ page }) => {
    // Mock Supabase signUp to return duplicate error
    await page.route('**/auth/v1/signup', async (route) => {
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'user_already_exists',
          error_description: 'User already registered',
        }),
      });
    });

    await signupPage.emailInput.fill('existing@example.com');
    await signupPage.passwordInput.fill('Password123!');
    await signupPage.confirmPasswordInput.fill('Password123!');
    await signupPage.submitButton.click();

    await expect(signupPage.errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('sign in link navigates to login page', async ({ page }) => {
    await signupPage.signInLink.click();
    await expect(page).toHaveURL(/\/login/, { timeout: 30000 });
  });

  test('password hint about minimum length is shown', async ({ page }) => {
    await expect(page.locator('text=/at least 6 characters/i')).toBeVisible();
  });
});
