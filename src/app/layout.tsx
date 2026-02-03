import type { Metadata } from 'next';
import { Syne, Inter, JetBrains_Mono } from 'next/font/google';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

// Display font - bold, architectural, distinctive
const syne = Syne({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
});

// Body font - refined, highly readable, modern
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

// Mono font - for code/transcripts
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500'],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://transcript-flow.vercel.app'),
  title: {
    default: 'TranscriptFlow - YouTube Transcript Extractor',
    template: '%s | TranscriptFlow',
  },
  description: 'Extract, save, and export YouTube video transcripts with ease. Support for individual videos and entire channels. Export to TXT, SRT, or JSON.',
  keywords: ['YouTube', 'transcript', 'extractor', 'captions', 'subtitles', 'video', 'SRT', 'export'],
  authors: [{ name: 'TranscriptFlow' }],
  openGraph: {
    title: 'TranscriptFlow - YouTube Transcript Extractor',
    description: 'Extract, save, and export YouTube video transcripts with ease.',
    siteName: 'TranscriptFlow',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'TranscriptFlow - YouTube Transcript Extractor',
    description: 'Extract, save, and export YouTube video transcripts with ease.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Script to set initial theme before hydration to prevent flash
const themeScript = `
  (function() {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored ? stored === 'dark' : prefersDark;
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    }
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-background text-foreground antialiased flex min-h-screen flex-col font-sans">
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
