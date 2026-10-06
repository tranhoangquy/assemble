export type ExportJobStatus = 'queued' | 'preparing' | 'rendering' | 'validating_frames' | 'encoding' | 'muxing_audio' | 'verifying' | 'completed' | 'interrupted' | 'retrying' | 'waiting_for_resume' | 'error' | 'cancelled' | 'stale';
export interface ExportChunkView {
  index: number; start: number; end: number;
  status: 'pending' | 'rendering' | 'completed'; validFrames: number; retries: number;
}
export interface ExportJobView {
  id: string; productId: string; productName: string;
  filename: string; outputFilename: string; outputPath: string; frameDirectory: string;
  profileId: string; profileLabel: string; codec: 'h264'; pixelFormat: 'yuv420p';
  videoId: string; videoHash: string; renderIdentity: string; creativeHash?: string;
  width: number; height: number; fps: number; duration: number; timelineDuration: number;
  outputDuration?: number; frameLimit?: number;
  status: ExportJobStatus; progress: number; progressKind: 'frames' | 'indeterminate' | 'complete';
  currentFrame: number; totalFrames: number; validFrames?: number;
  chunkSize?: number; completedChunks?: number; totalChunks?: number; currentChunk?: ExportChunkView;
  elapsedSeconds?: number; stage?: ExportJobStatus; canResume?: boolean; canCancel?: boolean; canDelete?: boolean;
  errorCode?: string; message: string; error?: string; downloadUrl?: string;
  fileSize?: number; sha256?: string; hasAudio?: boolean;
  createdAt: string; updatedAt?: string;
}
export interface ExportActionRequest { action: 'resume' | 'cancel' | 'delete'; }
