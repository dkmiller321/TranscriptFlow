'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TranscriptSegment } from '@/lib/youtube/types';
import { formatDuration } from '@/lib/utils/formatters';

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  plainText: string;
}

type ViewMode = 'plain' | 'timestamped';

export function TranscriptViewer({ segments, plainText }: TranscriptViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('plain');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSegments = useMemo(() => {
    if (!searchQuery.trim()) return segments;
    const query = searchQuery.toLowerCase();
    return segments.filter((segment) =>
      segment.text.toLowerCase().includes(query)
    );
  }, [segments, searchQuery]);

  const highlightedPlainText = useMemo(() => {
    if (!searchQuery.trim()) return plainText;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return plainText.replace(regex, '<mark class="bg-yellow-300/50 dark:bg-yellow-500/30 text-foreground rounded px-0.5">$1</mark>');
  }, [plainText, searchQuery]);

  const matchCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return (plainText.match(regex) || []).length;
  }, [plainText, searchQuery]);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg overflow-hidden">
      <CardHeader className="pb-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Transcript
          </CardTitle>

          {/* Tab-like View Mode Toggle */}
          <div className="inline-flex items-center rounded-lg bg-muted p-1 text-muted-foreground">
            <button
              onClick={() => setViewMode('plain')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                viewMode === 'plain'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'hover:bg-background/50 hover:text-foreground'
              }`}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Plain Text
            </button>
            <button
              onClick={() => setViewMode('timestamped')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                viewMode === 'timestamped'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'hover:bg-background/50 hover:text-foreground'
              }`}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Timestamped
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcript..."
            className="w-full pl-10 pr-20 py-2.5 text-sm bg-secondary/50 border border-border/50 rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
          {searchQuery && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-medium">
                {matchCount} match{matchCount !== 1 ? 'es' : ''}
              </Badge>
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="relative rounded-lg bg-secondary/30 border border-border/30 overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {viewMode === 'plain' ? (
              <div
                className="p-4 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap font-mono"
                dangerouslySetInnerHTML={{ __html: highlightedPlainText }}
              />
            ) : (
              <div className="divide-y divide-border/30">
                {filteredSegments.length > 0 ? (
                  filteredSegments.map((segment, index) => (
                    <div
                      key={index}
                      className="flex gap-4 p-3 hover:bg-secondary/50 transition-colors group"
                    >
                      <span className="shrink-0 px-2 py-0.5 text-xs font-mono font-medium text-primary bg-primary/10 rounded-md h-fit">
                        {formatDuration(Math.floor(segment.offset / 1000))}
                      </span>
                      <span className="text-sm text-foreground/90 leading-relaxed">
                        {searchQuery.trim() ? (
                          <span
                            dangerouslySetInnerHTML={{
                              __html: segment.text.replace(
                                new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                                '<mark class="bg-yellow-300/50 dark:bg-yellow-500/30 text-foreground rounded px-0.5">$1</mark>'
                              ),
                            }}
                          />
                        ) : (
                          segment.text
                        )}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-sm font-medium">No matches found</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
