# Technical Specification: YouTube Transcript Extraction Application

## Project Overview

Build **TranscriptFlow**, a production-ready web application that extracts transcripts from YouTube videos and channels. Users can input any YouTube URL, extract transcripts in multiple formats, and manage their extraction history through a clean, accessible interface.

### Goals
- Extract transcripts from single videos or entire channels
- Support multiple export formats (TXT, SRT, JSON)
- Provide authenticated user experience with history and saved transcripts
- Deliver real-time processing status updates
- Ensure responsive, accessible, and themeable UI

### Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | React 19 |
| Language | TypeScript 5.9 (strict mode) |
| Build | Vite 7 |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Real-time | Supabase Realtime (Postgres Changes) |
| Styling | CSS Modules + CSS Custom Properties |
| Deployment | Vercel (Edge Functions) |

---

## Database Schema

### Tables

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  preferences JSONB DEFAULT '{"theme": "system", "defaultFormat": "txt", "autoSave": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extraction history
CREATE TABLE public.extraction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  video_title TEXT NOT NULL,
  channel_name TEXT,
  channel_id TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  language TEXT DEFAULT 'en',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  transcript_preview TEXT, -- First 500 chars
  word_count INTEGER,
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved transcripts (full content)
CREATE TABLE public.saved_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  extraction_id UUID REFERENCES public.extraction_history(id) ON DELETE SET NULL,
  video_id TEXT NOT NULL,
  video_title TEXT NOT NULL,
  content TEXT NOT NULL, -- Full transcript
  content_srt TEXT, -- SRT formatted version
  content_json JSONB, -- Timestamped segments
  language TEXT DEFAULT 'en',
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting tracking
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL, -- 'single', 'batch', 'channel'
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_extraction_history_user_id ON public.extraction_history(user_id);
CREATE INDEX idx_extraction_history_video_id ON public.extraction_history(video_id);
CREATE INDEX idx_extraction_history_status ON public.extraction_history(status);
CREATE INDEX idx_saved_transcripts_user_id ON public.saved_transcripts(user_id);
CREATE INDEX idx_saved_transcripts_video_id ON public.saved_transcripts(video_id);
CREATE INDEX idx_rate_limits_user_window ON public.rate_limits(user_id, window_start);
```

### Row Level Security Policies

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extraction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Extraction history: users can only access their own
CREATE POLICY "Users can view own extractions"
  ON public.extraction_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own extractions"
  ON public.extraction_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own extractions"
  ON public.extraction_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own extractions"
  ON public.extraction_history FOR DELETE
  USING (auth.uid() = user_id);

-- Saved transcripts: users can only access their own
CREATE POLICY "Users can view own saved transcripts"
  ON public.saved_transcripts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved transcripts"
  ON public.saved_transcripts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved transcripts"
  ON public.saved_transcripts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved transcripts"
  ON public.saved_transcripts FOR DELETE
  USING (auth.uid() = user_id);
```

---

## API Endpoints (Vercel Edge Functions)

### `/api/extract/video`
**POST** - Extract transcript from single video

```typescript
// Request
interface ExtractVideoRequest {
  url: string;
  language?: string; // ISO 639-1 code
  includeTimestamps?: boolean;
}

// Response
interface ExtractVideoResponse {
  success: boolean;
  data?: {
    videoId: string;
    title: string;
    channelName: string;
    channelId: string;
    thumbnailUrl: string;
    durationSeconds: number;
    transcript: TranscriptSegment[];
    availableLanguages: string[];
    wordCount: number;
  };
  error?: {
    code: 'INVALID_URL' | 'VIDEO_NOT_FOUND' | 'NO_TRANSCRIPT' | 'RATE_LIMITED' | 'INTERNAL_ERROR';
    message: string;
  };
}

interface TranscriptSegment {
  text: string;
  start: number; // seconds
  duration: number; // seconds
}
```

### `/api/extract/channel`
**POST** - List videos from channel or extract multiple

```typescript
// Request
interface ExtractChannelRequest {
  url: string;
  action: 'list' | 'extract';
  videoIds?: string[]; // For selective extraction
  maxVideos?: number; // For batch extraction
  language?: string;
}

// Response (list action)
interface ChannelListResponse {
  success: boolean;
  data?: {
    channelId: string;
    channelName: string;
    subscriberCount: string;
    videos: ChannelVideo[];
    nextPageToken?: string;
  };
  error?: ApiError;
}

interface ChannelVideo {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  durationSeconds: number;
  hasTranscript: boolean;
}

// Response (extract action)
interface ChannelExtractResponse {
  success: boolean;
  data?: {
    jobId: string; // For tracking via realtime
    totalVideos: number;
    estimatedTime: number; // seconds
  };
  error?: ApiError;
}
```

