#!/usr/bin/env python3
"""
Fetch YouTube transcript using youtube-transcript-api
Called from Node.js via subprocess
"""
import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi

def fetch_transcript(video_id: str) -> dict:
    """Fetch transcript for a YouTube video."""
    api = YouTubeTranscriptApi()

    try:
        # Try to get English transcript first, then any available
        transcript = api.fetch(video_id, languages=['en'])
    except Exception:
        # If English fails, try to get any available transcript
        try:
            transcript_list = api.list(video_id)
            # Get the first available transcript
            available = list(transcript_list)
            if not available:
                return {"error": "No transcripts available for this video"}
            transcript = available[0].fetch()
        except Exception as e:
            return {"error": str(e)}

    # Convert to list of segments
    segments = []
    for snippet in transcript:
        segments.append({
            "text": snippet.text,
            "offset": int(snippet.start * 1000),  # Convert to milliseconds
            "duration": int(snippet.duration * 1000)
        })

    return {"segments": segments}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Video ID required"}))
        sys.exit(1)

    video_id = sys.argv[1]
    result = fetch_transcript(video_id)
    print(json.dumps(result))
