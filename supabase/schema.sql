-- TranscriptFlow Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/jqyawimrdxgjovvaifzt/sql)

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  preferences JSONB DEFAULT '{"theme": "system", "defaultFormat": "txt"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extraction history
CREATE TABLE public.extraction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  video_title TEXT NOT NULL,
  channel_name TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  transcript_preview TEXT,
  word_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved transcripts
CREATE TABLE public.saved_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  extraction_id UUID REFERENCES public.extraction_history(id) ON DELETE SET NULL,
  video_id TEXT NOT NULL,
  video_title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_srt TEXT,
  content_json JSONB,
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limits
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  request_type TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_extraction_history_user_id ON public.extraction_history(user_id);
CREATE INDEX idx_extraction_history_video_id ON public.extraction_history(video_id);
CREATE INDEX idx_saved_transcripts_user_id ON public.saved_transcripts(user_id);
CREATE INDEX idx_rate_limits_identifier ON public.rate_limits(identifier, window_start);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extraction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own extractions" ON public.extraction_history FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert extractions" ON public.extraction_history FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own extractions" ON public.extraction_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own extractions" ON public.extraction_history FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own saved" ON public.saved_transcripts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved" ON public.saved_transcripts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved" ON public.saved_transcripts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved" ON public.saved_transcripts FOR DELETE USING (auth.uid() = user_id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