### `/api/extract/status/:jobId`
**GET** - Get batch extraction status

```typescript
interface ExtractionStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    completed: number;
    total: number;
    currentVideo?: string;
  };
  results?: {
    successful: string[];
    failed: Array<{ videoId: string; error: string }>;
  };
}
```

### `/api/transcripts`
**GET** - List saved transcripts (paginated)
**POST** - Save transcript
**DELETE** - Delete transcript

### `/api/history`
**GET** - Get extraction history (paginated)
**DELETE** - Clear history

### `/api/export`
**POST** - Export transcript in specified format

```typescript
interface ExportRequest {
  transcriptId?: string;
  content?: string; // Raw content for unsaved transcripts
  format: 'txt' | 'srt' | 'json';
  filename?: string;
}
```

---

## Project Structure

```
transcriptflow/
├── public/
│   ├── favicon.ico
│   └── og-image.png
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── App.module.css
│   │   └── routes.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── LoginForm.module.css
│   │   │   │   ├── SignupForm.tsx
│   │   │   │   ├── AuthProvider.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── actions/
│   │   │   │   └── authActions.ts
│   │   │   └── index.ts
│   │   ├── extraction/
│   │   │   ├── components/
│   │   │   │   ├── UrlInput.tsx
│   │   │   │   ├── UrlInput.module.css
│   │   │   │   ├── VideoPreview.tsx
│   │   │   │   ├── TranscriptViewer.tsx
│   │   │   │   ├── TranscriptViewer.module.css
│   │   │   │   ├── LanguageSelector.tsx
│   │   │   │   ├── ExportOptions.tsx
│   │   │   │   ├── ChannelVideoList.tsx
│   │   │   │   ├── BatchProgress.tsx
│   │   │   │   └── ProcessingStatus.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useExtraction.ts
│   │   │   │   ├── useUrlValidation.ts
│   │   │   │   └── useRealtimeStatus.ts
│   │   │   ├── actions/
│   │   │   │   └── extractionActions.ts
│   │   │   ├── utils/
│   │   │   │   ├── urlParser.ts
│   │   │   │   ├── formatters.ts
│   │   │   │   └── exportUtils.ts
│   │   │   └── index.ts
│   │   ├── history/
│   │   │   ├── components/
│   │   │   │   ├── HistoryList.tsx
│   │   │   │   ├── HistoryItem.tsx
│   │   │   │   └── HistoryFilters.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useHistory.ts
│   │   │   └── index.ts
│   │   ├── library/
│   │   │   ├── components/
│   │   │   │   ├── SavedTranscripts.tsx
│   │   │   │   ├── TranscriptCard.tsx
│   │   │   │   ├── TranscriptSearch.tsx
│   │   │   │   └── TagManager.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useLibrary.ts
│   │   │   └── index.ts
│   │   └── settings/
│   │       ├── components/
│   │       │   ├── SettingsPanel.tsx
│   │       │   ├── ThemeToggle.tsx
│   │       │   └── PreferencesForm.tsx
│   │       └── index.ts
│   ├── shared/
│   │   ├── components/
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   └── Button.module.css
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   ├── Toast/
│   │   │   ├── Spinner/
│   │   │   ├── VirtualList/
│   │   │   ├── ErrorBoundary/
│   │   │   └── Layout/
│   │   │       ├── Header.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       └── Layout.module.css
│   │   ├── hooks/
│   │   │   ├── useToast.ts
│   │   │   ├── useClipboard.ts
│   │   │   ├── useTheme.ts
│   │   │   └── useMediaQuery.ts
│   │   └── utils/
│   │       ├── cn.ts
│   │       └── constants.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── types.ts
│   │   └── api/
│   │       └── client.ts
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── reset.css
│   │   └── global.css
│   ├── types/
│   │   ├── database.ts
│   │   ├── api.ts
│   │   └── index.ts
│   └── main.tsx
├── api/
│   ├── extract/
│   │   ├── video.ts
│   │   ├── channel.ts
│   │   └── status/
│   │       └── [jobId].ts
│   ├── transcripts/
│   │   └── index.ts
│   ├── history/
│   │   └── index.ts
│   ├── export/
│   │   └── index.ts
│   └── _lib/
│       ├── youtube.ts
│       ├── rateLimit.ts
│       └── auth.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.local
├── .env.example
├── vite.config.ts
├── tsconfig.json
├── vercel.json
└── package.json
```

---

## Component Specifications

### Core Components

#### `UrlInput`
Primary input for YouTube URLs with validation feedback.

