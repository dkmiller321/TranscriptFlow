import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly signUpLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.locator('text=Welcome back');
    this.subtitle = page.locator('text=Sign in to your account');
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[class*="destructive"]');
    this.signUpLink = page.locator('a:has-text("Sign up")');
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }
}
