import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TranscriptFlow - YouTube Transcript Extractor',
  description: 'Extract, save, and export YouTube video transcripts with ease',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
