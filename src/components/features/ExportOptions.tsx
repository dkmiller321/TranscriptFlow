'use client';

import { useState } from 'react';
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

interface ExportOptionsProps {
  segments: TranscriptSegment[];
  plainText: string;
  srtContent: string;
  videoTitle: string;
}

type ExportFormat = 'txt' | 'srt' | 'json';

export function ExportOptions({
  segments,
  plainText,
  srtContent,
  videoTitle,
}: ExportOptionsProps) {
  const [copiedFormat, setCopiedFormat] = useState<ExportFormat | 'clipboard' | null>(null);

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

  return (
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
                >
                  {copiedFormat === 'clipboard' ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy to Clipboard
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy plain text transcript to clipboard</p>
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
  );
}
