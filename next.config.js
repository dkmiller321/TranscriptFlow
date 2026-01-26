/** @type {import('next').NextConfig} */

// Security headers configuration
const securityHeaders = [
  {
    // Controls DNS prefetching - 'on' allows browsers to prefetch DNS for external links
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    // HTTP Strict Transport Security - forces HTTPS for 2 years, includes subdomains
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    // Prevents the page from being embedded in iframes (clickjacking protection)
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    // Prevents MIME type sniffing
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Controls how much referrer information is shared
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Content Security Policy - comprehensive policy for TranscriptFlow
    key: 'Content-Security-Policy',
    value: [
      // Default fallback for directives not explicitly set
      "default-src 'self'",
      // Scripts: self, inline (for Next.js), eval (for development), and Google APIs
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.youtube.com https://s.ytimg.com",
      // Styles: self and inline (required for styled-components/CSS-in-JS)
      "style-src 'self' 'unsafe-inline'",
      // Images: self, data URIs, YouTube thumbnails, and Supabase storage
      "img-src 'self' data: blob: https://i.ytimg.com https://img.youtube.com https://*.supabase.co",
      // Fonts: self and data URIs
      "font-src 'self' data:",
      // Connections: self, Supabase, YouTube/Google APIs
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.googleapis.com https://youtube.googleapis.com https://www.youtube.com",
      // Media: self and YouTube
      "media-src 'self' https://www.youtube.com https://*.youtube.com",
      // Frames: YouTube embeds
      "frame-src 'self' https://www.youtube.com https://youtube.com",
      // Frame ancestors: only same origin (prevents clickjacking)
      "frame-ancestors 'self'",
      // Form submissions: self only
      "form-action 'self'",
      // Base URI: self only
      "base-uri 'self'",
      // Object sources: none (blocks plugins like Flash)
      "object-src 'none'",
      // Upgrade insecure requests to HTTPS
      'upgrade-insecure-requests',
    ].join('; '),
  },
  {
    // Permissions Policy - controls browser features
    key: 'Permissions-Policy',
    value: [
      'accelerometer=()',
      'camera=()',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'payment=()',
      'usb=()',
      // Allow fullscreen for YouTube embeds
      'fullscreen=(self "https://www.youtube.com")',
      // Allow autoplay for YouTube videos
      'autoplay=(self "https://www.youtube.com")',
    ].join(', '),
  },
];

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude ytdl-core from client-side bundle
      config.externals.push('@distube/ytdl-core');
    }
    return config;
  },
};

module.exports = nextConfig;
