import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const favoritesOnly = searchParams.get('favorites') === 'true';

    let query = supabase
      .from('saved_transcripts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (favoritesOnly) {
      query = query.eq('is_favorite', true);
    }

    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Transcripts fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transcripts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { videoId, videoTitle, content, contentSrt, contentJson, extractionId } = body;

    if (!videoId || !videoTitle || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('saved_transcripts')
      .insert({
        user_id: user.id,
        video_id: videoId,
        video_title: videoTitle,
        content,
        content_srt: contentSrt,
        content_json: contentJson,
        extraction_id: extractionId,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Transcript save error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save transcript' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, isFavorite, tags, notes } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof isFavorite === 'boolean') {
      updates.is_favorite = isFavorite;
    }
    if (Array.isArray(tags)) {
      updates.tags = tags;
    }
    if (typeof notes === 'string') {
      updates.notes = notes;
    }

    const { data, error } = await supabase
      .from('saved_transcripts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Transcript update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update transcript' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('saved_transcripts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transcript delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete transcript' },
      { status: 500 }
    );
  }
}
