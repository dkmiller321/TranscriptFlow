# CI/CD Quick Reference Guide

## Quick Decision Matrix

### Choose Your Strategy

| Your Situation | Recommended Strategy | Config |
|----------------|---------------------|---------|
| Small project (<50 tests) | Browser Parallelization | See Strategy A |
| Medium project (50-150 tests) | Browser + Light Sharding | See Strategy B |
| Large project (>150 tests) | Browser + Heavy Sharding | See Strategy C |
| Need cross-browser coverage | Browser Parallelization | See Strategy A |
| Need maximum speed | Hybrid (Browser + Sharding) | See Strategy C |
| Limited CI minutes | Suite Parallelization | See Strategy D |

---

## Strategy A: Browser Parallelization (Simple)

**Best for:** Small projects, cross-browser testing

**Speedup:** ~3x (3 browsers running in parallel)

**Jobs:** 3 parallel jobs

```yaml
# .gitlab-ci.yml
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

**Execution Time:**
- Sequential: 60 minutes
- With Strategy A: ~20 minutes

---

## Strategy B: Browser + Light Sharding (Balanced)

**Best for:** Medium projects, good balance of speed and simplicity

**Speedup:** ~6x

**Jobs:** 6 parallel jobs

```yaml
# Chromium - 2 shards
test:chromium:shard-1:
  script:
    - npx playwright test --project=chromium --shard=1/2

test:chromium:shard-2:
  script:
    - npx playwright test --project=chromium --shard=2/2

# Firefox - 2 shards
test:firefox:shard-1:
  script:
    - npx playwright test --project=firefox --shard=1/2

test:firefox:shard-2:
  script:
    - npx playwright test --project=firefox --shard=2/2

# WebKit - no sharding
test:webkit:
  script:
    - npx playwright test --project=webkit
```

**Execution Time:**
- Sequential: 60 minutes
- With Strategy B: ~10 minutes

---

## Strategy C: Browser + Heavy Sharding (Maximum Speed)

**Best for:** Large projects, maximum parallelization

**Speedup:** ~10-12x

**Jobs:** 10+ parallel jobs

```yaml
# Chromium - 5 shards
test:chromium:shard-1:
  script: npx playwright test --project=chromium --shard=1/5
test:chromium:shard-2:
  script: npx playwright test --project=chromium --shard=2/5
test:chromium:shard-3:
  script: npx playwright test --project=chromium --shard=3/5
test:chromium:shard-4:
  script: npx playwright test --project=chromium --shard=4/5
test:chromium:shard-5:
  script: npx playwright test --project=chromium --shard=5/5

# Firefox - 3 shards
test:firefox:shard-1:
  script: npx playwright test --project=firefox --shard=1/3
test:firefox:shard-2:
  script: npx playwright test --project=firefox --shard=2/3
test:firefox:shard-3:
  script: npx playwright test --project=firefox --shard=3/3

# WebKit - 2 shards
test:webkit:shard-1:
  script: npx playwright test --project=webkit --shard=1/2
test:webkit:shard-2:
  script: npx playwright test --project=webkit --shard=2/2
```

**Execution Time:**
- Sequential: 60 minutes
- With Strategy C: ~5-7 minutes

---

## Strategy D: Suite Parallelization (Custom Control)

**Best for:** Limited CI minutes, critical path testing

**Speedup:** ~5x (5 suites)

**Jobs:** 5 parallel jobs

```yaml
test:auth:
  script:
    - npx playwright test tests/e2e/auth.spec.ts

test:video-extraction:
  script:
    - npx playwright test tests/e2e/video-extraction.spec.ts

test:channel-extraction:
  script:
    - npx playwright test tests/e2e/channel-extraction.spec.ts

test:transcript-management:
  script:
    - npx playwright test tests/e2e/transcript-management.spec.ts

test:subscription-billing:
  script:
    - npx playwright test tests/e2e/subscription-billing.spec.ts
```

**Execution Time:**
- Sequential: 60 minutes
- With Strategy D: ~12 minutes (varies by suite size)

---

## Comparison Table

| Strategy | Jobs | Speedup | CI Minutes Used | Complexity | Recommended For |
|----------|------|---------|-----------------|------------|-----------------|
| **A: Browser** | 3 | 3x | 60 min | ⭐ Simple | Small projects |
| **B: Browser + Light** | 6 | 6x | 60 min | ⭐⭐ Moderate | Medium projects |
| **C: Browser + Heavy** | 10+ | 10x+ | 50-70 min | ⭐⭐⭐ Complex | Large projects |
| **D: Suite** | 5 | 5x | 60 min | ⭐⭐ Moderate | Custom control |

---

## GitLab vs GitHub Actions

### GitLab CI/CD (.gitlab-ci.yml)

```yaml
# Browser parallelization
test:chromium:
  script:
    - npx playwright test --project=chromium

# Test sharding
test:chromium:shard-1:
  script:
    - npx playwright test --project=chromium --shard=1/3

# Automatic parallel
test:auto:
  parallel: 5
  script:
    - npx playwright test --project=chromium --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
```

**Pros:**
- ✅ Native Docker support
- ✅ Better caching
- ✅ Simpler syntax for parallel jobs
- ✅ Native JUnit test reports

**Cons:**
- ⚠️ Fewer free CI minutes (400/month)

### GitHub Actions (.github/workflows/e2e-tests.yml)

```yaml
# Matrix strategy
strategy:
  matrix:
    browser: [chromium, firefox, webkit]
    shard: [1, 2, 3]
