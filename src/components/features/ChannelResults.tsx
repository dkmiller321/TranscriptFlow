'use client';

import { useState } from 'react';
import JSZip from 'jszip';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ChannelInfo, VideoTranscriptResult, ChannelVideoItem, ChannelOutputFormat } from '@/lib/youtube/types';
import { generateCombinedTranscript, generateIndividualTranscripts } from '@/lib/youtube/export';

interface ChannelResultsProps {
  channelInfo: ChannelInfo;
  results: Array<{
    video: ChannelVideoItem;
    transcript: VideoTranscriptResult | null;
  }>;
  outputFormat: ChannelOutputFormat;
  onReset: () => void;
}

type ExportFormat = 'txt' | 'srt' | 'json';

export function ChannelResults({
  channelInfo,
  results,
  outputFormat,
  onReset,
}: ChannelResultsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const successfulResults = results.filter((r) => r.transcript?.status === 'success');
  const failedResults = results.filter((r) => r.transcript?.status !== 'success');

  const totalWordCount = successfulResults.reduce(
    (sum, r) => sum + (r.transcript?.wordCount || 0),
    0
  );

  const handleDownload = async (format: ExportFormat) => {
    setIsExporting(true);

    try {
      if (outputFormat === 'combined') {
        const content = generateCombinedTranscript(results, format, channelInfo.name);
        const filename = `${sanitizeFilename(channelInfo.name)}_transcripts.${format}`;
        downloadFile(content, filename, getMimeType(format));
      } else {
        const files = generateIndividualTranscripts(results, format);
        const zip = new JSZip();

        for (const file of files) {
          zip.file(file.filename, file.content);
        }

        const blob = await zip.generateAsync({ type: 'blob' });
        const filename = `${sanitizeFilename(channelInfo.name)}_transcripts.zip`;
        downloadBlob(blob, filename);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <CardContent className="relative p-6">
          <div className="flex items-center gap-4">
            <img
              src={channelInfo.thumbnailUrl}
              alt={channelInfo.name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20 shadow-lg"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground truncate">
                {channelInfo.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="secondary" className="font-medium">
                  {successfulResults.length} videos extracted
                </Badge>
                <Badge variant="outline" className="font-medium">
                  {totalWordCount.toLocaleString()} words total
                </Badge>
                {failedResults.length > 0 && (
                  <Badge variant="destructive" className="font-medium">
                    {failedResults.length} failed
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={onReset}
              className="shrink-0 hover:bg-secondary"
            >
              New Extraction
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Download Transcripts</CardTitle>
          <CardDescription>
            {outputFormat === 'combined'
              ? 'All transcripts combined into a single file'
              : 'Individual transcript files in a ZIP archive'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => handleDownload('txt')}
              disabled={isExporting || successfulResults.length === 0}
              className="transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {outputFormat === 'individual' ? 'Download TXT (ZIP)' : 'Download TXT'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleDownload('srt')}
              disabled={isExporting || successfulResults.length === 0}
              className="transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              {outputFormat === 'individual' ? 'Download SRT (ZIP)' : 'Download SRT'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleDownload('json')}
              disabled={isExporting || successfulResults.length === 0}
              className="transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              {outputFormat === 'individual' ? 'Download JSON (ZIP)' : 'Download JSON'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Video List */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            Processed Videos
            <Badge variant="secondary" className="ml-2 font-normal">
              {results.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {results.map(({ video, transcript }) => (
              <div
                key={video.videoId}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
              >
                <div className="relative shrink-0">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-20 h-[45px] object-cover rounded-md shadow-sm"
                  />
                  {transcript?.status === 'success' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {transcript?.status !== 'success' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center shadow-sm">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {video.title}
                  </p>
                  <div className="mt-1">
                    {transcript?.status === 'success' ? (
                      <span className="text-xs text-green-500 font-medium">
                        {transcript.wordCount.toLocaleString()} words
                      </span>
                    ) : (
                      <span className="text-xs text-destructive font-medium">
                        {transcript?.error || 'Failed'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}

function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'txt':
      return 'text/plain';
    case 'srt':
      return 'text/srt';
    case 'json':
      return 'application/json';
    default:
      return 'text/plain';
  }
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