```typescript
interface UrlInputProps {
  onSubmit: (url: string, type: 'video' | 'channel') => void;
  isProcessing: boolean;
}

// Features:
// - Paste detection with auto-submit option
// - Real-time validation with visual feedback
// - URL type detection (video vs channel)
// - Keyboard shortcut support (Cmd/Ctrl + V to paste and submit)
// - Clear button
// - Recent URLs dropdown (from history)
```

#### `TranscriptViewer`
Display and interact with extracted transcript.

```typescript
interface TranscriptViewerProps {
  transcript: TranscriptSegment[];
  videoId: string;
  videoTitle: string;
  onSave: () => void;
  onExport: (format: ExportFormat) => void;
}

// Features:
// - Virtual scrolling for long transcripts
// - Timestamp linking (click to open video at time)
// - Search within transcript with highlighting
// - Copy selection or full transcript
// - Toggle timestamps display
// - Responsive layout
```

#### `ChannelVideoList`
Display and select videos from a channel.

```typescript
interface ChannelVideoListProps {
  videos: ChannelVideo[];
  onSelectVideos: (videoIds: string[]) => void;
  onExtractAll: () => void;
  isLoading: boolean;
}

// Features:
// - Checkbox selection with select all
// - Filter by has transcript
// - Sort by date, title, duration
// - Infinite scroll with virtual list
// - Video preview on hover
```

#### `BatchProgress`
Real-time progress for batch extractions.

```typescript
interface BatchProgressProps {
  jobId: string;
  onComplete: (results: BatchResults) => void;
  onCancel: () => void;
}

// Features:
// - Real-time progress bar
// - Current video indicator
// - Success/failure counts
// - Cancel option
// - Estimated time remaining
```

---

## CSS Architecture

### Design Tokens (`styles/tokens.css`)

```css
:root {
  /* Color Palette - Light Theme */
  --color-background: #fafafa;
  --color-surface: #ffffff;
  --color-surface-elevated: #ffffff;
  --color-border: #e5e5e5;
  --color-border-subtle: #f0f0f0;
  
  --color-text-primary: #171717;
  --color-text-secondary: #525252;
  --color-text-tertiary: #a3a3a3;
  --color-text-inverse: #fafafa;
  
  --color-accent: #dc2626;
  --color-accent-hover: #b91c1c;
  --color-accent-subtle: #fef2f2;
  
  --color-success: #16a34a;
  --color-warning: #ca8a04;
  --color-error: #dc2626;
  
  /* Typography */
  --font-sans: 'General Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 2rem;
  
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  
  /* Radii */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  /* Transitions */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 350ms;
  --easing-default: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  
  /* Z-Index */
  --z-dropdown: 100;
  --z-modal: 200;
  --z-toast: 300;
}

/* Dark Theme */
[data-theme="dark"] {
  --color-background: #0a0a0a;
  --color-surface: #171717;
  --color-surface-elevated: #262626;
  --color-border: #404040;
  --color-border-subtle: #262626;
  
  --color-text-primary: #fafafa;
  --color-text-secondary: #a3a3a3;
  --color-text-tertiary: #737373;
  --color-text-inverse: #171717;
  
  --color-accent-subtle: #450a0a;
  
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
}
```

---

## Key Implementation Patterns

### React 19 Server Actions Pattern

```typescript
// features/extraction/actions/extractionActions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { extractTranscript } from '@/api/_lib/youtube';
import { revalidatePath } from 'next/cache';

export async function extractVideoTranscript(
  prevState: ExtractionState,
  formData: FormData
): Promise<ExtractionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Unauthorized', success: false };
  }
  
  const url = formData.get('url') as string;
  const language = formData.get('language') as string || 'en';
  
  try {
    // Create pending record
    const { data: extraction } = await supabase
      .from('extraction_history')
      .insert({
        user_id: user.id,
        video_id: '', // Will update
        video_title: '',
        status: 'processing'
      })
      .select()
      .single();
    
    // Extract transcript
    const result = await extractTranscript(url, language);
    
    // Update record with results
    await supabase
      .from('extraction_history')
      .update({
        video_id: result.videoId,
        video_title: result.title,
        channel_name: result.channelName,
        status: 'completed',
        transcript_preview: result.transcript.slice(0, 500),
        word_count: result.wordCount
      })
      .eq('id', extraction.id);
    
    revalidatePath('/history');
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Extraction failed'
    };
  }
}
```

### useOptimistic for Instant Feedback

