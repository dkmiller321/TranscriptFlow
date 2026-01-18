import { NextRequest, NextResponse } from 'next/server';
import { fetchTranscript } from '@/lib/youtube/transcript';
import { extractVideoId } from '@/lib/youtube/parser';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Invalid YouTube URL or video ID' },
        { status: 400 }
      );
    }

    // Get user if authenticated
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Create initial history entry
    let historyId: string | null = null;
    if (user) {
      const { data: historyEntry } = await supabase
        .from('extraction_history')
        .insert({
          user_id: user.id,
          video_id: videoId,
          video_title: 'Loading...',
          status: 'processing',
        })
        .select('id')
        .single();

      historyId = historyEntry?.id || null;
    }

    try {
      const result = await fetchTranscript(url);

      // Update history entry on success
      if (historyId && user) {
        await supabase
          .from('extraction_history')
          .update({
            video_title: result.videoInfo.title,
            channel_name: result.videoInfo.channelName,
            thumbnail_url: result.videoInfo.thumbnailUrl,
            duration_seconds: result.videoInfo.durationSeconds,
            status: 'completed',
            transcript_preview: result.plainText.slice(0, 500),
            word_count: result.wordCount,
          })
          .eq('id', historyId);
      }

      return NextResponse.json({
        success: true,
        data: {
          historyId,
          videoInfo: result.videoInfo,
          segments: result.segments,
          plainText: result.plainText,
          srtContent: result.srtContent,
          wordCount: result.wordCount,
        },
      });
    } catch (error) {
      // Update history entry on failure
      if (historyId && user) {
        await supabase
          .from('extraction_history')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', historyId);
      }

      throw error;
    }
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract transcript',
      },
      { status: 500 }
    );
  }
}
