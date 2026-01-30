'use client';

import * as React from 'react';
import { ExternalLink, FileText, FileJson, Captions, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { TagInput } from '@/components/ui/TagInput';
import { formatRelativeTime, formatWordCount } from '@/lib/utils/formatters';

interface SavedTranscript {
  id: string;
  video_id: string;
  video_title: string;
  content: string;
  is_favorite: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface TranscriptDetailModalProps {
  transcript: SavedTranscript | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (id: string, format: 'txt' | 'srt' | 'json') => void;
  onTagsUpdate: (id: string, tags: string[]) => void;
}

export function TranscriptDetailModal({
  transcript,
  open,
  onOpenChange,
  onExport,
  onTagsUpdate,
}: TranscriptDetailModalProps) {
  const [tags, setTags] = React.useState<string[]>([]);
  const [isSavingTags, setIsSavingTags] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (transcript) {
      setTags(transcript.tags || []);
    }
  }, [transcript]);

  React.useEffect(() => {
    if (!open) {
      setCopied(false);
    }
  }, [open]);

  const handleTagsChange = async (newTags: string[]) => {
    if (!transcript) return;

    setTags(newTags);
    setIsSavingTags(true);

    try {
      await onTagsUpdate(transcript.id, newTags);
    } finally {
      setIsSavingTags(false);
    }
  };

  const handleCopy = async () => {
    if (!transcript) return;

    try {
      await navigator.clipboard.writeText(transcript.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  const youtubeUrl = transcript
    ? `https://www.youtube.com/watch?v=${transcript.video_id}`
    : '';

  if (!transcript) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="pr-8 line-clamp-2">
            {transcript.video_title}
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
            <span>{formatWordCount(transcript.content.split(/\s+/).length)}</span>
            <span>Saved {formatRelativeTime(transcript.created_at)}</span>
          </div>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 py-3 border-b">
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Watch on YouTube
          </a>

          <div className="h-6 w-px bg-border mx-1" />

          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            className="gap-1.5"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>

          <div className="h-6 w-px bg-border mx-1" />

          <span className="text-sm text-muted-foreground mr-1">Export:</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onExport(transcript.id, 'txt')}
            className="gap-1.5"
          >
            <FileText className="h-4 w-4" />
            TXT
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onExport(transcript.id, 'srt')}
            className="gap-1.5"
          >
            <Captions className="h-4 w-4" />
            SRT
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onExport(transcript.id, 'json')}
            className="gap-1.5"
          >
            <FileJson className="h-4 w-4" />
            JSON
          </Button>
        </div>

        <div className="py-3 border-b">
          <label className="text-sm font-medium mb-2 block">
            Tags {isSavingTags && <span className="text-muted-foreground">(saving...)</span>}
          </label>
          <TagInput
            tags={tags}
            onTagsChange={handleTagsChange}
            placeholder="Add tags (press Enter or comma)"
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto py-4">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-muted/50 p-4 rounded-lg">
              {transcript.content}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
