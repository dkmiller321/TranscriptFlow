'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { TranscriptSegment } from '@/lib/youtube/types';
import { generateExportContent } from '@/lib/youtube/export';
import { useAuth } from '@/hooks/useAuth';

interface ExportOptionsProps {
  segments: TranscriptSegment[];
  plainText: string;
  srtContent: string;
  videoTitle: string;
  videoId: string;
}

type ExportFormat = 'txt' | 'srt' | 'json';

export function ExportOptions({
  segments,
  plainText,
  srtContent,
  videoTitle,
  videoId,
}: ExportOptionsProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [copiedFormat, setCopiedFormat] = useState<ExportFormat | 'clipboard' | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopiedFormat('clipboard');
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  const downloadFile = (format: ExportFormat) => {
    const content = format === 'txt'
      ? plainText
      : format === 'srt'
        ? srtContent
        : generateExportContent(segments, format, videoTitle);

    const mimeTypes = {
      txt: 'text/plain',
      srt: 'text/plain',
      json: 'application/json',
    };

    const blob = new Blob([content], { type: mimeTypes[format] });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const safeTitle = videoTitle
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .slice(0, 50);

    link.href = url;
    link.download = `${safeTitle}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const saveToLibrary = async () => {
    if (!user) {
      router.push('/login?redirect=/');
      return;
    }

    setSaveStatus('saving');

    try {
      const jsonContent = generateExportContent(segments, 'json', videoTitle);

      const response = await fetch('/api/transcripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          videoTitle,
          content: plainText,
          contentSrt: srtContent,
          contentJson: jsonContent,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        throw new Error(result.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save to library error:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
    >
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Transcript
        </CardTitle>
        <CardDescription>
          Copy to clipboard or download in your preferred format
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-4">
          {/* Copy to Clipboard */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="primary"
                  onClick={copyToClipboard}
                  className="w-full transition-all hover:scale-[1.02] active:scale-[0.98]"
                  aria-label="Copy transcript to clipboard"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {copiedFormat === 'clipboard' ? (
                      <motion.span
                        key="copied"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copy to Clipboard
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy plain text transcript to clipboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Save to Library */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  onClick={saveToLibrary}
                  disabled={saveStatus === 'saving' || authLoading}
                  className="w-full transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : saveStatus === 'saved' ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Saved to Library!
                    </>
                  ) : saveStatus === 'error' ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Failed to save
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      {user ? 'Save to Library' : 'Sign in to Save'}
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{user ? 'Save transcript to your library for later' : 'Sign in to save transcripts to your library'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Download</span>
            <Separator className="flex-1" />
          </div>

          {/* Download Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    onClick={() => downloadFile('txt')}
                    aria-label="Download transcript as TXT file"
                    className="flex flex-col h-auto py-3 gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs font-semibold">
                      {copiedFormat === 'txt' ? 'Done!' : '.TXT'}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Plain text format - easy to read</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    onClick={() => downloadFile('srt')}
                    aria-label="Download transcript as SRT subtitle file"
                    className="flex flex-col h-auto py-3 gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                    <span className="text-xs font-semibold">
                      {copiedFormat === 'srt' ? 'Done!' : '.SRT'}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Subtitle format with timestamps</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    onClick={() => downloadFile('json')}
                    aria-label="Download transcript as JSON file"
                    className="flex flex-col h-auto py-3 gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span className="text-xs font-semibold">
                      {copiedFormat === 'json' ? 'Done!' : '.JSON'}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Structured data for developers</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}