steps:
  - run: npx playwright test --project=${{ matrix.browser }} --shard=${{ matrix.shard }}/3
```

**Pros:**
- ✅ More free minutes (2,000/month)
- ✅ Larger ecosystem
- ✅ Better marketplace

**Cons:**
- ⚠️ More verbose syntax
- ⚠️ Requires actions for caching

---

## Common Commands

### Local Testing

```bash
# Run all tests
npm test

# Run specific browser
npm run test:chromium

# Run with UI
npm run test:ui

# Run specific suite
npm run test:auth

# Debug mode
npm run test:debug

# View report
npm run test:report
```

### CI Testing

```bash
# Simulate CI environment locally
docker run -it mcr.microsoft.com/playwright:v1.48.0-jammy bash

# Inside container
npm ci
npm run dev &
npx wait-on http://localhost:3000
npx playwright test
```

---

## Resource Requirements

### Per Job Requirements

| Resource | Minimum | Recommended | Optimal |
|----------|---------|-------------|---------|
| **CPU** | 1 core | 2 cores | 4 cores |
| **RAM** | 2 GB | 4 GB | 8 GB |
| **Disk** | 5 GB | 10 GB | 20 GB |
| **Network** | 10 Mbps | 50 Mbps | 100 Mbps |

### Total Pipeline Requirements

**Strategy A (3 jobs):**
- CPU: 6 cores
- RAM: 12 GB
- Time: ~20 minutes

**Strategy B (6 jobs):**
- CPU: 12 cores
- RAM: 24 GB
- Time: ~10 minutes

**Strategy C (10 jobs):**
- CPU: 20 cores
- RAM: 40 GB
- Time: ~5-7 minutes

---

## Cost Estimation

### GitLab CI/CD (SaaS)

**Free Tier:** 400 minutes/month

| Strategy | Min/Pipeline | Pipelines/Month | Total Minutes |
|----------|--------------|-----------------|---------------|
| Strategy A | 20 min | 20 | 400 min ✅ |
| Strategy B | 10 min | 40 | 400 min ✅ |
| Strategy C | 7 min | 57 | 400 min ✅ |

**Paid Tier:** $19/month for 10,000 minutes

### Self-Hosted Runner

**AWS EC2 t3.xlarge:**
- Cost: ~$120/month
- Parallel jobs: 4-6
- Minutes: Unlimited ✅

**Hetzner Cloud CX31:**
- Cost: ~$12/month
- Parallel jobs: 2-3
- Minutes: Unlimited ✅

---

## Setup Checklist

### Initial Setup

- [ ] Install dependencies: `npm install`
- [ ] Install Playwright browsers: `npx playwright install`
- [ ] Create `.env.test` from `.env.test.example`
- [ ] Test locally: `npm run test:ui`

### GitLab Setup

- [ ] Add `.gitlab-ci.yml` to repository
- [ ] Configure CI/CD variables in GitLab
- [ ] Set up GitLab Runner (or use shared)
- [ ] Push to main and verify pipeline runs
- [ ] Review first pipeline results
- [ ] Adjust configuration based on results

### Optimization

- [ ] Choose parallelization strategy
- [ ] Configure appropriate shard count
- [ ] Set up caching
- [ ] Configure artifact retention
- [ ] Set up scheduled nightly runs
- [ ] Monitor pipeline performance
- [ ] Optimize flaky tests

---

## Troubleshooting Quick Fixes

### Issue: Tests timeout

```yaml
# Increase timeout
script:
  - npx playwright test --timeout=60000
```

### Issue: App won't start

```yaml
# Increase wait time
- npx wait-on http://localhost:3000 --timeout 120000
```

### Issue: Flaky tests

```yaml
# Add retries
retry:
  max: 2
```

### Issue: Out of memory

```yaml
# Reduce parallel jobs
parallel: 3  # instead of 5
```

### Issue: Cache not working

```bash
# Clear cache in GitLab UI
# Settings → CI/CD → Clear runner caches
```

---

## Next Steps

1. **Start Simple:** Use Strategy A (Browser Parallelization)
2. **Measure Performance:** Track pipeline duration
3. **Optimize Gradually:** Add sharding if needed
4. **Monitor Costs:** Watch CI minute usage
5. **Iterate:** Adjust based on results

---

## Support Resources

- **Playwright Docs:** https://playwright.dev
- **GitLab CI/CD Docs:** https://docs.gitlab.com/ee/ci/
- **GitHub Actions Docs:** https://docs.github.com/actions
- **Project README:** `tests/README.md`
- **Detailed Guide:** `GITLAB_CI_GUIDE.md`

---

## Quick Copy-Paste Configs

### Minimal (3 jobs)

```yaml
test:chromium:
  stage: test
  script:
    - npm run dev &
    - npx wait-on http://localhost:3000
    - npx playwright test --project=chromium

test:firefox:
  stage: test
  script:
    - npm run dev &
    - npx wait-on http://localhost:3000
    - npx playwright test --project=firefox

test:webkit:
  stage: test
  script:
    - npm run dev &
    - npx wait-on http://localhost:3000
    - npx playwright test --project=webkit
```

### Recommended (6 jobs)

See full `.gitlab-ci.yml` file in repository.

### Maximum Speed (10+ jobs)

Contact team for custom configuration based on your needs.

---

**Last Updated:** 2026-01-23
