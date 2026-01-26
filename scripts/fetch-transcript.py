#!/usr/bin/env python3
"""
Fetch YouTube transcript using youtube-transcript-api
Called from Node.js via subprocess
Supports Webshare and PacketStream (or any generic) proxies
"""
import sys
import json
import time
import random
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import WebshareProxyConfig, GenericProxyConfig

def fetch_transcript(
    video_id: str,
    proxy_type: str = None,
    proxy_username: str = None,
    proxy_password: str = None,
    proxy_server: str = None
) -> dict:
    """
    Fetch transcript for a YouTube video with optional proxy support.

    Args:
        video_id: YouTube video ID
        proxy_type: 'webshare', 'packetstream', or 'generic'
        proxy_username: Proxy username/customer ID
        proxy_password: Proxy password/API key
        proxy_server: Proxy server address (for generic/packetstream only)
    """
    # Add random delay to avoid rate limiting (1-3 seconds)
    delay = random.uniform(1.0, 3.0)
    time.sleep(delay)

    # Configure API with proxy if credentials provided
    if proxy_type and proxy_username and proxy_password:
        if proxy_type == 'webshare':
            proxy_config = WebshareProxyConfig(
                proxy_username=proxy_username,
                proxy_password=proxy_password,
            )
        elif proxy_type in ['packetstream', 'generic']:
            if not proxy_server:
                return {"error": "proxy_server required for packetstream/generic proxies"}
            proxy_config = GenericProxyConfig(
                http_url=f"http://{proxy_username}:{proxy_password}@{proxy_server}",
                https_url=f"http://{proxy_username}:{proxy_password}@{proxy_server}",
            )
        else:
            return {"error": f"Unknown proxy_type: {proxy_type}"}

        api = YouTubeTranscriptApi(proxy_config=proxy_config)
    else:
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

    # Parse proxy arguments if provided
    proxy_type = sys.argv[2] if len(sys.argv) > 2 else None
    proxy_username = sys.argv[3] if len(sys.argv) > 3 else None
    proxy_password = sys.argv[4] if len(sys.argv) > 4 else None
    proxy_server = sys.argv[5] if len(sys.argv) > 5 else None

    result = fetch_transcript(
        video_id,
        proxy_type=proxy_type,
        proxy_username=proxy_username,
        proxy_password=proxy_password,
        proxy_server=proxy_server
    )
    print(json.dumps(result))