```typescript
// features/library/hooks/useLibrary.ts
import { useOptimistic, useTransition } from 'react';
import { toggleFavorite, deleteTranscript } from '../actions/libraryActions';

export function useLibrary(initialTranscripts: SavedTranscript[]) {
  const [isPending, startTransition] = useTransition();
  
  const [optimisticTranscripts, addOptimistic] = useOptimistic(
    initialTranscripts,
    (state, update: { type: 'favorite' | 'delete'; id: string }) => {
      switch (update.type) {
        case 'favorite':
          return state.map(t =>
            t.id === update.id ? { ...t, is_favorite: !t.is_favorite } : t
          );
        case 'delete':
          return state.filter(t => t.id !== update.id);
        default:
          return state;
      }
    }
  );
  
  const handleToggleFavorite = (id: string) => {
    startTransition(async () => {
      addOptimistic({ type: 'favorite', id });
      await toggleFavorite(id);
    });
  };
  
  const handleDelete = (id: string) => {
    startTransition(async () => {
      addOptimistic({ type: 'delete', id });
      await deleteTranscript(id);
    });
  };
  
  return {
    transcripts: optimisticTranscripts,
    isPending,
    toggleFavorite: handleToggleFavorite,
    deleteTranscript: handleDelete
  };
}
```

### Supabase Realtime for Processing Status

```typescript
// features/extraction/hooks/useRealtimeStatus.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeStatus(extractionId: string) {
  const [status, setStatus] = useState<ExtractionStatus | null>(null);
  
  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel;
    
    const setupSubscription = async () => {
      channel = supabase
        .channel(`extraction:${extractionId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'extraction_history',
            filter: `id=eq.${extractionId}`
          },
          (payload) => {
            setStatus({
              status: payload.new.status,
              progress: payload.new.progress,
              error: payload.new.error_message
            });
          }
        )
        .subscribe();
    };
    
    setupSubscription();
    
    return () => {
      channel?.unsubscribe();
    };
  }, [extractionId]);
  
  return status;
}
```

### URL Parser Utility

```typescript
// features/extraction/utils/urlParser.ts
export type YouTubeUrlType = 'video' | 'channel' | 'playlist' | 'invalid';

interface ParsedYouTubeUrl {
  type: YouTubeUrlType;
  id: string | null;
  originalUrl: string;
}

const VIDEO_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
];

const CHANNEL_PATTERNS = [
  /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
  /youtube\.com\/@([a-zA-Z0-9_-]+)/,
  /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
  /youtube\.com\/user\/([a-zA-Z0-9_-]+)/
];

export function parseYouTubeUrl(url: string): ParsedYouTubeUrl {
  const trimmedUrl = url.trim();
  
  // Check video patterns
  for (const pattern of VIDEO_PATTERNS) {
    const match = trimmedUrl.match(pattern);
    if (match) {
      return { type: 'video', id: match[1], originalUrl: trimmedUrl };
    }
  }
  
  // Check channel patterns
  for (const pattern of CHANNEL_PATTERNS) {
    const match = trimmedUrl.match(pattern);
    if (match) {
      return { type: 'channel', id: match[1], originalUrl: trimmedUrl };
    }
  }
  
  return { type: 'invalid', id: null, originalUrl: trimmedUrl };
}

export function isValidYouTubeUrl(url: string): boolean {
  return parseYouTubeUrl(url).type !== 'invalid';
}
```

### Virtual Scrolling for Transcripts

```typescript
// shared/components/VirtualList/VirtualList.tsx
import { useRef, useState, useCallback, useEffect } from 'react';
import styles from './VirtualList.module.css';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 3,
  className
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const observer = new ResizeObserver((entries) => {
      setContainerHeight(entries[0].contentRect.height);
    });
    
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;
  
  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className || ''}`}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Error Handling

### Error Boundary

```typescript
// shared/components/ErrorBoundary/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className={styles.errorContainer}>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### API Error Types

```typescript
// types/api.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ErrorCode =
  | 'INVALID_URL'
  | 'VIDEO_NOT_FOUND'
  | 'CHANNEL_NOT_FOUND'
  | 'NO_TRANSCRIPT'
  | 'TRANSCRIPT_DISABLED'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'
  | 'YOUTUBE_API_ERROR';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  INVALID_URL: 'Please enter a valid YouTube video or channel URL',
  VIDEO_NOT_FOUND: 'Video not found. It may be private or deleted.',
  CHANNEL_NOT_FOUND: 'Channel not found. Please check the URL.',
  NO_TRANSCRIPT: 'No transcript available for this video.',
  TRANSCRIPT_DISABLED: 'Transcripts are disabled for this video.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  UNAUTHORIZED: 'Please sign in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again.',
  YOUTUBE_API_ERROR: 'YouTube API error. Please try again later.'
};
```

