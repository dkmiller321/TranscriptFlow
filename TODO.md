# TranscriptFlow - Production & Monetization Roadmap

## Current Status: MVP Complete (Test Mode)

**Live URL:** https://transcript-flow.vercel.app

---

## 1. Deployment Architecture

### Vercel Deployment
- [x] Deploy Next.js frontend to Vercel
- [x] Configure environment variables in Vercel dashboard
- [ ] Set up custom domain

### Serverless Limitations to Address
- **Problem:** Vercel Hobby plan has 10s timeout, Pro has 60s. Channel extraction with 100+ videos will timeout.
- **Solutions:**
  - [ ] Deploy Python worker as separate microservice (Railway, Render, or AWS Lambda)
  - [ ] Implement streaming responses with incremental results
  - [ ] Or use Vercel Pro + background job queue (Inngest, Trigger.dev)

### Python Dependency (RESOLVED)
- **Solution:** Switched to `youtube-transcript` Node.js package
- [x] Rewrite using Node.js transcript library
- No longer need Python - works natively on Vercel serverless

---

## 2. YouTube API Key Strategy

### Hybrid Model (Implemented)
- Free tier: Limited extractions (3/day)
- Paid tier: Higher limits included
- User can add own API key for unlimited

### Implementation Tasks
- [x] Add user settings page for API key input
- [x] Encrypt and store user API keys securely
- [x] Implement per-user rate limiting
- [x] Add quota tracking and usage dashboard

---

## 3. Monetization Strategy

### Pricing Tiers (Implemented)

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 3 videos/day, TXT only, no channel extraction |
| **Pro** | $9/mo or $79/yr | 50 videos/day, all formats, channel extraction (25 videos) |
| **Business** | $29/mo or $290/yr | Unlimited, all formats, channel extraction (500 videos), API access |

### Implementation Tasks
- [x] Integrate Stripe for payments
- [x] Create subscription management UI (Settings page)
- [x] Implement feature gating based on tier
- [x] Add usage tracking and limits
- [x] Set up Stripe webhooks for subscription events
- [x] Create billing portal for plan management
- [x] Create pricing page with tier comparison
- [ ] Switch to Stripe live mode for real payments

### Stripe Configuration (Test Mode)
- Products and prices created
- Webhook endpoint configured
- Billing portal working
- Test cards working

---

## 4. UI/Branding Refresh

### Design Modernization
- [x] Migrate to Tailwind CSS + shadcn/ui
- [x] Add glassmorphism effects
- [x] Implement subtle gradients
- [x] Add micro-animations and transitions
- [x] Make dark mode the default
- [x] Design new logo and brand assets
- [x] Custom typography (Sora + Plus Jakarta Sans fonts)
- [ ] Create marketing landing page

### UI Components Updated
- [x] Homepage hero section
- [x] URL input with better visual feedback
- [x] Progress indicators with animations
- [x] Results cards with modern styling
- [x] Export buttons with icons
- [x] VideoPreview component
- [x] TranscriptViewer component
- [x] ExportOptions component
- [x] ChannelProgress component
- [x] ChannelResults component
- [x] Pricing page
- [x] Settings page with subscription status
- [ ] Mobile-responsive improvements (needs testing)

---

## 5. Production Requirements

### Security & Legal (Must-Have)
- [x] Terms of Service document (template - needs legal review)
- [x] Privacy Policy document (template - needs legal review)
- [ ] GDPR compliance (cookie consent, data deletion)
- [x] Security headers (CSP, HSTS, X-Frame-Options, etc.)
- [x] Rate limiting per authenticated user
- [ ] Input sanitization audit

### Monitoring & Analytics (Must-Have)
- [ ] Error tracking (Sentry)
- [ ] Analytics (Plausible or PostHog)
- [ ] Uptime monitoring
- [ ] API performance metrics

### Infrastructure
- [x] Database setup (Supabase)
- [x] Database migrations run
- [x] Database backups (Supabase handles this)
- [x] CDN for static assets (Vercel handles this)
- [ ] Redis for caching/rate limiting (optional)
- [ ] Queue system for long-running jobs (optional)

---

