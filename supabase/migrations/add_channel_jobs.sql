-- Channel Jobs table for tracking channel extraction progress
-- This replaces the in-memory job store to work reliably in serverless environments

CREATE TABLE IF NOT EXISTS channel_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  video_limit INTEGER NOT NULL DEFAULT 10,
  output_format TEXT NOT NULL DEFAULT 'combined',

  -- Channel info (populated after fetching)
  channel_info JSONB,

  -- Video list (populated after fetching)
  videos JSONB DEFAULT '[]'::jsonb,

  -- Results with transcripts
  results JSONB DEFAULT '[]'::jsonb,

  -- Progress tracking
  status TEXT NOT NULL DEFAULT 'idle',
  current_video_index INTEGER DEFAULT 0,
  total_videos INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  current_video_title TEXT,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_channel_jobs_user_id ON channel_jobs(user_id);

-- Index for cleanup of old jobs
CREATE INDEX IF NOT EXISTS idx_channel_jobs_created_at ON channel_jobs(created_at);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_channel_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS channel_jobs_updated_at ON channel_jobs;
CREATE TRIGGER channel_jobs_updated_at
  BEFORE UPDATE ON channel_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_channel_jobs_updated_at();

-- Enable RLS
ALTER TABLE channel_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own jobs
CREATE POLICY "Users can view own jobs"
  ON channel_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create jobs for themselves
CREATE POLICY "Users can create own jobs"
  ON channel_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own jobs
CREATE POLICY "Users can update own jobs"
  ON channel_jobs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own jobs
CREATE POLICY "Users can delete own jobs"
  ON channel_jobs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass for background processing
-- (The server uses service role key for job updates during processing)
CREATE POLICY "Service role full access"
  ON channel_jobs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Cleanup function for old jobs (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_channel_jobs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM channel_jobs
  WHERE created_at < NOW() - INTERVAL '1 hour';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
