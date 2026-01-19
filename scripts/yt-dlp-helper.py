#!/usr/bin/env python3
"""
YouTube metadata extraction using yt-dlp (no API key required)
Called from Node.js via subprocess

Commands:
- Video info: python yt-dlp-helper.py video VIDEO_ID_OR_URL
- Channel info: python yt-dlp-helper.py channel CHANNEL_URL
- Channel videos: python yt-dlp-helper.py videos CHANNEL_URL [--limit N]
"""
import sys
import json
import yt_dlp


def get_video_info(video_id_or_url: str) -> dict:
    """Fetch video metadata using yt-dlp."""
    # Normalize to full URL if just video ID
    if not video_id_or_url.startswith('http'):
        url = f'https://www.youtube.com/watch?v={video_id_or_url}'
    else:
        url = video_id_or_url

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'skip_download': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            if not info:
                return {"error": "Could not extract video information"}

            return {
                "videoId": info.get('id', ''),
                "title": info.get('title', 'Unknown Title'),
                "channelName": info.get('channel', info.get('uploader', 'Unknown Channel')),
                "channelId": info.get('channel_id', ''),
                "thumbnailUrl": info.get('thumbnail', f"https://img.youtube.com/vi/{info.get('id', '')}/hqdefault.jpg"),
                "durationSeconds": info.get('duration', 0) or 0,
                "viewCount": info.get('view_count', 0),
                "uploadDate": info.get('upload_date', ''),
            }
    except Exception as e:
        return {"error": str(e)}


def get_channel_info(channel_url: str) -> dict:
    """Fetch channel metadata using yt-dlp."""
    # Normalize URL format
    if not channel_url.startswith('http'):
        # Assume it's a handle or channel ID
        if channel_url.startswith('@'):
            channel_url = f'https://www.youtube.com/{channel_url}'
        elif channel_url.startswith('UC'):
            channel_url = f'https://www.youtube.com/channel/{channel_url}'
        else:
            channel_url = f'https://www.youtube.com/@{channel_url}'

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True,
        'playlist_items': '0',  # Don't fetch any videos, just channel info
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(channel_url, download=False)

            if not info:
                return {"error": "Could not extract channel information"}

            # Handle different response structures
            channel_id = info.get('channel_id', info.get('id', ''))

            # Get channel thumbnail - try various fields
            thumbnails = info.get('thumbnails', [])
            thumbnail_url = ''
            if thumbnails:
                # Prefer higher resolution thumbnails
                for thumb in reversed(thumbnails):
                    if thumb.get('url'):
                        thumbnail_url = thumb['url']
                        break

            return {
                "id": channel_id,
                "name": info.get('channel', info.get('uploader', info.get('title', 'Unknown Channel'))),
                "handle": info.get('uploader_id', ''),
                "thumbnailUrl": thumbnail_url,
                "description": info.get('description', ''),
                "subscriberCount": str(info.get('channel_follower_count', 0) or 0),
                "videoCount": info.get('playlist_count', 0) or 0,
            }
    except Exception as e:
        return {"error": str(e)}


def get_channel_videos(channel_url: str, limit: int = 50) -> dict:
    """Fetch list of videos from a channel using yt-dlp."""
    # Normalize URL format - append /videos to get the videos tab
    if not channel_url.startswith('http'):
        if channel_url.startswith('@'):
            channel_url = f'https://www.youtube.com/{channel_url}/videos'
        elif channel_url.startswith('UC'):
            channel_url = f'https://www.youtube.com/channel/{channel_url}/videos'
        else:
            channel_url = f'https://www.youtube.com/@{channel_url}/videos'
    elif '/videos' not in channel_url:
        channel_url = channel_url.rstrip('/') + '/videos'

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True,
        'playlist_items': f'1:{limit}' if limit else None,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(channel_url, download=False)

            if not info:
                return {"error": "Could not extract channel videos"}

            entries = info.get('entries', [])

            videos = []
            for entry in entries:
                if not entry:
                    continue

                video_id = entry.get('id', '')
                if not video_id:
                    continue

                # Get thumbnail URL
                thumbnails = entry.get('thumbnails', [])
                thumbnail_url = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
                if thumbnails:
                    for thumb in reversed(thumbnails):
                        if thumb.get('url'):
                            thumbnail_url = thumb['url']
                            break

                videos.append({
                    "videoId": video_id,
                    "title": entry.get('title', 'Unknown Title'),
                    "thumbnailUrl": thumbnail_url,
                    "publishedAt": entry.get('upload_date', ''),
                    "durationSeconds": entry.get('duration', 0) or 0,
                })

            # Also extract channel info from the response
            channel_info = {
                "id": info.get('channel_id', info.get('id', '')),
                "name": info.get('channel', info.get('uploader', info.get('title', 'Unknown Channel'))),
                "handle": info.get('uploader_id', ''),
                "videoCount": len(videos),
            }

            return {
                "channelInfo": channel_info,
                "videos": videos,
                "totalFetched": len(videos),
            }
    except Exception as e:
        return {"error": str(e)}


def print_usage():
    """Print usage instructions."""
    print(json.dumps({
        "error": "Usage: python yt-dlp-helper.py <command> <args>",
        "commands": {
            "video": "Get video info: python yt-dlp-helper.py video VIDEO_ID_OR_URL",
            "channel": "Get channel info: python yt-dlp-helper.py channel CHANNEL_URL",
            "videos": "Get channel videos: python yt-dlp-helper.py videos CHANNEL_URL [--limit N]"
        }
    }))


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print_usage()
        sys.exit(1)

    command = sys.argv[1]
    target = sys.argv[2]

    if command == "video":
        result = get_video_info(target)
    elif command == "channel":
        result = get_channel_info(target)
    elif command == "videos":
        # Check for --limit argument
        limit = 50
        if len(sys.argv) >= 5 and sys.argv[3] == "--limit":
            try:
                limit = int(sys.argv[4])
            except ValueError:
                limit = 50
        result = get_channel_videos(target, limit)
    else:
        print_usage()
        sys.exit(1)

    print(json.dumps(result))
