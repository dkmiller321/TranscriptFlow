# TranscriptFlow E2E Testing Guide

Comprehensive end-to-end integration tests for TranscriptFlow using Playwright.

## Table of Contents

- [Setup](#setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Test Coverage](#test-coverage)
- [Writing New Tests](#writing-new-tests)
- [Troubleshooting](#troubleshooting)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install
```

### 3. Set Up Test Environment

Create a `.env.test` file in the root directory with your test environment variables:

```env
# Next.js
TEST_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (use test project)
NEXT_PUBLIC_SUPABASE_URL=your_test_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_test_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_test_service_role_key

# Stripe (use test mode keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

### 4. Start the Development Server

The tests are configured to automatically start the dev server, but you can also run it manually:

```bash
npm run dev
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Headed Mode (see browser)

```bash
npm run test:headed
```

### Run Tests in UI Mode (interactive)

```bash
npm run test:ui
```

### Run Tests in Debug Mode

```bash
npm run test:debug
```

### Run Tests for Specific Browser

```bash
npm run test:chromium
npm run test:firefox
npm run test:webkit
```

### Run Specific Test Suites

```bash
# Authentication tests
npm run test:auth

# Video extraction tests
npm run test:video

# Channel extraction tests
npm run test:channel

# Transcript management tests
npm run test:transcripts

# Subscription and billing tests
npm run test:billing
```

### View Test Report

After running tests, view the HTML report:

```bash
npm run test:report
```

### Generate Test Code (Codegen)

Playwright can generate test code by recording your actions:

```bash
npm run test:codegen
```

## Test Structure

```
tests/
├── e2e/                          # End-to-end test specs
│   ├── auth.spec.ts              # Authentication flows
│   ├── video-extraction.spec.ts  # Single video extraction
│   ├── channel-extraction.spec.ts # Batch channel extraction
│   ├── transcript-management.spec.ts # Save, favorite, tag, export
│   └── subscription-billing.spec.ts # Pricing, checkout, usage
├── fixtures/                     # Test data fixtures
│   └── test-data.ts              # Users, videos, channels, etc.
├── utils/                        # Test utility functions
│   ├── auth-helpers.ts           # Auth-related helpers
│   └── api-helpers.ts            # API request helpers
└── README.md                     # This file
```

## Test Coverage

### Authentication Tests (`auth.spec.ts`)
- ✅ Sign up with valid/invalid credentials
- ✅ Sign in with valid/invalid credentials
- ✅ Sign out functionality
- ✅ Protected route access control
- ✅ Session persistence across navigation/reload
- ✅ Password validation
- ✅ Email verification flow

### Video Extraction Tests (`video-extraction.spec.ts`)
- ✅ Extract transcript for valid video URL
- ✅ Support multiple YouTube URL formats (watch, youtu.be, embed, ID)
- ✅ Error handling for invalid/non-existent videos
- ✅ Anonymous vs authenticated user extraction
- ✅ Rate limiting enforcement (anonymous and free tier)
- ✅ Extraction history tracking
- ✅ Video metadata display (title, thumbnail, word count)
- ✅ View toggle (plain text vs segments with timestamps)
- ✅ Copy transcript functionality
- ✅ Channel URL detection

### Channel Extraction Tests (`channel-extraction.spec.ts`)
- ✅ Access control (anonymous, free tier, pro/business)
- ✅ Channel URL validation (handles, channel IDs, custom URLs)
- ✅ UI options (video limit, format selection)
- ⏭️ Progress tracking and real-time updates (requires Pro/Business)
- ⏭️ Extraction cancellation (requires Pro/Business)
- ⏭️ Results display with success/failure counts (requires Pro/Business)
- ⏭️ Download results (requires Pro/Business)
- ⏭️ Tier limit enforcement (25 for Pro, 500 for Business)
- ⏭️ Error handling (no videos, mixed public/private)

### Transcript Management Tests (`transcript-management.spec.ts`)
- ✅ Save transcript to library
- ✅ View saved transcripts with pagination
- ✅ Mark/unmark as favorite
- ✅ Filter favorites
- ✅ Add/update tags
- ✅ Add/update notes
- ✅ Delete transcripts with confirmation
- ✅ Export in multiple formats (TXT, SRT, JSON)
- ✅ Export file headers and content validation
- ✅ Prevent duplicate saves

### Subscription & Billing Tests (`subscription-billing.spec.ts`)
- ✅ Pricing page display (tiers, features, prices)
- ✅ Monthly/yearly pricing toggle
- ✅ Free tier limits (3 videos/day, TXT only)
- ✅ Stripe checkout session creation (Pro/Business, monthly/yearly)
- ✅ Billing portal access
- ✅ Usage statistics (daily, monthly, remaining quota)
- ✅ Tier information display
- ✅ Feature access control and upgrade prompts
- ⏭️ Active subscription status (requires test subscription)
- ⏭️ Subscription cancellation (requires test subscription)

**Legend:**
- ✅ Fully implemented and runnable
- ⏭️ Skipped (requires Pro/Business tier or test subscription setup)

## Writing New Tests

### 1. Create a New Test File

```typescript
import { test, expect } from '@playwright/test';
import { signUpUser } from '../utils/auth-helpers';
import { generateTestEmail, generateTestPassword } from '../fixtures/test-data';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Arrange: Set up test data and authenticate if needed
    const testUser = {
      email: generateTestEmail('feature-test'),
      password: generateTestPassword(),
    };
    await signUpUser(page, testUser);

    // Act: Perform the action
    await page.goto('/some-page');
    await page.click('button:has-text("Action")');

    // Assert: Verify the result
    await expect(page.locator('text=/success/i')).toBeVisible();
  });
});
```

### 2. Use Helper Functions

Leverage existing helpers for common operations:

```typescript
// Authentication
import { signUpUser, signInUser, signOutUser } from '../utils/auth-helpers';

