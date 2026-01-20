import type { Metadata } from 'next';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

// Display font - distinctive, geometric, modern
const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
});

// Body font - clean, highly readable, professional
const plusJakarta = Plus_Jakarta_Sans({
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${sora.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <body className="dark bg-background text-foreground antialiased flex min-h-screen flex-col font-sans">
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
