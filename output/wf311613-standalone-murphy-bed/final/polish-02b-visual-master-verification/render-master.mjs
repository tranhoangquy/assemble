// Export orchestration/evidence only. Does not alter the approved renderer.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
const evidence = path.dirname(new URL(import.meta.url).pathname);
const output = path.resolve(evidence, '../wf311613-polish-02b-visual-master-720p.mp4');
if (fs.existsSync(output)) throw new Error('Refusing to overwrite an existing master');
const identity = JSON.parse(fs.readFileSync(`${evidence}/pre-render-identity.json`));
const locks = JSON.parse(fs.readFileSync('output/wf311613-standalone-murphy-bed/reviews/director-polish-02b/lock-verification.json'));
const props = JSON.parse(fs.readFileSync('output/wf311613-standalone-murphy-bed/reviews/director-polish-02b/presentation-fit.json'));
const gates = JSON.parse(fs.readFileSync('output/wf311613-standalone-murphy-bed/reviews/director-polish-02/validation-results.json'));
const seek = JSON.parse(fs.readFileSync(`${evidence}/presentation-seek-verification.json`));
if (!locks.valid || !props.valid || !gates.valid || !gates.complete || !seek.valid) throw new Error('Pre-render gate failed');
const frozen = JSON.parse(fs.readFileSync(`${evidence}/frozen-source-hashes.json`));
for (const [file, hash] of Object.entries(frozen.hashes)) {
  if (crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== hash) throw new Error(`Frozen source changed: ${file}`);
}
for (const [name, report] of Object.entries({locks,props,gates})) fs.writeFileSync(`${evidence}/${name}-results.json`,JSON.stringify(report,null,2));
const frames = fs.mkdtempSync(path.resolve('output/wf311613-standalone-murphy-bed/frames/wf311613-polish-02b-visual-master-new-'));
const env = {...process.env, PROJECT_ID:identity.candidate, RENDER_URL:'http://localhost:3016',
  OUTPUT_FILE:output, FRAMES_DIR:frames, OUTPUT_FPS:'30', OUTPUT_WIDTH:'1280', OUTPUT_HEIGHT:'720',
  START_TIME:'0', RESUME_FROM_FRAME:'0', FRAME_LIMIT:'Infinity'};
delete env.CHECKPOINTS_DIR;
const provenance = {candidate:identity.candidate,startedAt:new Date().toISOString(),output,frames,
  frameSource:'New deterministic frame render from t=0; no historical MP4 or frame input',
  resumeFromFrame:0,expectedFrames:identity.expectedFrames,timelineDuration:identity.duration,
  videoSha256:identity.videoSha256,planSha256:identity.planSha256,camerasSha256:identity.camerasSha256,
  renderer:'scripts/render-video.ts',rendererSha256:frozen.hashes['scripts/render-video.ts'],audio:false};
fs.writeFileSync(`${evidence}/render-provenance.json`,JSON.stringify(provenance,null,2));
console.log(JSON.stringify(provenance,null,2));
const child = spawn(process.execPath,['--import','tsx','scripts/render-video.ts'],{env,stdio:'inherit'});
child.on('exit',(code,signal)=>{
  fs.writeFileSync(`${evidence}/render-exit.json`,JSON.stringify({code,signal,endedAt:new Date().toISOString()},null,2));
  process.exitCode = code ?? 1;
});
