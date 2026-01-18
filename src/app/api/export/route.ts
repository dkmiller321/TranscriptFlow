import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface SavedTranscript {
  id: string;
  video_id: string;
  video_title: string;
  content: string;
  content_srt: string | null;
  content_json: unknown;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const format = searchParams.get('format') as 'txt' | 'srt' | 'json';

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    if (!['txt', 'srt', 'json'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Invalid format' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('saved_transcripts')
      .select('id, video_id, video_title, content, content_srt, content_json')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Transcript not found' },
        { status: 404 }
      );
    }

    const transcript = data as SavedTranscript;

    let content: string;
    let mimeType: string;
    let extension: string;

    switch (format) {
      case 'txt':
        content = transcript.content;
        mimeType = 'text/plain';
        extension = 'txt';
        break;
      case 'srt':
        content = transcript.content_srt || transcript.content;
        mimeType = 'text/plain';
        extension = 'srt';
        break;
      case 'json':
        content = transcript.content_json
          ? JSON.stringify(transcript.content_json, null, 2)
          : JSON.stringify({
              title: transcript.video_title,
              content: transcript.content,
            }, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
      default:
        content = transcript.content;
        mimeType = 'text/plain';
        extension = 'txt';
    }

    const safeTitle = transcript.video_title
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .slice(0, 50);

    return new NextResponse(content, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${safeTitle}.${extension}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export transcript' },
      { status: 500 }
    );
  }
}
