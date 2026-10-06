import type { ExportJobStatus, ExportJobView } from '@/types/export';
import { formatDuration } from '@/lib/format-duration';
export const exportStageLabels: Record<ExportJobStatus,string> = {
  queued:'Queued',preparing:'Preparing',rendering:'Rendering frames',validating_frames:'Validating frames',encoding:'Encoding video',muxing_audio:'Muxing audio',verifying:'Verifying output',completed:'Generation complete',interrupted:'Generation interrupted',retrying:'Retrying',waiting_for_resume:'Waiting for resume',cancelled:'Generation cancelled',error:'Generation failed',stale:'New generation required',
};
const errorReasons: Record<string,string> = {
  RENDERER_READINESS_TIMEOUT:'The renderer could not get ready in time.', FRAME_TIMEOUT:'A frame took too long to render.', CHUNK_TIMEOUT:'This chunk reached its time limit.', FRAME_RENDER_FAILED:'A frame could not be rendered after retries.', RENDER_RESOURCE_LIMIT:'The selected resolution could not be rendered reliably.', FRAME_VALIDATION_FAILED:'Some frames need repair before encoding.', ENCODE_FAILED:'Video encoding or audio muxing stopped.', FINAL_QA_FAILED:'Output verification failed.', PROCESS_INTERRUPTION:'The server was interrupted.', CHECKPOINT_IO_FAILED:'The checkpoint could not be saved.', RENDER_WORKER_BUSY:'Another generation is using the render worker.',
};
export function ExportProgress({job,onResume,onCancel,onDelete,busy=false}:{job:ExportJobView;onResume:()=>void;onCancel:()=>void;onDelete:()=>void;busy?:boolean}) {
  const chunk=job.currentChunk;
  return <div className={`export-progress ${job.status}`} aria-live="polite">
    <div role="progressbar" aria-label="Overall generation progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={job.progress}><span style={{width:`${job.progress}%`}}/></div>
    <p><b>{exportStageLabels[job.status]}</b><em>{job.progress}% overall</em></p>
    <small>{job.message}</small>
    <dl className="export-job-metrics">
      <div><dt>Frames</dt><dd>{(job.validFrames??job.currentFrame).toLocaleString()} / {job.totalFrames.toLocaleString()} valid</dd></div>
      <div><dt>Chunks</dt><dd>{job.completedChunks??0} / {job.totalChunks??1} completed</dd></div>
      {chunk && <><div><dt>Current chunk</dt><dd>{chunk.index+1} / {job.totalChunks}</dd></div><div><dt>Frame range</dt><dd>{chunk.start.toLocaleString()}–{chunk.end.toLocaleString()}</dd></div><div><dt>Chunk progress</dt><dd>{chunk.validFrames} / {chunk.end-chunk.start+1}</dd></div></>}
      <div><dt>Elapsed</dt><dd>{formatDuration(job.elapsedSeconds??0)}</dd></div>
      {job.fileSize!==undefined&&<div><dt>File size</dt><dd>{(job.fileSize/1_000_000).toFixed(2)} MB</dd></div>}
    </dl>
    {['encoding','muxing_audio','verifying'].includes(job.status)&&<small>Stage in progress; its exact percentage is not measured.</small>}
    {job.error && <><p className="export-error">{job.status==='stale'?'Creative sources changed. Start a new generation.':`${errorReasons[job.errorCode??'']??'Generation stopped.'} Your validated work is preserved.`}</p><details><summary>Error details</summary><small>{job.errorCode}: {job.error}</small></details></>}
    <div className="export-job-actions">
      {job.canResume&&<button className="primary" disabled={busy} onClick={onResume}>Resume generation</button>}
      {job.canCancel&&<button className="danger" disabled={busy} onClick={onCancel}>Cancel generation</button>}
      {job.canDelete&&<button className="secondary" disabled={busy} onClick={onDelete}>Delete render</button>}
    </div>
  </div>;
}
