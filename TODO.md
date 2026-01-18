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

### Option A: User Brings Own Key (BYOK)
- Pros: No API costs, scales infinitely
- Cons: Friction for users, requires Google Cloud account
- Implementation: Store encrypted in user profile, decrypt server-side

### Option B: Shared Key with Rate Limiting
- Pros: Seamless UX
- Cons: You pay for quota, risk of abuse
- YouTube API free tier: 10,000 units/day (~100 channel lookups)

### Option C: Hybrid Model (Recommended)
- Free tier: Limited extractions using shared key (5-10/day)
- Paid tier: User provides own key OR higher quota included
- Creates natural upgrade pressure

### Option D: Skip YouTube API for Channels
- Use yt-dlp for channel video lists (gray area legally)
- youtube-transcript-api doesn't need API key for transcripts
- Less reliable, potential ToS issues

### Implementation Tasks
- [ ] Add user settings page for API key input
- [ ] Encrypt and store user API keys securely
- [ ] Implement per-user rate limiting
- [ ] Add quota tracking and usage dashboard

---

## 3. Monetization Strategy

### Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 5 videos/day, no channel extraction |
| **Pro** | $9/mo | 100 videos/day, channel extraction (50 videos max) |
| **Business** | $29/mo | Unlimited, API access, priority support |

### Implementation Tasks
- [ ] Integrate Stripe for payments
- [ ] Create subscription management UI
- [ ] Implement feature gating based on tier
- [ ] Add usage tracking and limits
- [ ] Set up Stripe webhooks for subscription events
- [ ] Create billing portal for plan management

### Alternative Models to Consider
- Credits/usage-based pricing
- One-time lifetime purchase
- Team/enterprise plans

---

## 4. UI/Branding Refresh

### Name Considerations
Current: TranscriptFlow (decent but generic)

Alternatives to consider:
- TubeScript
- ScriptPull
- YTText
- Captioneer
- TranscribeYT
- SubGrab

### Design Modernization
- [ ] Migrate to Tailwind CSS + shadcn/ui
- [ ] Add glassmorphism effects
- [ ] Implement subtle gradients
- [ ] Add micro-animations and transitions
- [ ] Make dark mode the default
- [ ] Design new logo and brand assets
- [ ] Create marketing landing page

### UI Components to Update
- [ ] Homepage hero section
- [ ] URL input with better visual feedback
- [ ] Progress indicators with animations
- [ ] Results cards with modern styling
- [ ] Export buttons with icons
- [ ] Mobile-responsive improvements

---

## 5. Production Requirements

### Security & Legal (Must-Have)
- [ ] Terms of Service document
- [ ] Privacy Policy document
- [ ] GDPR compliance (cookie consent, data deletion)
- [ ] Proper CORS configuration
- [ ] Security headers (CSP, HSTS, etc.)
- [ ] Input sanitization audit
- [ ] Rate limiting per authenticated user

### Monitoring & Analytics (Must-Have)
- [ ] Error tracking (Sentry)
- [ ] Analytics (Plausible or PostHog)
- [ ] Uptime monitoring
- [ ] API performance metrics
- [ ] User behavior tracking (for product decisions)

### Infrastructure
- [ ] Database backups (Supabase handles this)
- [ ] CDN for static assets
- [ ] Redis for caching/rate limiting (optional)
- [ ] Queue system for long-running jobs

---

## 6. Future Features (Nice-to-Have)

### User Experience
- [ ] Email notifications (extraction complete)
- [ ] Save extraction preferences
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
- [ ] All critical bugs fixed
- [ ] Security audit complete
- [ ] Legal documents in place
- [ ] Payment system tested
- [ ] Error tracking configured
- [ ] Analytics installed
- [ ] Backup system verified

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

## Recommended MVP Priority

1. **Deploy frontend on Vercel** - Quick win
2. **Deploy Python worker on Railway/Render** - Solves timeout issues
3. **Implement hybrid API key model** - Enables monetization
4. **Stripe subscription integration** - Start collecting revenue
5. **UI refresh with Tailwind + shadcn/ui** - Improve conversion
6. **Legal documents** - Required for payments

---

*Last updated: January 2026*
