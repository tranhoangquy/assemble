'use client';
import { presentationFocusKey, presentationType } from '@/engine/video/PresentationSelection';
import { formatDuration } from '@/lib/format-duration';
import { productionProductLabel } from '@/products/registry';

import { useEffect, useRef, useState } from 'react';
import { ExportProgress } from './ExportProgress';
import type { ProductPackage } from '@/types/product-package';
import type { ExportJobView } from '@/types/export';
import type { AssemblyValidationResult } from '@/engine/assembly/AssemblyValidator';
import { defaultRenderProfileId, getRenderProfile, renderProfiles } from '@/engine/export/RenderProfiles';

interface ExportVideoModalProps { open: boolean; product: ProductPackage; validation: AssemblyValidationResult; onClose: () => void; debugMode?: boolean; }

const terminalStatuses = new Set(['completed', 'error', 'cancelled', 'interrupted', 'waiting_for_resume', 'stale']);
export function ExportVideoModal({ open, product, validation, onClose, debugMode = false }: ExportVideoModalProps) {
  const [profileId, setProfileId] = useState(presentationType(product)==='short'?'vertical-1080p':defaultRenderProfileId);
  const [fps, setFps] = useState(30);
  const [storedJob, setJob] = useState<ExportJobView | null>(null);
  const job = storedJob?.productId === product.id && storedJob.videoId === product.video.id ? storedJob : null;
  const [requestError, setRequestError] = useState<string | null>(null);
  const [exportAnyway, setExportAnyway] = useState(false);
  const [starting, setStarting] = useState(false);
  const [recovering, setRecovering] = useState(true);
  const polling = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusKey = presentationFocusKey(product);
  const duration = product.video.scenes.reduce((sum, scene) => sum + scene.duration, 0);
  const selectedProfile = getRenderProfile(profileId);
  const videoType = presentationType(product);
  const availableProfiles = renderProfiles.filter(p=>videoType==='short'?p.id==='vertical-1080p':p.width>p.height);

  // Rehydrate from the server on modal open/product selection/page refresh.
  // Each effect owns its polling chain, so responses for another product cannot replace this job.
  const [refresh, setRefresh] = useState(0);
  const [newGeneration, setNewGeneration] = useState(false);
  useEffect(() => {
    if (!open) return;
    let disposed = false;
    const load = async () => {
      try {
        const response = await fetch(`/api/export?productId=${encodeURIComponent(product.id)}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Could not recover generation status.');
        const jobs = await response.json() as ExportJobView[];
        if (disposed) return;
        setRequestError(null);
        const focusedId = sessionStorage.getItem(focusKey) ?? (videoType==='long'?sessionStorage.getItem(`export-job:${product.id}`):null);
        const focused = jobs.find(item => item.id === focusedId && item.videoId === product.video.id);
        const next = newGeneration ? undefined : focused ?? jobs.find(item => item.productId === product.id && item.videoId === product.video.id && item.profileId === profileId && item.fps === fps);
        if (focused && (focused.profileId !== profileId || focused.fps !== fps)) { setProfileId(focused.profileId); setFps(focused.fps); }
        if (next) sessionStorage.setItem(focusKey, next.id);
        setJob(next ?? null);
        if (next && !terminalStatuses.has(next.status)) polling.current = setTimeout(() => void load(), 700);
      } catch (error) {
        if (!disposed) setRequestError(error instanceof Error ? error.message : 'Could not read generation status.');
      } finally {
        if (!disposed) setRecovering(false);
      }
    };
    queueMicrotask(() => { if (!disposed) { setRecovering(true); void load(); } });
    return () => { disposed = true; if (polling.current) clearTimeout(polling.current); };
  }, [open, product.id, product.video.id, profileId, fps, refresh, newGeneration, focusKey, videoType]);

  const start = async () => {
    if (starting || recovering) return;
    setStarting(true);
    setRequestError(null);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, videoId: product.video.id, profileId, fps, exportAnyway }),
      });
      const next = await response.json() as ExportJobView & { error?: string };
      if (!response.ok) throw new Error(next.error ?? 'Could not start export.');
      sessionStorage.setItem(focusKey, next.id);
      setNewGeneration(false);
      setJob(next);
      setRefresh(value => value + 1);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Could not start export.');
    } finally {
      setStarting(false);
    }
  };

  const action = async (kind: 'resume' | 'cancel' | 'delete') => {
    if (!job || starting) return;
    if (kind === 'delete' && !window.confirm('Delete this generation and its cached frames? Other jobs and approved masters are kept.')) return;
    setStarting(true);
    setRequestError(null);
    try {
      const response = await fetch(`/api/export/${job.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: kind, productId: product.id, videoId: product.video.id, profileId, fps }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Could not update generation.');
      if (kind === 'delete') { sessionStorage.removeItem(focusKey); setNewGeneration(true); setJob(null); }
      else setJob(result as ExportJobView);
      setRefresh(value => value + 1);
    } catch (error) { setRequestError(error instanceof Error ? error.message : 'Could not update generation.'); setRefresh(value => value + 1); }
    finally { setStarting(false); }
  };

  const close = () => {
    if (job && !terminalStatuses.has(job.status)) {
      onClose();
      return;
    }
    setJob(null);
    setRequestError(null);
    setExportAnyway(false);
    onClose();
  };

  if (!open) return null;
  const running = Boolean(job && !terminalStatuses.has(job.status));
  const shownDuration = job?.outputDuration ?? job?.duration ?? duration;
  const shownFrames = job?.totalFrames ?? Math.ceil(duration * fps);
  const shownProfile = job?.profileLabel ?? selectedProfile.label;


  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section className="export-modal" role="dialog" aria-modal="true" aria-labelledby="export-title" aria-busy={starting || recovering}>
        <header><div><span>VIDEO OUTPUT</span><h2 id="export-title">Export assembly video</h2><small>{videoType==='short'?'Short Video':'Long Video'}</small></div><button aria-label="Close export dialog" onClick={close}>×</button></header>
        <div className="export-product"><span>PRODUCT SNAPSHOT</span><strong>{debugMode && job ? job.productName : productionProductLabel(job?.productId ?? product.id)}</strong><small>{job?.outputFilename ?? job?.filename ?? product.filename}</small></div>
        {!job && (
          <div className="export-settings">
            <fieldset><legend>Resolution</legend>
              <p className="export-profile-group">Existing options</p>
              {availableProfiles.filter(profile => profile.kind === 'legacy').map(profile => (
                <label key={profile.id}><input type="radio" name="resolution" value={profile.id} data-profile-id={profile.id} checked={profileId === profile.id} onChange={() => setProfileId(profile.id)} disabled={starting} /><span>{profile.label}<small>{profile.width} × {profile.height}</small></span></label>
              ))}
              <p className="export-profile-group">Standard native resolutions</p>
              {availableProfiles.filter(profile => profile.kind === 'standard').map(profile => (
                <label key={profile.id}><input type="radio" name="resolution" value={profile.id} data-profile-id={profile.id} checked={profileId === profile.id} onChange={() => { setProfileId(profile.id); setFps(profile.fps); }} disabled={starting} /><span>{profile.label}<small>Native rendering · default {profile.fps} FPS</small></span></label>
              ))}
            </fieldset>
            <fieldset><legend>Frame rate</legend>
              {selectedProfile.supportedFps.map((value) => <label key={value}><input type="radio" name="fps" value={value} checked={fps === value} onChange={() => setFps(value)} disabled={starting} /><span>{value} FPS<small>{value === 30 ? 'YouTube' : 'High motion'}</small></span></label>)}
              <p className="export-resolution-note">Higher resolution requires more render time and storage. Frames are rendered at the selected native resolution.</p>
            </fieldset>
          </div>
        )}
        <dl className="export-summary"><div><dt>FORMAT</dt><dd>MP4 · H.264</dd></div><div><dt>DURATION</dt><dd>{formatDuration(shownDuration)}</dd></div><div><dt>FRAMES</dt><dd>{shownFrames.toLocaleString()}</dd></div><div><dt>PROFILE</dt><dd>{shownProfile}<small>{job?.profileId ?? profileId}</small></dd></div><div><dt>NATIVE SIZE</dt><dd>{job?.width ?? selectedProfile.width} × {job?.height ?? selectedProfile.height}</dd></div><div><dt>FRAME RATE</dt><dd>{job?.fps ?? fps} FPS</dd></div></dl>
        {!job && !validation.valid && <div className="export-validation-warning"><strong>Assembly validation failed</strong><p>{validation.errors.length} blocking issue(s) were found. Exporting now may show parts passing through one another or inaccessible hardware.</p></div>}
        {!job && recovering && <p className="export-recovering">Checking saved generation…</p>}
        {!job && !recovering && <p className="export-ready">Ready to generate · {selectedProfile.label} · {fps} FPS · {formatDuration(duration)} · {Math.ceil(duration * fps).toLocaleString()} expected frames</p>}
        {job && job.productId === product.id && <ExportProgress job={job} busy={starting} onResume={() => void action('resume')} onCancel={() => void action('cancel')} onDelete={() => void action('delete')} />}
        {job && <dl className="export-output"><div><dt>OUTPUT FILE</dt><dd>{job.outputFilename ?? job.filename}</dd></div>{debugMode && <><div><dt>OUTPUT PATH</dt><dd>{job.outputPath ?? 'Available after encoding'}</dd></div><div><dt>ENCODING</dt><dd>{job.codec ?? 'h264'} · {job.pixelFormat ?? 'yuv420p'} · {job.hasAudio ? 'approved audio' : 'silent'}</dd></div></>}</dl>}
        {job?.frameLimit && <p className="export-resolution-note">Short deterministic preview: {job.totalFrames} frames / {job.fps} FPS. Full timeline: {formatDuration(job.timelineDuration ?? job.duration)}. This is not the complete video.</p>}
        {requestError && <p className="export-error">{requestError}</p>}
        <footer>
          {!job && <><button className="secondary" onClick={close}>Cancel</button><button disabled={starting || recovering} className={validation.valid ? 'primary' : 'danger'} onClick={() => { if (!validation.valid && !exportAnyway) { setExportAnyway(true); return; } void start(); }}>{starting ? 'Starting…' : validation.valid ? 'Generate File' : exportAnyway ? 'Export anyway' : 'Review warning'}</button></>}
          {running && <><button className="secondary" onClick={close}>Continue in background</button></>}
          {job?.status === 'completed' && <><button className="secondary" onClick={close}>Close</button><button className="secondary" onClick={() => { sessionStorage.removeItem(focusKey); setNewGeneration(true); setJob(null); }}>New generation</button><a className="primary" href={job.downloadUrl}>Download MP4</a></>}
          {(job && terminalStatuses.has(job.status) && job.status !== 'completed') && <><button className="secondary" onClick={close}>Close</button><button className="primary" onClick={() => { sessionStorage.removeItem(focusKey); setNewGeneration(true); setJob(null); }}>New generation</button></>}
        </footer>
      </section>
    </div>
  );
}
