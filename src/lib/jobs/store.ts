import 'server-only';
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
  abortController?: AbortController;
}

// In-memory job store (in production, you'd use Redis or a database)
const jobs = new Map<string, ChannelJob>();

// Clean up jobs older than 1 hour
const JOB_TTL = 60 * 60 * 1000;

function cleanupOldJobs() {
  const now = Date.now();
  const entries = Array.from(jobs.entries());
  for (const [id, job] of entries) {
    if (now - job.createdAt > JOB_TTL) {
      jobs.delete(id);
    }
  }
}

export function createJob(
  url: string,
  limit: number,
  format: ChannelOutputFormat
): ChannelJob {
  cleanupOldJobs();

  const id = crypto.randomUUID();
  const now = Date.now();

  const job: ChannelJob = {
    id,
    url,
    limit,
    format,
    channelInfo: null,
    videos: [],
    results: [],
    progress: {
      status: 'idle',
      currentVideoIndex: 0,
      totalVideos: 0,
      successCount: 0,
      failedCount: 0,
    },
    createdAt: now,
    updatedAt: now,
  };

  jobs.set(id, job);
  return job;
}

export function getJob(id: string): ChannelJob | null {
  return jobs.get(id) || null;
}

export function updateJob(id: string, updates: Partial<ChannelJob>): ChannelJob | null {
  const job = jobs.get(id);
  if (!job) return null;

  const updatedJob = {
    ...job,
    ...updates,
    updatedAt: Date.now(),
  };

  jobs.set(id, updatedJob);
  return updatedJob;
}

export function updateJobProgress(id: string, progress: BatchProgress): ChannelJob | null {
  return updateJob(id, { progress });
}

export function deleteJob(id: string): boolean {
  const job = jobs.get(id);
  if (job?.abortController) {
    job.abortController.abort();
  }
  return jobs.delete(id);
}

export function cancelJob(id: string): boolean {
  const job = jobs.get(id);
  if (!job) return false;

  if (job.abortController) {
    job.abortController.abort();
  }

  updateJob(id, {
    progress: {
      ...job.progress,
      status: 'cancelled',
    },
  });

  return true;
}

export function setJobAbortController(id: string, controller: AbortController): void {
  const job = jobs.get(id);
  if (job) {
    job.abortController = controller;
    jobs.set(id, job);
  }
}
