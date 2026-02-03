'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { VideoInfo } from '@/lib/youtube/types';
import { formatDuration, formatWordCount } from '@/lib/utils/formatters';
import { getVideoUrl } from '@/lib/youtube/parser';

interface VideoPreviewProps {
  videoInfo: VideoInfo;
  wordCount: number;
}

export function VideoPreview({ videoInfo, wordCount }: VideoPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
      <CardContent className="relative p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Thumbnail Link */}
          <a
            href={getVideoUrl(videoInfo.videoId)}
            target="_blank"
            rel="noopener noreferrer"
            className="relative shrink-0 group"
          >
            <div className="relative w-full sm:w-48 aspect-video rounded-lg overflow-hidden shadow-lg ring-1 ring-border/50 transition-all duration-300 group-hover:ring-primary/50 group-hover:shadow-xl group-hover:scale-[1.02]">
              <Image
                src={videoInfo.thumbnailUrl}
                alt={videoInfo.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                unoptimized
              />
              {/* Play button overlay on hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 scale-75 shadow-lg">
                  <svg className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              {/* Duration badge */}
              {videoInfo.durationSeconds > 0 && (
                <span className="absolute bottom-2 right-2 px-2 py-0.5 text-xs font-medium bg-black/80 text-white rounded-md backdrop-blur-sm">
                  {formatDuration(videoInfo.durationSeconds)}
                </span>
              )}
            </div>
          </a>

          {/* Video Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground leading-tight">
                <a
                  href={getVideoUrl(videoInfo.videoId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors duration-200 line-clamp-2"
                >
                  {videoInfo.title}
                </a>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {videoInfo.channelName}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Badge variant="secondary" className="font-medium">
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {formatWordCount(wordCount)}
              </Badge>
              <Badge variant="outline" className="font-medium">
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDuration(videoInfo.durationSeconds)}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}