## 6. Future Features (Nice-to-Have)

### User Experience
- [ ] Email notifications (extraction complete)
- [x] Save extraction preferences (in settings)
- [ ] Bulk URL import (paste multiple URLs)
- [ ] Scheduled/recurring extractions

### Integrations
- [ ] Webhook support for automation
- [ ] Zapier/Make integration
- [ ] Chrome extension
- [ ] Public API for developers
- [ ] Notion/Google Docs export

### AI Features
- [ ] Transcript summarization
- [ ] Key points extraction
- [ ] Translation to other languages
- [ ] Speaker diarization
- [ ] Searchable transcript archive

---

## 7. Launch Checklist

### Pre-Launch (Before Real Payments)
- [x] All critical bugs fixed
- [x] Legal documents in place (templates)
- [x] Payment system tested (test mode)
- [ ] Switch Stripe to live mode
- [ ] Custom domain configured
- [ ] Error tracking configured (Sentry)
- [ ] Analytics installed
- [ ] Security audit complete
- [ ] Legal review of terms/privacy

### Launch Day
- [ ] Deploy final production build
- [ ] Monitor error rates
- [ ] Watch server metrics
- [ ] Respond to user feedback

### Post-Launch
- [ ] Gather user feedback
- [ ] Prioritize bug fixes
- [ ] Plan v1.1 features
- [ ] Set up customer support workflow

---

## Remaining Work (Priority Order)

### High Priority (Before Real Payments)
1. [ ] **Custom domain** - Set up your own domain
2. [ ] **Stripe live mode** - Switch from test to live keys
3. [ ] **Error monitoring** - Set up Sentry
4. [ ] **Analytics** - Set up Plausible or PostHog

### Medium Priority
5. [ ] **Legal review** - Have lawyer review terms/privacy
6. [x] **Logo/branding** - Design professional logo
7. [ ] **Marketing page** - Create landing page for conversions

### Low Priority (Post-Launch)
8. [x] **Python worker** - No longer needed (switched to Node.js)
9. [ ] **Mobile testing** - Verify responsive design
10. [ ] **API documentation** - For Business tier users

---

## Files Added/Modified (Stripe Integration)

### New Files
- `src/lib/stripe/index.ts` - Stripe SDK configuration
- `src/app/api/stripe/checkout/route.ts` - Checkout session creation
- `src/app/api/stripe/webhook/route.ts` - Webhook handler
- `src/app/api/stripe/portal/route.ts` - Billing portal
- `src/app/pricing/page.tsx` - Pricing page
- `scripts/setup-stripe.ts` - Stripe products setup script

### Modified Files
- `src/lib/usage/tiers.ts` - Updated with pricing and Stripe price IDs
- `src/lib/usage/tracking.ts` - Added subscription info functions
- `src/app/(main)/settings/page.tsx` - Added subscription management
- `src/app/api/usage/route.ts` - Returns subscription details
- `src/components/layout/Header.tsx` - Added Pricing link
- `middleware.ts` - Excluded webhook from auth

---

## Files Added/Modified (Logo & Typography)

### New Files
- `src/components/ui/Logo.tsx` - Logo component (icon + text variants)
- `public/favicon.svg` - SVG favicon
- `src/app/icon.tsx` - Dynamic PNG favicon (32x32)
- `src/app/apple-icon.tsx` - Apple touch icon (180x180)

### Modified Files
- `src/app/layout.tsx` - Added Sora, Plus Jakarta Sans, JetBrains Mono fonts + enhanced metadata
- `tailwind.config.js` - Registered font families (font-sans, font-display, font-mono)
- `src/components/layout/Header.tsx` - Uses Logo component
- `src/components/layout/Footer.tsx` - Uses Logo component
- `src/app/page.tsx` - Hero uses Logo component
- `src/app/pricing/page.tsx` - Headings use display font

### Brand Assets
- **Logo colors:** Cyan (#22d3ee) to Blue (#3b82f6) gradient
- **Display font:** Sora (geometric, modern)
- **Body font:** Plus Jakarta Sans (clean, readable)
- **Mono font:** JetBrains Mono (for transcripts/code)

---

*Last updated: January 2026*
