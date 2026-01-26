-- Transcript cache table
-- Stores fetched transcripts to avoid re-fetching from YouTube
CREATE TABLE IF NOT EXISTS transcript_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT UNIQUE NOT NULL,
  segments JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by video_id
CREATE INDEX idx_transcript_cache_video_id ON transcript_cache(video_id);

-- Index for cleanup of old entries (optional, for future cache invalidation)
CREATE INDEX idx_transcript_cache_created_at ON transcript_cache(created_at);

-- No RLS needed - transcripts are public data
-- Anyone can read cached transcripts
ALTER TABLE transcript_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read transcript cache" ON transcript_cache FOR SELECT USING (true);
CREATE POLICY "System can insert transcripts" ON transcript_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update transcripts" ON transcript_cache FOR UPDATE USING (true);
