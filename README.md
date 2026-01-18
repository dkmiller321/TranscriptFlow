# TranscriptFlow

A modern web application for extracting, managing, and exporting YouTube video transcripts. Built with Next.js 14, TypeScript, and Supabase.

## Features

- **Transcript Extraction** - Extract transcripts from any YouTube video with captions
- **Channel Extraction** - Extract transcripts from entire YouTube channels (up to 500 videos)
- **Batch Processing** - Progress tracking with real-time updates for channel extractions
- **Multiple Export Formats** - Download as TXT, SRT (subtitles), or JSON with timestamps
- **Combined or Individual Files** - Export channel transcripts as a single merged file or ZIP of individual files
- **Copy to Clipboard** - One-click copy of full transcript text
- **Video Preview** - View thumbnail, title, channel, and duration
- **Search Within Transcript** - Find and highlight specific words or phrases
- **Timestamped View** - Toggle between plain text and timestamped segment view
- **Extraction History** - Track all your previous extractions (authenticated users)
- **Transcript Library** - Save, favorite, tag, and organize transcripts
- **User Authentication** - Secure signup/login via Supabase Auth
- **Dark/Light Theme** - User preference for theme

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Frontend | React 18 |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Transcript API | Python youtube-transcript-api |
| Styling | CSS Modules |

## Prerequisites

- Node.js 18+
- Python 3.8+
- Supabase account (for database and auth)
- YouTube Data API key (required for channel extraction, optional for video metadata)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dkmiller321/TranscriptFlow.git
   cd TranscriptFlow
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies**
   ```bash
   pip install youtube-transcript-api
   ```

4. **Set up environment variables**

   Copy `.env.example` to `.env.local` and fill in your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   YOUTUBE_API_KEY=your_youtube_api_key  # Optional
   ```

5. **Set up the database**

   Run the SQL schema in your Supabase dashboard:
   ```bash
   # Located at: supabase/schema.sql
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Auth routes (login, signup)
│   ├── (main)/               # Protected routes (history, library, settings)
│   ├── api/                  # API routes
│   │   ├── extract/
│   │   │   ├── video/        # Single video extraction
│   │   │   └── channel/      # Channel extraction + progress polling
│   │   ├── history/          # History CRUD
│   │   └── transcripts/      # Library CRUD
│   └── page.tsx              # Home page
├── components/
│   ├── features/             # Feature components
│   │   ├── UrlInput.tsx      # URL input with channel detection
│   │   ├── TranscriptViewer.tsx
│   │   ├── VideoPreview.tsx
│   │   ├── ExportOptions.tsx
│   │   ├── ChannelProgress.tsx   # Channel extraction progress
│   │   └── ChannelResults.tsx    # Channel results display
│   ├── ui/                   # Reusable UI components
│   └── layout/               # Layout components
├── hooks/                    # Custom React hooks
│   ├── useExtraction.ts      # Video extraction hook
│   └── useChannelExtraction.ts   # Channel extraction hook
├── lib/
│   ├── supabase/             # Supabase client setup
│   ├── youtube/              # YouTube extraction logic
│   │   ├── channel.ts        # Channel fetching and batch processing
│   │   ├── transcript.ts     # Video transcript fetching
│   │   ├── parser.ts         # URL parsing utilities
│   │   ├── export.ts         # Export format generation
│   │   └── types.ts          # TypeScript interfaces
│   ├── jobs/                 # Background job management
│   └── utils/                # Utility functions
├── styles/                   # Global styles and tokens
└── types/                    # TypeScript type definitions

scripts/
└── fetch-transcript.py       # Python script (supports batch mode)
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/extract/video` | POST | Extract transcript from YouTube URL |
| `/api/extract/channel` | POST | Start channel extraction job |
| `/api/extract/channel/[jobId]` | GET | Get channel extraction progress |
| `/api/extract/channel/[jobId]` | DELETE | Cancel channel extraction |
| `/api/history` | GET | Get user's extraction history |
| `/api/transcripts` | GET/POST/PATCH/DELETE | Manage saved transcripts |
| `/api/export` | POST | Format transcript for export |

## Supported YouTube URL Formats

### Video URLs
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- Direct video ID (11 characters)

### Channel URLs
- `https://www.youtube.com/@username` (handle format)
- `https://www.youtube.com/channel/UC...` (channel ID)
- `https://www.youtube.com/c/channelname` (custom URL)
- `https://www.youtube.com/user/username` (legacy user format)

## Export Formats

### TXT
Plain text transcript with all segments joined by spaces.

### SRT
Standard subtitle format with timestamps:
```
1
00:00:01,920 --> 00:00:06,240
First segment text here.

2
00:00:06,240 --> 00:00:12,240
Second segment text here.
```

### JSON
Structured data with metadata:
```json
{
  "title": "Video Title",
  "segments": [
    { "text": "First segment", "offset": 1920, "duration": 4320 },
    { "text": "Second segment", "offset": 6240, "duration": 6000 }
  ]
}
```

## Database Schema

The application uses four main tables:

- **profiles** - User profiles and preferences
- **extraction_history** - Track all extraction attempts
- **saved_transcripts** - Persisted transcripts with full content
- **rate_limits** - Request quota tracking

See `supabase/schema.sql` for the complete schema with RLS policies.

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `YOUTUBE_API_KEY` | For channels | YouTube Data API key (required for channel extraction, enhances video metadata)

> **Note:** To use channel extraction, you must enable the YouTube Data API v3 in your [Google Cloud Console](https://console.developers.google.com/apis/api/youtube.googleapis.com).

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [youtube-transcript-api](https://github.com/jdepoix/youtube-transcript-api) - Python library for fetching YouTube transcripts
- [Supabase](https://supabase.com) - Backend as a service
- [Next.js](https://nextjs.org) - React framework
