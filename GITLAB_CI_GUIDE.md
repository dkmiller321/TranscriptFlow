# GitLab CI/CD Pipeline Guide

Comprehensive guide for running E2E tests in parallel on GitLab CI/CD with containerized app instances.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Parallel Execution Strategies](#parallel-execution-strategies)
- [Setup Instructions](#setup-instructions)
- [Pipeline Configuration](#pipeline-configuration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The GitLab CI/CD pipeline runs E2E tests in parallel using multiple strategies:

1. **Browser Parallelization** - Run tests across Chromium, Firefox, and WebKit simultaneously
2. **Test Sharding** - Split large test suites across multiple runners
3. **Suite Parallelization** - Run different test suites (auth, extraction, etc.) in parallel
4. **Isolated Containers** - Each job runs in its own Docker container with a dedicated app instance

### Pipeline Stages

```
┌──────────┐
│  Setup   │  Install dependencies & browsers
└────┬─────┘
     │
     ├──────────────────────┬──────────────────────┬──────────────────────┐
     ▼                      ▼                      ▼                      ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│Test:Chromium│      │ Test:Firefox│      │ Test:WebKit │      │ Test:Mobile │
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
     │                      │                      │                      │
     └──────────────────────┴──────────────────────┴──────────────────────┘
                                   │
                                   ▼
                            ┌─────────────┐
                            │   Report    │  Combine & publish results
                            └─────────────┘
```

## Architecture

### Container-Per-Job Approach

Each parallel job runs in an isolated Docker container:

```
┌─────────────────────────────────────────┐
│         GitLab Runner Instance          │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │     Job 1: Chromium Tests         │ │
│  │  ┌─────────────────────────────┐  │ │
│  │  │ Playwright Container        │  │ │
│  │  │ - Next.js App (port 3000)   │  │ │
│  │  │ - Chromium browser          │  │ │
│  │  │ - Test suite                │  │ │
│  │  └─────────────────────────────┘  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │     Job 2: Firefox Tests          │ │
│  │  ┌─────────────────────────────┐  │ │
│  │  │ Playwright Container        │  │ │
│  │  │ - Next.js App (port 3000)   │  │ │
│  │  │ - Firefox browser           │  │ │
│  │  │ - Test suite                │  │ │
│  │  └─────────────────────────────┘  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │     Job 3: WebKit Tests           │ │
│  │  ┌─────────────────────────────┐  │ │
│  │  │ Playwright Container        │  │ │
│  │  │ - Next.js App (port 3000)   │  │ │
│  │  │ - WebKit browser            │  │ │
│  │  │ - Test suite                │  │ │
│  │  └─────────────────────────────┘  │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Benefits:**
- ✅ True isolation - no shared state
- ✅ Each job has its own app instance
- ✅ No port conflicts
- ✅ Independent failure/success
- ✅ Scales horizontally

## Parallel Execution Strategies

### Strategy 1: Browser Parallelization (Recommended)

Run the full test suite on different browsers in parallel.

**Pros:**
- ✅ Good browser coverage
- ✅ Simple to understand
- ✅ ~3x speedup (3 browsers)
- ✅ Easy to debug

**Cons:**
- ⚠️ Each job runs all tests (can be slow for large suites)

**Configuration:**
```yaml
test:chromium:
  script:
    - npx playwright test --project=chromium

test:firefox:
  script:
    - npx playwright test --project=firefox

test:webkit:
  script:
    - npx playwright test --project=webkit
```

**When to Use:**
- Small to medium test suites (<100 tests)
- Need cross-browser coverage
- Simple pipeline requirements

### Strategy 2: Test Sharding (Best for Large Suites)

Split tests into N shards and run them in parallel.

**Pros:**
- ✅ Excellent for large test suites
- ✅ Linear speedup (3 shards = ~3x faster)
- ✅ Configurable shard count
- ✅ Automatic test distribution

**Cons:**
- ⚠️ Requires careful shard balancing
- ⚠️ More complex setup

**Configuration:**
```yaml
test:chromium:shard-1:
  script:
    - npx playwright test --project=chromium --shard=1/3

test:chromium:shard-2:
  script:
    - npx playwright test --project=chromium --shard=2/3

test:chromium:shard-3:
  script:
    - npx playwright test --project=chromium --shard=3/3
```

**When to Use:**
- Large test suites (>100 tests)
- Need maximum speed
- Have sufficient runner capacity

### Strategy 3: Suite Parallelization (Custom Control)

Run different test files/suites in parallel.

**Pros:**
- ✅ Granular control over what runs when
- ✅ Can prioritize critical tests
- ✅ Easy to run specific suites
- ✅ Clear job names

**Cons:**
- ⚠️ Requires manual configuration
- ⚠️ Unbalanced execution times

**Configuration:**
```yaml
test:auth:
  script:
    - npx playwright test tests/e2e/auth.spec.ts

test:video-extraction:
  script:
    - npx playwright test tests/e2e/video-extraction.spec.ts

test:transcript-management:
  script:
    - npx playwright test tests/e2e/transcript-management.spec.ts
```

**When to Use:**
- Want to run critical tests first
- Need fine-grained control
- Different suites have different requirements

### Strategy 4: Hybrid Approach (Maximum Parallelization)

Combine multiple strategies for maximum speed.

**Example: Browser + Sharding**
```yaml
# Chromium - 3 shards
test:chromium:shard-1:
  script: npx playwright test --project=chromium --shard=1/3

test:chromium:shard-2:
  script: npx playwright test --project=chromium --shard=2/3

test:chromium:shard-3:
  script: npx playwright test --project=chromium --shard=3/3

# Firefox - 2 shards (faster browser, needs fewer shards)
test:firefox:shard-1:
  script: npx playwright test --project=firefox --shard=1/2

test:firefox:shard-2:
  script: npx playwright test --project=firefox --shard=2/2

# WebKit - no sharding (runs fast enough)
test:webkit:
  script: npx playwright test --project=webkit
```

**Speedup Calculation:**
- 185 tests
- Chromium: 185/3 = ~62 tests per shard
- Firefox: 185/2 = ~93 tests per shard
- WebKit: 185 tests
- Total parallel jobs: 6
- Estimated speedup: 4-6x

## Setup Instructions

### 1. Install Dependencies

Add `wait-on` to your project:

```bash
npm install -D wait-on
```

This utility ensures the app is ready before tests start.

### 2. Configure GitLab CI/CD Variables

Navigate to your GitLab project:
**Settings → CI/CD → Variables**

Add the following variables:

#### Required Variables

```
TEST_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Test Project
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_test_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_test_service_role_key

# Stripe Test Mode
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_test_...
STRIPE_PRO_YEARLY_PRICE_ID=price_test_...
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_test_...
STRIPE_BUSINESS_YEARLY_PRICE_ID=price_test_...
```

**Important:** Mark sensitive values as "Masked" and "Protected"

### 3. Configure GitLab Runner

Ensure your GitLab Runner has:
- Docker executor enabled
- Sufficient resources (2+ CPU cores, 4+ GB RAM per job)
- Network access to external services (YouTube, Stripe)

**Recommended Runner Configuration:**

```toml
[[runners]]
  name = "docker-runner"
  executor = "docker"
  [runners.docker]
    image = "mcr.microsoft.com/playwright:v1.48.0-jammy"
    privileged = false
    disable_cache = false
    volumes = ["/cache"]
    memory = "4g"
    cpus = "2"
  [runners.cache]
    Type = "s3"
    Shared = true
```

### 4. Push to Main

Commit the `.gitlab-ci.yml` file and push to main:

```bash
git add .gitlab-ci.yml
git commit -m "Add GitLab CI/CD pipeline for E2E tests"
git push origin main
```

The pipeline will trigger automatically.

## Pipeline Configuration

### Current Setup

The provided `.gitlab-ci.yml` uses a **hybrid approach**:

- **Main branch pushes:**
  - Browser parallelization (Chromium, Firefox, WebKit)
  - Test sharding for Chromium (3 shards)
  - Mobile tests (manual)

- **Merge requests:**
  - Browser parallelization
  - Suite-specific tests (manual)

- **Scheduled (nightly):**
  - Comprehensive test run on all browsers

### Customizing the Pipeline

#### Enable More Sharding

To add more shards for faster execution:

```yaml
# Add more shards
test:chromium:shard-4:
  script:
    - npx playwright test --project=chromium --shard=4/5

test:chromium:shard-5:
  script:
    - npx playwright test --project=chromium --shard=5/5
```

#### Run Only Critical Tests on Every Push

```yaml
test:critical:
  script:
    - npx playwright test --grep="@critical" --reporter=html,line
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  allow_failure: false
```

Then tag tests with `@critical`:

```typescript
test('should login user @critical', async ({ page }) => {
  // test code
});
```

#### Skip Flaky Tests

```yaml
test:chromium:
  script:
    - npx playwright test --project=chromium --grep-invert="@flaky"
```

#### Add Retry Logic

```yaml
test:chromium:
  retry:
    max: 2
    when:
      - script_failure
      - unknown_failure
```

### Resource Optimization

#### Caching Strategy

The pipeline caches:
- `node_modules` (based on `package-lock.json`)
- Playwright browsers
- npm cache

This reduces installation time from ~5 minutes to ~30 seconds.

#### Artifact Management

Artifacts are saved for 30 days:
- HTML reports
- Screenshots (on failure)
- Videos (on failure)
- Test results (JSON)

To reduce storage costs, adjust retention:

```yaml
artifacts:
  expire_in: 7 days  # or 3 days
```

## Best Practices

### 1. Use Separate Test Database

**Never use production data!**

Set up a dedicated Supabase test project:
- Isolated from production
- Can be reset anytime
- Allows parallel test execution

### 2. Implement Test Isolation

Each test should:
- Create its own test data
- Use unique identifiers (email, etc.)
- Clean up after itself (optional)

```typescript
test('should save transcript', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  // test code
});
```

### 3. Balance Shard Count

**Formula:** `Shard Count = Total Tests / Tests per Shard`

For optimal performance:
- **Small suite (<50 tests):** No sharding needed
- **Medium suite (50-150 tests):** 2-3 shards
- **Large suite (150-300 tests):** 3-5 shards
- **Very large suite (>300 tests):** 5-10 shards

**Diminishing returns:** Beyond 10 shards, overhead increases.

### 4. Monitor Pipeline Performance

Track metrics:
- **Total pipeline time** (should be <10 minutes)
- **Individual job time** (should be balanced)
- **Failure rate** (should be <5%)
- **Flaky test rate** (should be <1%)

### 5. Fail Fast

Run critical tests first:

```yaml
test:auth:
  stage: test:critical

test:video-extraction:
  stage: test:full
  needs:
    - test:auth  # Only run if auth passes
```

### 6. Use Manual Jobs for Expensive Tests

```yaml
test:comprehensive:
  script:
    - npx playwright test
  when: manual
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

### 7. Set Appropriate Timeouts

```yaml
test:chromium:
  timeout: 30m  # Prevent hanging jobs
```

## Troubleshooting

### Pipeline Fails: "App failed to start"

**Cause:** Next.js dev server didn't start in time.

**Solutions:**
1. Increase timeout in `wait-on`:
   ```yaml
   - npx wait-on http://localhost:3000 --timeout 120000
   ```

2. Check environment variables are set correctly

3. Review app logs:
   ```yaml
   - npm run dev 2>&1 | tee app.log &
   ```

### Tests Are Flaky

**Cause:** Network issues, timing issues, or shared state.

**Solutions:**
1. Add retries:
   ```yaml
   retry:
     max: 2
   ```

2. Increase Playwright timeouts:
   ```typescript
   test.setTimeout(60000);
   ```

3. Use better selectors:
   ```typescript
   // Bad: await page.click('.button')
   // Good: await page.click('button:has-text("Submit")')
   ```

### Out of Memory Errors

**Cause:** Container has insufficient memory.

**Solutions:**
1. Increase container memory in runner config
2. Reduce parallel test count
3. Use test sharding to split load

### Cache Not Working

**Cause:** Cache key mismatch or corrupted cache.

**Solutions:**
1. Clear cache in GitLab UI: **CI/CD → Pipelines → Clear runner caches**
2. Update cache key:
   ```yaml
   cache:
     key: "$CI_COMMIT_REF_SLUG-v2"
   ```

### Tests Pass Locally but Fail in CI

**Cause:** Environment differences.

**Solutions:**
1. Use same Playwright version locally and in CI
2. Check environment variables
3. Run in CI's Docker image locally:
   ```bash
   docker run -it mcr.microsoft.com/playwright:v1.48.0-jammy bash
   ```

### Slow Test Execution

**Optimizations:**
1. Enable more sharding
2. Use faster selectors
3. Reduce unnecessary waits
4. Cache more aggressively
5. Use parallel execution

**Measure performance:**
```yaml
- time npx playwright test  # Shows execution time
```

## Cost Optimization

### GitLab CI/CD Minutes

Free tier: 400 minutes/month per group

**Estimates:**
- Per pipeline: ~15-20 minutes
- Per day (3 pushes): ~60 minutes
- Per month: ~1,200 minutes

**Solutions:**
1. Use self-hosted runners (free unlimited minutes)
2. Upgrade to paid tier
3. Run fewer parallel jobs
4. Skip mobile tests on every push

### Runner Costs (Self-Hosted)

**AWS EC2 example:**
- Instance: t3.xlarge (4 vCPU, 16 GB RAM)
- Cost: ~$120/month
- Can run 4-6 parallel jobs
- Unlimited CI minutes

**Docker configuration:**
```yaml
[[runners]]
  limit = 6  # Max parallel jobs
```

## Advanced Features

### Parallel Matrix

Run tests with different configurations:

```yaml
test:matrix:
  parallel:
    matrix:
      - BROWSER: [chromium, firefox, webkit]
        NODE_VERSION: [18, 20]
  script:
    - npx playwright test --project=$BROWSER
```

This creates 6 jobs (3 browsers × 2 Node versions).

### Dynamic Parallelization

Automatically determine shard count:

```yaml
test:auto-shard:
  parallel: 5
  script:
    - npx playwright test --project=chromium --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
```

### Test Reports in Merge Requests

Show test results directly in MR:

```yaml
artifacts:
  reports:
    junit: test-results/junit.xml
```

Playwright generates JUnit XML with:
```bash
npx playwright test --reporter=junit
```

## Comparison: GitHub Actions vs GitLab CI/CD

| Feature | GitHub Actions | GitLab CI/CD |
|---------|----------------|--------------|
| **Parallel Jobs** | Matrix strategy | Manual or parallel keyword |
| **Caching** | actions/cache | Native caching |
| **Artifacts** | actions/upload-artifact | Native artifacts |
| **Container Images** | Custom or marketplace | Docker Hub, registries |
| **Free Minutes** | 2,000/month | 400/month |
| **Self-Hosted** | Yes | Yes |
| **Test Reports** | Requires actions | Native JUnit support |

Both are excellent choices. GitLab CI/CD has better native features for Docker and caching.

## Summary

### Recommended Configuration

For most projects:

```yaml
# Small project (<100 tests): Browser parallelization
test:chromium: ...
test:firefox: ...
test:webkit: ...

# Medium project (100-300 tests): Browser + 2-3 shards
test:chromium:shard-1: ...
test:chromium:shard-2: ...
test:firefox: ...

# Large project (>300 tests): Browser + 5+ shards
test:chromium:shard-1-5: ...
test:firefox:shard-1-3: ...
test:webkit:shard-1-2: ...
```

### Expected Performance

With proper parallelization:
- **Sequential execution:** ~60 minutes
- **Browser parallel (3 jobs):** ~20 minutes
- **Browser + sharding (9 jobs):** ~7 minutes
- **Maximum parallel (15+ jobs):** ~4 minutes

### Next Steps

1. ✅ Configure GitLab CI/CD variables
2. ✅ Push `.gitlab-ci.yml` to repository
3. ✅ Monitor first pipeline run
4. ✅ Adjust shard count based on results
5. ✅ Set up scheduled nightly runs
6. ✅ Document any project-specific configurations

Happy testing! 🚀
