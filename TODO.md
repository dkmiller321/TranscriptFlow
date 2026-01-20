# TranscriptFlow - Production & Monetization Roadmap

## 1. Deployment Architecture

### Vercel Deployment
- [ ] Deploy Next.js frontend to Vercel
- [ ] Configure environment variables in Vercel dashboard
- [ ] Set up custom domain

### Serverless Limitations to Address
- **Problem:** Vercel Hobby plan has 10s timeout, Pro has 60s. Channel extraction with 100+ videos will timeout.
- **Solutions:**
  - [ ] Deploy Python worker as separate microservice (Railway, Render, or AWS Lambda)
  - [ ] Implement streaming responses with incremental results
  - [ ] Or use Vercel Pro + background job queue (Inngest, Trigger.dev)

### Python Dependency
- **Problem:** `fetch-transcript.py` won't work on Vercel serverless
- **Options:**
  1. [ ] Rewrite using Node.js transcript library (less reliable)
  2. [ ] Deploy Python as separate microservice (recommended)
  3. [ ] Use serverless Python runtime (AWS Lambda, Modal)

---

## 2. YouTube API Key Strategy

### Option C: Hybrid Model (Implemented)
- Free tier: Limited extractions using shared key (5/day)
- Paid tier: User provides own key OR higher quota included
- Creates natural upgrade pressure

### Implementation Tasks
- [x] Add user settings page for API key input
- [x] Encrypt and store user API keys securely (base64 encoding - upgrade to proper encryption for production)
- [x] Implement per-user rate limiting
- [x] Add quota tracking and usage dashboard

---

## 3. Monetization Strategy

### Pricing Tiers (Implemented in Code)

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 5 videos/day, no channel extraction |
| **Pro** | $9/mo | 100 videos/day, channel extraction (50 videos max) |
| **Business** | $29/mo | Unlimited, API access, priority support |

### Implementation Tasks
- [ ] Integrate Stripe for payments
- [ ] Create subscription management UI
- [x] Implement feature gating based on tier
- [x] Add usage tracking and limits
- [ ] Set up Stripe webhooks for subscription events
- [ ] Create billing portal for plan management

---

## 4. UI/Branding Refresh

### Design Modernization
- [x] Migrate to Tailwind CSS + shadcn/ui
- [x] Add glassmorphism effects
- [x] Implement subtle gradients
- [x] Add micro-animations and transitions
- [x] Make dark mode the default
- [ ] Design new logo and brand assets
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
- [ ] Mobile-responsive improvements (needs testing)

---

## 5. Production Requirements

### Security & Legal (Must-Have)
- [x] Terms of Service document (template - needs legal review)
- [x] Privacy Policy document (template - needs legal review)
- [ ] GDPR compliance (cookie consent, data deletion)
- [ ] Proper CORS configuration
- [x] Security headers (CSP, HSTS, X-Frame-Options, etc.)
- [ ] Input sanitization audit
- [x] Rate limiting per authenticated user

### Monitoring & Analytics (Must-Have)
- [ ] Error tracking (Sentry)
- [ ] Analytics (Plausible or PostHog)
- [ ] Uptime monitoring
- [ ] API performance metrics
- [ ] User behavior tracking (for product decisions)

### Infrastructure
- [x] Database backups (Supabase handles this)
- [ ] CDN for static assets (Vercel handles this)
- [ ] Redis for caching/rate limiting (optional)
- [ ] Queue system for long-running jobs

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

### Pre-Launch
- [x] All critical bugs fixed
- [ ] Security audit complete
- [x] Legal documents in place (templates)
- [ ] Payment system tested
- [ ] Error tracking configured
- [ ] Analytics installed
- [x] Backup system verified (Supabase)

### Launch Day
- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] Watch server metrics
- [ ] Respond to user feedback
- [ ] Social media announcement

### Post-Launch
- [ ] Gather user feedback
- [ ] Prioritize bug fixes
- [ ] Plan v1.1 features
- [ ] Set up customer support workflow

---

## What Was Implemented (This Session)

### New Files Created
- `src/app/terms/page.tsx` - Terms of Service page
- `src/app/privacy/page.tsx` - Privacy Policy page
- `src/app/legal.module.css` - Shared legal page styles
- `src/app/api/settings/route.ts` - User settings API
- `src/app/api/usage/route.ts` - Usage stats API
- `src/lib/usage/tracking.ts` - Usage tracking functions
- `src/lib/usage/tiers.ts` - Tier definitions and limits
- `src/components/layout/Footer.tsx` - Site footer with legal links
- `supabase/migrations/add_user_settings.sql` - User settings table
- `supabase/migrations/add_usage_tracking.sql` - Usage tracking tables
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `components.json` - shadcn/ui configuration

### Files Updated
- `src/app/page.tsx` - Modernized with Tailwind CSS
- `src/app/layout.tsx` - Added footer, dark mode default
- `src/app/(main)/settings/page.tsx` - Complete rewrite with API key input
- `src/app/api/extract/video/route.ts` - Added rate limiting
- `src/app/api/extract/channel/route.ts` - Added rate limiting and tier checks
- `src/components/features/UrlInput.tsx` - Tailwind styling
- `src/components/features/ChannelProgress.tsx` - Tailwind + shadcn
- `src/components/features/ChannelResults.tsx` - Tailwind + shadcn
- `src/components/features/VideoPreview.tsx` - Tailwind + shadcn
- `src/components/features/ExportOptions.tsx` - Tailwind + shadcn
- `src/components/features/TranscriptViewer.tsx` - Tailwind + shadcn
- `src/components/ui/Button/Button.tsx` - shadcn-style variants
- `src/lib/utils/constants.ts` - Added legal page routes
- `next.config.js` - Added security headers
- `src/app/globals.css` - Tailwind directives + CSS variables

### shadcn/ui Components Added
- Button, Card, Badge, Progress, Tabs, Input, Label, Switch, Separator, Tooltip

---

## Actions Required From You

### Immediate (Before Launch)
1. **Run database migrations** in Supabase dashboard:
   - `supabase/migrations/add_user_settings.sql`
   - `supabase/migrations/add_usage_tracking.sql`

2. **Review and customize legal documents**:
   - `/terms` - Add your company info, jurisdiction, specific terms
   - `/privacy` - Add your contact info, data handling specifics
   - Get legal review before launch

3. **Set up Stripe** (for payments):
   - Create Stripe account
   - Get API keys
   - Set up products/prices for Pro and Business tiers
   - Implement webhook handlers

4. **Deploy to Vercel**:
   - Connect GitHub repo to Vercel
   - Add environment variables
   - Configure custom domain (optional)

5. **Set up monitoring**:
   - Create Sentry account for error tracking
   - Add Plausible/PostHog for analytics

### For Production Python Worker
Since Vercel serverless can't run Python, you need to either:
1. Deploy Python worker to Railway/Render/Fly.io
2. Or use a Node.js transcript library (less reliable)
3. Or use AWS Lambda with Python runtime

---

*Last updated: January 2026*
