import { type Page, type Locator, expect } from '@playwright/test';

export class PricingPage {
  readonly page: Page;

  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly monthlyToggle: Locator;
  readonly yearlyToggle: Locator;
  readonly yearlySaveBadge: Locator;
  readonly freeCard: Locator;
  readonly proCard: Locator;
  readonly businessCard: Locator;
  readonly securityInfo: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.locator('h1').first();
    this.subtitle = page.locator('text=Choose the plan that fits your needs');
    this.monthlyToggle = page.locator('button:has-text("Monthly")');
    this.yearlyToggle = page.locator('button:has-text("Yearly")');
    this.yearlySaveBadge = page.locator('text=Save 27%');
    this.freeCard = page.locator('[class*="card"]:has-text("Free"):has-text("$0")');
    this.proCard = page.locator('[class*="card"]:has-text("Pro"):has-text("Most Popular")');
    this.businessCard = page.locator('[class*="card"]:has-text("Business")');
    this.securityInfo = page.locator('text=SSL encryption');
  }

  async goto() {
    await this.page.goto('/pricing');
    await this.page.waitForLoadState('domcontentloaded');
  }
}
