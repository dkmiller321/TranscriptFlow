import { type Page, type Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;

  // Hero section
  readonly heroHeading: Locator;
  readonly urlInput: Locator;
  readonly extractButton: Locator;

  // Loading state
  readonly loadingText: Locator;

  // Error display
  readonly errorMessage: Locator;

  // Results - word count indicates successful extraction
  readonly wordCount: Locator;

  // Export options
  readonly copyButton: Locator;
  readonly saveToLibraryButton: Locator;
  readonly downloadTxtButton: Locator;
  readonly downloadSrtButton: Locator;
  readonly downloadJsonButton: Locator;

  // Transcript viewer
  readonly plainTextTab: Locator;
  readonly timestampedTab: Locator;
  readonly searchInput: Locator;

  // Navigation (use .first() to avoid strict mode - desktop & mobile nav both exist)
  readonly header: Locator;
  readonly logo: Locator;
  readonly pricingLink: Locator;
  readonly loginButton: Locator;
  readonly signupButton: Locator;

  // Footer
  readonly footer: Locator;

  constructor(page: Page) {
    this.page = page;

    // Hero
    this.heroHeading = page.locator('h1').first();
    this.urlInput = page.locator('input[type="text"]').first();
    this.extractButton = page.locator('button[type="submit"]').first();

    // Loading
    this.loadingText = page.locator('text=/Extracting transcript|Processing/i');

    // Error
    this.errorMessage = page.locator('[role="alert"], .text-destructive').first();

    // Results
    this.wordCount = page.locator('text=/\\d+\\s*words/i').first();

    // Export
    this.copyButton = page.locator('button:has-text("Copy to Clipboard")');
    this.saveToLibraryButton = page.locator('button:has-text("Save to Library"), button:has-text("Sign in to Save")').first();
    this.downloadTxtButton = page.locator('button:has-text(".TXT")');
    this.downloadSrtButton = page.locator('button:has-text(".SRT")');
    this.downloadJsonButton = page.locator('button:has-text(".JSON")');

    // Transcript viewer
    this.plainTextTab = page.locator('button:has-text("Plain Text")');
    this.timestampedTab = page.locator('button:has-text("Timestamped")');
    this.searchInput = page.locator('input[placeholder="Search transcript..."]');

    // Navigation - use getByRole or .first() to avoid strict mode violations
    this.header = page.locator('header');
    this.logo = page.locator('header a').first();
    this.pricingLink = page.getByRole('link', { name: 'Pricing' }).first();
    this.loginButton = page.getByRole('button', { name: 'Log In' }).first();
    this.signupButton = page.getByRole('button', { name: 'Sign Up' }).first();

    // Footer
    this.footer = page.locator('footer');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async submitUrl(url: string) {
    await this.urlInput.fill(url);
    // Wait for button to become enabled after input
    await expect(this.extractButton).toBeEnabled({ timeout: 3000 });
    await this.extractButton.click();
  }

  async waitForTranscriptResult(timeout = 45000) {
    await expect(this.wordCount).toBeVisible({ timeout });
  }
}
