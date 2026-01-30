import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { BatchProgress, ChannelInfo, ChannelVideoItem, VideoTranscriptResult, ChannelOutputFormat } from '@/lib/youtube/types';

export interface ChannelJob {
  id: string;
  url: string;
  limit: number;
  format: ChannelOutputFormat;
  channelInfo: ChannelInfo | null;
  videos: ChannelVideoItem[];
  results: Array<{ video: ChannelVideoItem; transcript: VideoTranscriptResult | null }>;
  progress: BatchProgress;
  createdAt: number;
  updatedAt: number;
}

// Database row type
interface ChannelJobRow {
  id: string;
  user_id: string;
  url: string;
  video_limit: number;
  output_format: string;
  channel_info: ChannelInfo | null;
  videos: ChannelVideoItem[];
  results: Array<{ video: ChannelVideoItem; transcript: VideoTranscriptResult | null }>;
  status: string;
  current_video_index: number;
  total_videos: number;
  success_count: number;
  failed_count: number;
  current_video_title: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// Service role client for bypassing RLS during background processing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// In-memory store for AbortControllers only (can't be serialized to DB)
const abortControllers = new Map<string, AbortController>();

// Convert database row to ChannelJob interface
function rowToJob(row: ChannelJobRow): ChannelJob {
  return {
    id: row.id,
    url: row.url,
    limit: row.video_limit,
    format: row.output_format as ChannelOutputFormat,
    channelInfo: row.channel_info,
    videos: row.videos || [],
    results: row.results || [],
    progress: {
      status: row.status as BatchProgress['status'],
      currentVideoIndex: row.current_video_index,
      totalVideos: row.total_videos,
      successCount: row.success_count,
      failedCount: row.failed_count,
      currentVideoTitle: row.current_video_title || undefined,
      error: row.error_message || undefined,
    },
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export async function createJob(
  url: string,
  limit: number,
  format: ChannelOutputFormat,
  userId: string
): Promise<ChannelJob> {
  const { data, error } = await supabase
    .from('channel_jobs')
    .insert({
      user_id: userId,
      url,
      video_limit: limit,
      output_format: format,
      status: 'idle',
      current_video_index: 0,
      total_videos: 0,
      success_count: 0,
      failed_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create job:', error);
    throw new Error('Failed to create job');
  }

  return rowToJob(data as ChannelJobRow);
}

export async function getJob(id: string): Promise<ChannelJob | null> {
  const { data, error } = await supabase
    .from('channel_jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return rowToJob(data as ChannelJobRow);
}

export async function updateJob(
  id: string,
  updates: Partial<{
    channelInfo: ChannelInfo | null;
    videos: ChannelVideoItem[];
    results: Array<{ video: ChannelVideoItem; transcript: VideoTranscriptResult | null }>;
    progress: BatchProgress;
  }>
): Promise<ChannelJob | null> {
  const dbUpdates: Record<string, unknown> = {};

  if (updates.channelInfo !== undefined) {
    dbUpdates.channel_info = updates.channelInfo;
  }

  if (updates.videos !== undefined) {
    dbUpdates.videos = updates.videos;
  }

  if (updates.results !== undefined) {
    dbUpdates.results = updates.results;
  }

  if (updates.progress) {
    dbUpdates.status = updates.progress.status;
    dbUpdates.current_video_index = updates.progress.currentVideoIndex;
    dbUpdates.total_videos = updates.progress.totalVideos;
    dbUpdates.success_count = updates.progress.successCount;
    dbUpdates.failed_count = updates.progress.failedCount;
    dbUpdates.current_video_title = updates.progress.currentVideoTitle || null;
    dbUpdates.error_message = updates.progress.error || null;
  }

  const { data, error } = await supabase
    .from('channel_jobs')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('Failed to update job:', error);
    return null;
  }

  return rowToJob(data as ChannelJobRow);
}

export async function updateJobProgress(
  id: string,
  progress: BatchProgress
): Promise<ChannelJob | null> {
  return updateJob(id, { progress });
}

export async function deleteJob(id: string): Promise<boolean> {
  // Abort any running process
  const controller = abortControllers.get(id);
  if (controller) {
    controller.abort();
    abortControllers.delete(id);
  }

  const { error } = await supabase
    .from('channel_jobs')
    .delete()
    .eq('id', id);

  return !error;
}

export async function cancelJob(id: string): Promise<boolean> {
  // Abort the running process
  const controller = abortControllers.get(id);
  if (controller) {
    controller.abort();
    abortControllers.delete(id);
  }

  // Get current job state
  const job = await getJob(id);
  if (!job) return false;

  // Update status to cancelled
  await updateJob(id, {
    progress: {
      ...job.progress,
      status: 'cancelled',
    },
  });

  return true;
}

// AbortController management (kept in memory since it can't be serialized)
export function setJobAbortController(id: string, controller: AbortController): void {
  abortControllers.set(id, controller);
}

export function getJobAbortController(id: string): AbortController | undefined {
  return abortControllers.get(id);
}

export function clearJobAbortController(id: string): void {
  abortControllers.delete(id);
}

// Cleanup old jobs (can be called periodically or via cron)
export async function cleanupOldJobs(): Promise<number> {
  const { data, error } = await supabase.rpc('cleanup_old_channel_jobs');

  if (error) {
    console.error('Failed to cleanup old jobs:', error);
    return 0;
  }

  return data || 0;
}
