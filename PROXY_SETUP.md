# Proxy Setup Guide

YouTube blocks requests from cloud providers (AWS, GCP, Azure) and IPs making too many requests. To fix this, you need rotating residential proxies.

## Quick Comparison

| Provider | Cost | Setup Difficulty | Recommendation |
|----------|------|------------------|----------------|
| **PacketStream** | $1/GB | Easy | ✅ Best for budget |
| **Webshare** | $5-10/GB | Easy | ✅ Most popular |
| **Tor** | Free | Medium | ❌ Too slow for production |

## Option 1: PacketStream ($1/GB) - Recommended

### Step 1: Sign Up
1. Go to https://packetstream.io/
2. Create an account and verify email
3. Add credits (minimum $5-10)

### Step 2: Get Credentials
1. Log in to PacketStream dashboard
2. Navigate to **Premium Residential Proxies**
3. Note your credentials:
   - **Username**: Your PacketStream username or customer ID
   - **Password**: Your account password or API key
   - **Server**: `proxy.packetstream.io:31112`

### Step 3: Configure Environment Variables
Add to your `.env.local` file:

```env
PROXY_TYPE=packetstream
PROXY_USERNAME=your_packetstream_username
PROXY_PASSWORD=your_packetstream_password
PROXY_SERVER=proxy.packetstream.io:31112
```

---

## Option 2: Webshare ($5-10/GB)

### Step 1: Sign Up
1. Go to https://www.webshare.io/
2. Create an account

### Step 2: Purchase Proxies
1. Go to **Dashboard → Purchase Proxies**
2. **IMPORTANT**: Select **"Residential Proxies"**
   - ❌ NOT "Datacenter Proxies"
   - ❌ NOT "Static Residential"
   - ✅ ONLY "Residential Proxies" (rotating)
3. Choose bandwidth (start with 1GB)
4. Complete purchase

### Step 3: Get Credentials
1. Go to https://proxy2.webshare.io/userapi/credentials
2. Copy your credentials:
   - **Proxy Username** (e.g., `abc123-rotate`)
   - **Proxy Password** (long string)

### Step 4: Configure Environment Variables
Add to your `.env.local` file:

```env
PROXY_TYPE=webshare
PROXY_USERNAME=your_webshare_username
PROXY_PASSWORD=your_webshare_password
```

---

## Testing Your Setup

### 1. Restart your development server
```bash
npm run dev
```

### 2. Test with a video
Try fetching a transcript for any YouTube video. If it works, you'll see:
- No "IP blocked" errors
- Successful transcript retrieval

### 3. Check logs
Look for successful API calls in your terminal.

---

## Troubleshooting

### "Still getting IP blocked error"
- ✅ Verify credentials are correct in `.env.local`
- ✅ Restart your dev server after adding env variables
- ✅ For Webshare: Confirm you purchased "Residential" (not "Datacenter") proxies
- ✅ Check you have remaining bandwidth on your proxy account

### "Command failed" or "Connection error"
- ✅ Check proxy server address is correct
- ✅ Verify your proxy subscription is active
- ✅ Test your proxy credentials manually

### "No transcripts available"
- This means the video genuinely has no captions (not a proxy issue)

---

## Cost Estimates

Based on typical transcript sizes (~20-50KB text):

| Usage | PacketStream Cost | Webshare Cost |
|-------|-------------------|---------------|
| 100 transcripts | ~$0.10 | ~$0.50 |
| 1,000 transcripts | ~$1.00 | ~$5.00 |
| 10,000 transcripts | ~$10.00 | ~$50.00 |

**Note**: Actual costs may vary based on transcript length and network overhead.

---

## Production Deployment

When deploying to production (Vercel, AWS, etc.):

1. Add environment variables to your hosting platform
2. Ensure the same proxy credentials are set
3. Monitor bandwidth usage in your proxy dashboard
4. Set up alerts for low balance

---

## Security Best Practices

- ✅ Never commit `.env.local` to git
- ✅ Use different credentials for dev/production
- ✅ Rotate credentials periodically
- ✅ Monitor usage for anomalies
- ✅ Keep proxy credentials in secure environment variable storage

---

## Need Help?

- **PacketStream Support**: https://packetstream.io/support
- **Webshare Support**: https://www.webshare.io/support
- **Library Issues**: https://github.com/jdepoix/youtube-transcript-api/issues
