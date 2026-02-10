import { type Page, type Locator, expect } from '@playwright/test';

export class SignupPage {
  readonly page: Page;

  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly signInLink: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.locator('h1:has-text("Create account")');
    this.subtitle = page.locator('text=Start extracting transcripts today');
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.confirmPasswordInput = page.locator('#confirm-password');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[class*="destructive"]');
    this.signInLink = page.locator('a:has-text("Sign in")');
    this.successMessage = page.locator('text=Check your email');
  }

  async goto() {
    await this.page.goto('/signup');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async signup(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }
}
