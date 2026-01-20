import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface UserSettings {
  id: string;
  user_id: string;
  youtube_api_key_encrypted: string | null;
  default_export_format: string;
  theme: string;
  created_at: string;
  updated_at: string;
}

// GET /api/settings - Get user settings
export async function GET() {
  try {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Try to get existing settings
    const { data: settings, error: fetchError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine for new users
      console.error('Error fetching settings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    // If no settings exist, return defaults
    if (!settings) {
      return NextResponse.json({
        user_id: user.id,
        youtube_api_key_encrypted: null,
        default_export_format: 'txt',
        theme: 'system',
        has_youtube_api_key: false,
      });
    }

    // Return settings with a flag indicating if API key exists (don't expose the key itself)
    return NextResponse.json({
      ...settings,
      youtube_api_key_encrypted: undefined, // Don't expose encrypted key
      has_youtube_api_key: !!settings.youtube_api_key_encrypted,
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/settings - Update user settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { youtube_api_key, default_export_format, theme } = body;

    // Validate export format
    const validFormats = ['txt', 'srt', 'json'];
    if (default_export_format && !validFormats.includes(default_export_format)) {
      return NextResponse.json(
        { error: 'Invalid export format' },
        { status: 400 }
      );
    }

    // Validate theme
    const validThemes = ['light', 'dark', 'system'];
    if (theme && !validThemes.includes(theme)) {
      return NextResponse.json(
        { error: 'Invalid theme' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, string | null> = {};

    if (youtube_api_key !== undefined) {
      // Simple encryption using base64 for now
      // In production, use proper encryption with a secret key
      updateData.youtube_api_key_encrypted = youtube_api_key
        ? Buffer.from(youtube_api_key).toString('base64')
        : null;
    }

    if (default_export_format) {
      updateData.default_export_format = default_export_format;
    }

    if (theme) {
      updateData.theme = theme;
    }

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;

    if (existingSettings) {
      // Update existing settings
      result = await supabase
        .from('user_settings')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();
    } else {
      // Insert new settings
      result = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          ...updateData,
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error saving settings:', result.error);
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...result.data,
      youtube_api_key_encrypted: undefined,
      has_youtube_api_key: !!result.data.youtube_api_key_encrypted,
    });
  } catch (error) {
    console.error('Settings PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/youtube-key - Remove YouTube API key
export async function DELETE() {
  try {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { error: updateError } = await supabase
      .from('user_settings')
      .update({ youtube_api_key_encrypted: null })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error removing API key:', updateError);
      return NextResponse.json(
        { error: 'Failed to remove API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