---

## Rate Limiting

```typescript
// api/_lib/rateLimit.ts
import { createClient } from '@/lib/supabase/server';
import { ApiError } from '@/types/api';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  single: { windowMs: 60000, maxRequests: 10 }, // 10 per minute
  batch: { windowMs: 3600000, maxRequests: 5 }, // 5 per hour
  channel: { windowMs: 3600000, maxRequests: 3 } // 3 per hour
};

export async function checkRateLimit(
  userId: string,
  requestType: 'single' | 'batch' | 'channel'
): Promise<void> {
  const supabase = await createClient();
  const config = RATE_LIMITS[requestType];
  const windowStart = new Date(Date.now() - config.windowMs);
  
  const { count } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('request_type', requestType)
    .gte('window_start', windowStart.toISOString());
  
  if (count && count >= config.maxRequests) {
    throw new ApiError(
      'Rate limit exceeded',
      'RATE_LIMITED',
      429,
      { retryAfter: config.windowMs / 1000 }
    );
  }
  
  // Record this request
  await supabase.from('rate_limits').insert({
    user_id: userId,
    request_type: requestType,
    window_start: new Date().toISOString()
  });
}
```

---

## Implementation Order

### Phase 1: Foundation (Days 1-2)
1. Initialize Vite + React 19 + TypeScript project
2. Configure Supabase client and types
3. Set up CSS architecture (tokens, reset, global styles)
4. Create basic layout components (Header, Sidebar, Layout)
5. Implement auth flow (login, signup, protected routes)

### Phase 2: Core Extraction (Days 3-5)
1. Build URL input with validation
2. Implement video extraction Edge Function
3. Create transcript viewer component
4. Add export functionality (TXT, SRT, JSON)
5. Implement clipboard copy
6. Set up real-time status updates

### Phase 3: Channel Support (Days 6-7)
1. Implement channel video listing
2. Build video selection UI
3. Create batch extraction with progress
4. Add virtual scrolling for long lists

### Phase 4: User Features (Days 8-9)
1. Build extraction history view
2. Implement saved transcripts library
3. Add search and filtering
4. Create favorites and tagging
5. Build settings panel with theme toggle

### Phase 5: Polish & Deploy (Days 10-11)
1. Add error boundaries throughout
2. Implement toast notifications
3. Optimize for mobile
4. Add keyboard shortcuts
5. Performance optimization (code splitting, lazy loading)
6. Write tests
7. Configure Vercel deployment
8. Set up environment variables

---

## Testing Requirements

### Unit Tests
- URL parsing utilities (all format variations)
- Transcript formatters (TXT, SRT, JSON)
- Rate limiting logic
- Auth helper functions

### Integration Tests
- Extraction API endpoints
- Supabase database operations
- Real-time subscription handling

### E2E Tests (Playwright)
- Complete extraction flow (video URL → view transcript → export)
- Channel batch extraction
- Auth flows (signup, login, logout)
- Library management (save, favorite, delete)

### Test Commands
```bash
npm run test        # Unit tests
npm run test:int    # Integration tests
npm run test:e2e    # E2E tests
npm run test:all    # All tests
```

---

## Deployment Checklist

### Environment Variables
```env
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# YouTube
YOUTUBE_API_KEY=

# Vercel
VERCEL_ENV=
```

### Vercel Configuration (`vercel.json`)
```json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "edge"
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

### Pre-Deployment
- [ ] Run all tests
- [ ] Check TypeScript strict mode passes
- [ ] Verify all environment variables set
- [ ] Run production build locally
- [ ] Check bundle size
- [ ] Verify Supabase RLS policies
- [ ] Test on mobile devices

### Post-Deployment
- [ ] Verify auth flows work
- [ ] Test extraction with real YouTube URLs
- [ ] Check real-time updates
- [ ] Monitor error logs
- [ ] Verify rate limiting

---

## Security Notes

1. **YouTube API Key**: Never expose in client-side code. Use only in Edge Functions.

2. **Supabase RLS**: All tables must have RLS enabled. Test policies thoroughly.

3. **Input Sanitization**: Validate and sanitize all user inputs, especially URLs.

4. **CORS**: Configure appropriately for production domain only.

5. **Auth Tokens**: Let Supabase handle token refresh. Never store tokens in localStorage manually.

---

## Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Largest Contentful Paint | < 2.5s |
| Bundle Size (gzipped) | < 150KB |
| Lighthouse Performance | > 90 |

---

This specification provides everything needed to build TranscriptFlow. Prioritize core extraction functionality first, then layer in user features. Keep the UI clean and focused on the primary task: getting transcripts quickly and easily.