// API operations
import {
  extractVideo,
  saveTranscript,
  deleteTranscript,
  getUsage,
} from '../utils/api-helpers';

// Test data
import { TEST_VIDEOS, TEST_CHANNELS } from '../fixtures/test-data';
```

### 3. Follow Best Practices

- **Unique test users**: Always use `generateTestEmail()` and `generateTestPassword()` to avoid conflicts
- **Cleanup**: Tests should be independent and not rely on other tests
- **Timeouts**: Use appropriate timeouts for async operations (default: 30s for network)
- **Assertions**: Use Playwright's built-in assertions with `expect()`
- **Selectors**: Prefer semantic selectors (text, role, label) over CSS classes
- **Parallelization**: Tests run in parallel by default; avoid shared state

### 4. Test Naming Convention

- Describe blocks: Feature/component name
- Test names: Should read as "should [expected behavior]"
- Examples:
  - ✅ `should save transcript to library`
  - ✅ `should show error for invalid email`
  - ❌ `test save transcript`
  - ❌ `invalid email`

## Troubleshooting

### Tests Failing Due to Timing Issues

If tests are flaky due to timing:

```typescript
// ❌ Bad: Fixed wait
await page.waitForTimeout(2000);

// ✅ Good: Wait for specific condition
await expect(page.locator('text=/loaded/i')).toBeVisible({ timeout: 10000 });
```

### Cannot Find Element

Use Playwright's debugging tools:

```typescript
// Take a screenshot
await page.screenshot({ path: 'debug.png' });

// Print page content
console.log(await page.content());

// Use the trace viewer
// Run with: npm run test:debug
```

### Authentication Issues

If tests fail due to authentication:

1. Verify Supabase test credentials are correct in `.env.test`
2. Check that test users are being created with unique emails
3. Ensure cookies/session storage is properly set

### Rate Limiting

If tests hit rate limits:

1. Use unique test users for each test
2. Consider using API helpers to bypass UI rate limiting
3. Run tests sequentially for rate-limited endpoints:
   ```typescript
   test.describe.configure({ mode: 'serial' });
   ```

### Stripe Tests Failing

1. Ensure you're using Stripe test mode keys
2. Verify webhook secret is for test mode
3. Some tests require actual subscription setup and are marked as `.skip()`

### Database Cleanup

Tests create data in the database. For cleanup:

1. Use a separate test database/project
2. Periodically clean up test users and data
3. Consider automated cleanup scripts

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
        env:
          TEST_BASE_URL: ${{ secrets.TEST_BASE_URL }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          # ... other secrets
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Next.js Testing](https://nextjs.org/docs/testing)

## Support

For issues or questions about the tests:

1. Check this README first
2. Review the [Troubleshooting](#troubleshooting) section
3. Check existing test files for examples
4. Open an issue on the repository
