import { NextRequest, NextResponse } from 'next/server';
import { getSubtitles } from 'youtube-caption-extractor';

export const runtime = 'edge'; // Use edge runtime for better serverless performance

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'videoId query parameter is required' },
        { status: 400 }
      );
    }

    // Try multiple language codes to find available captions
    const languagesToTry = ['en', 'en-US', 'en-GB'];
    let subtitles = null;
    let lastError = null;

    for (const lang of languagesToTry) {
      try {
        console.log(`[Transcript API] Trying language: ${lang} for video: ${videoId}`);
        subtitles = await getSubtitles({ videoID: videoId, lang });

        if (subtitles && subtitles.length > 0) {
          console.log(`[Transcript API] Successfully fetched ${subtitles.length} segments with lang: ${lang}`);
          break;
        }
      } catch (error) {
        console.log(`[Transcript API] Failed with lang ${lang}:`, error);
        lastError = error;
        continue;
      }
    }

    // If all language attempts failed, try without specifying language
    if (!subtitles || subtitles.length === 0) {
      try {
        console.log(`[Transcript API] Trying without language specification`);
        subtitles = await getSubtitles({ videoID: videoId });

        if (subtitles && subtitles.length > 0) {
          console.log(`[Transcript API] Successfully fetched ${subtitles.length} segments without lang`);
        }
      } catch (error) {
        console.log(`[Transcript API] Failed without lang:`, error);
        lastError = error;
      }
    }

    if (!subtitles || subtitles.length === 0) {
      const errorMsg = lastError instanceof Error ? lastError.message : 'No captions available for this video';
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 404 }
      );
    }

    // Transform to our expected format
    const segments = subtitles.map((subtitle) => ({
      text: subtitle.text,
      start: subtitle.start,
      duration: subtitle.dur,
    }));

    return NextResponse.json({
      success: true,
      segments,
    });
  } catch (error) {
    console.error('[Transcript API] Error:', error);

    // Provide more helpful error messages
    let errorMessage = 'Failed to fetch transcript';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
