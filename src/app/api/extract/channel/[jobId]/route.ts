import { NextRequest, NextResponse } from 'next/server';
import { getJob, cancelJob, deleteJob } from '@/lib/jobs/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json(
      { success: false, error: 'Job not found' },
      { status: 404 }
    );
  }

  // Return full results if completed
  if (job.progress.status === 'completed' || job.progress.status === 'cancelled') {
    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.progress.status,
        progress: job.progress,
        channelInfo: job.channelInfo,
        results: job.results,
        totalVideos: job.progress.totalVideos,
        processedVideos: job.progress.currentVideoIndex,
        successCount: job.progress.successCount,
        failedCount: job.progress.failedCount,
      },
    });
  }

  // Return progress for in-progress jobs
  return NextResponse.json({
    success: true,
    data: {
      jobId: job.id,
      status: job.progress.status,
      progress: job.progress,
      channelInfo: job.channelInfo,
      totalVideos: job.progress.totalVideos,
      processedVideos: job.progress.currentVideoIndex,
      successCount: job.progress.successCount,
      failedCount: job.progress.failedCount,
      currentVideoTitle: job.progress.currentVideoTitle,
      error: job.progress.error,
    },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  // Check for cancel action vs delete
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (action === 'cancel') {
    const cancelled = cancelJob(jobId);

    if (!cancelled) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Job cancelled' },
    });
  }

  // Default: delete the job
  const deleted = deleteJob(jobId);

  if (!deleted) {
    return NextResponse.json(
      { success: false, error: 'Job not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { message: 'Job deleted' },
  });
}
