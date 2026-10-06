import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {polishPlan,polishRuntime} from '../director/polish-pass01';
import {polish02Plan,polish02Video,polish02Showcase,polish02ShowcaseDuration,polish02Runtime} from '../director/polish-pass02';
import {presentationNameRows,pdfPartNames,hardwareNames} from '../presentation/labels';
import cameras from '../director/polish02-workspace-cameras.json';
const dir='output/wf311613-standalone-murphy-bed/reviews/director-polish-02';
const cell=(s:string)=>s.replaceAll('|','/').replaceAll('\n',' ');
async function main(){
  const gates=JSON.parse(await readFile(`${dir}/validation-results.json`,'utf8'));
  const seek=JSON.parse(await readFile(`${dir}/presentation-seek-verification.json`,'utf8'));
  const captions=polish02Video.reviewCaptions!;
  let time=0;
  const decisions=polishPlan.steps.flatMap(step=>step.shots.map(shot=>{const c=captions.find(c=>Math.abs(c.start-time)<1e-6)!;time+=shot.duration;return {step:step.step,shot:shot.id,before:shot.note??'',after:c.title,omitted:!!c.hidden};}));
  await writeFile(`${dir}/caption-audit.json`,JSON.stringify(decisions,null,2));
  const examples=['rail-seat-0','S3-square-before-tightening','bolt-macro','S23-eye-seat'].map(id=>decisions.find(d=>d.shot===id)!);
  const hardwareRows=Object.entries(hardwareNames).map(([id,name])=>`| #${id} | ${name} |`).join('\n');
  const partRows=Object.entries(pdfPartNames).map(([id,name])=>`| ${id} | ${name} |`).join('\n');
  const instances=presentationNameRows.map(row=>`| ${row.id} | ${row.presentationName} |`).join('\n');
  let cursor=polishRuntime;
  const showcase=polish02Showcase.map(s=>{const start=cursor;cursor+=s.duration;return `| ${s.id.replace('showcase-','')} | ${s.duration.toFixed(1)} s | ${start.toFixed(3)}–${cursor.toFixed(3)} s |`;}).join('\n');
  const tests=await readFile('/private/tmp/wf-polish02-tests-serial.log','utf8');
  const build=await readFile('/private/tmp/wf-polish02-build-complete.log','utf8');
  const report=`# Director Polish 02 — QA only, awaiting review

Candidate: **${polish02Plan.id}**. No full Polish 02 MP4, 2K/4K, audio, Option 2, or production approval.

## Locked engineering and timing

All 458 product object definitions, materials, PDF IDs, B8, C1/C2 relief, D8/D9, bearing/leg geometry, apertures and piston anchor/stroke definitions are unchanged. Product/material SHA locks PASS. The 31 numbered steps, every existing shot ID/duration, Step 1–3 pacing, and locked Step 4–20 timing remain unchanged. Assembly runtime: ${polishRuntime.toFixed(6)} s.

## Helper removal and supported work poses

All four face pads/posts and four carrier pads/posts are removed from the **renderer**, not replaced by props. Their original support metadata, assembly support reasoning and validators remain internal. The historical Polish 01 MP4/approved still files are untouched.

Simply hiding helpers would float timber, so the EMPTY root enters the front workspace at [0, -36, -485] before any bed parts appear. Face timbers initially rest on the floor; after the PDF underside supports are installed, they provide floor contact at root Y = -33. The separately built carrier is parked six scene units lower and rests on its own PDF rails. For underside supports and underside joining bolts, the frame uses a controlled 70° edge-held pose about its actual contact corner [116, 36, 362], then returns to the floor. This is a supported handling pose, not a modeled lifting-load claim; people continue to be required for lifting.

**Explicit staging deviation:** work Z changes from -460 to -485 (25 cm forward) because grounded axial panel insertion otherwise encroaches on the existing cabinet bottom rail. The bed remains immediately in front of the cabinet. Step 25 still has exactly the same three short segments; only its lift START follows the grounded source pivot [0, 12, -145]. Its lifted endpoint [0, 85, -120], short approach [0, 47, -9.2], final bearing axis [0, 36.5, -9.2], three durations and retainer sequence are unchanged. No seven-segment historical route is restored. Actual paths and floor checks were rerun.

The path validator now tests both bodies in the same rigid frame (avoids false world-AABB intersections on tilted timber), and uses 96 consecutive swept intervals instead of three huge waypoint unions. Actual surfaces and numeric/collision tolerances are unchanged; sampling increases rather than exclusions being added.

## Camera and room continuity

Polish 01 lenses and useful camera-to-joint distances are retained. Working views and close-ups follow the grounded/edge-held work poses by rigid transformation. ${cameras.floorCameraCorrections.length} transformed views needed the clear above-floor side while preserving lens/distance; this is an access correction, not a camera-system redesign. Step 25 connection/pullback presets stay unchanged. Read-only all-shot camera measurements: [final-camera-audit.json](final-camera-audit.json). Assembly bedroom, exposure 0.97, fog and neutral lighting remain unchanged; no extra lighting or depth of field.

Three Step 13 underside-support seating views also use the actual underside-normal access angle, preserving their lens/distance, because the previous grazing view concealed the support profile in the edge-held pose. The final camera audit covers 552 shots / 1656 samples with no sensor intersections. Eleven WORKING_MEDIUM-labeled shots with measurable subjects have coverage below 65%, mainly inherited context views plus workspace/two-subassembly views; two additional Step 5/6 context entries have zero measured subject coverage. These are disclosed review exceptions, not a claim that every shot meets a universal framing threshold; no automatic refit was applied.

## Viewer text

Separate presentation metadata resolves all 458 internal object IDs. Normal video captions never use raw timber IDs or debugging terminology. Every assembly shot has an explicit caption/omit decision, so hidden captions cannot fall back to old diagnostics. ${decisions.filter(d=>d.omitted).length} captions are omitted; retained captions are one concise instruction. No text hold or duration was added. Normal parts-list labels use human names; internal IDs remain available to diagnostic/source tooling.

### Actual before/after examples

| Operation | Before (actual original note) | After |
| --- | --- | --- |
${examples.map((e,i)=>`| ${['Wood part','Structural connection','Hardware','Mechanism'][i]} | ${cell(e.before)} | ${cell(e.after)||'(omitted)'} |`).join('\n')}

Full decisions: [caption-audit.json](caption-audit.json). Complete instance mapping: [presentation-names.json](presentation-names.json).

## Finished bedroom — presentation only

Editorial boundary occurs ONLY after all PDF work and the existing final functional verification finish. Then: real supported close → completed closed → real opening → actual folding-leg deployment/lowering → bare open view → mattress editorial cut → bedding editorial cut → 3 s hero. Because assembly ends OPEN, the initial closing operation is shown physically; there is no transform jump to the closed shot. Moving actions are cloned from the existing validated final mechanism sequence, with both pistons and bearings remaining connected.

The additional video scenes are tagged showcase, have no assemblyStep/Step 32, and do not enter the 31-step DirectorPlan or product graph. Generic FinishedBedroom props sit outside ProductRenderer/ObjectRegistry. New context: one bedside table/lamp, neutral rug, small plant, mattress, simple blanket and two pillows. Props are deterministic; no randomness or downloaded assets. No technical captions in the finished hero.

### Mattress fit — PRESENTATION ESTIMATE, NOT manufacturer specification

Scene unit: cm. Mattress **217 wide × 182 long × 19 thick**, center **[0, 41.8, -89.2]**, softened radius **1.6**. These dimensions only fit the reconstructed rendered envelope; no commercial size, mattress compatibility or manufacturing tolerance is claimed.

Bottom Y=32.3 matches all five support-slat upper faces. Envelope including seam piping leaves 2.64 cm side clearance and 5.34 cm end clearance. Fitted mattress/blanket envelopes do not intersect rails, end structure or folding-leg parts. Room furnishings remain outside the bed/cabinet silhouette envelope. Mattress, pillows, blanket, table, lamp, rug and plant are all PRESENTATION ONLY, absent from PDF parts, hardware and AssemblyGraph. Actual stills 12–15 provide visual-fit QA.

### Showcase shot budget

| Shot | Duration | Absolute range |
| --- | --- | --- |
${showcase}

Additional showcase: **${polish02ShowcaseDuration.toFixed(1)} s**. Provisional total visual timeline: **${polish02Runtime.toFixed(6)} s (~8:39.054)**. No global speed multiplier or audio-driven retiming.

## Audio

**No explicitly approved/licensed music file currently supplied. QA silent.** No arbitrary internet music/SFX downloaded. Ready generic command: node --import tsx scripts/mux-approved-music.ts --video VISUAL_MASTER --approval APPROVED_ASSET_JSON --output NEW_MP4. Requires explicit user approval, known rights/evidence and exact audio SHA. Uses smooth overlap looping, low gain (0.18), limiter headroom, fade-in/out and unchanged video stream/duration. No music mux has been run. SFX remain future independent licensed assets; none added now.

## Validation and build

Mechanical gate suite complete=${gates.complete}, PASS=${gates.valid}. Includes assembly, 40 structural paths/1656 sampled poses, 4480 swept bounds, 139 hardware axes, 3280 rigid-carrier checks; grounded timber AND fastener floor checks; actual front approach meshes; full mechanics including appended real showcase motions; hardware/apertures; pivot/bearing; piston endpoint/stroke/body/rod; leg articulation/stored-leg closure; B8; whole-scene seek/reset; prop fit; raw-ID caption audit; product/material/timing locks. No waived collisions or relaxed thresholds.

Browser rendered seek/reset verification: **${seek.valid?'PASS':'FAIL'}**, ${seek.checks.length} checkpoints repeated in reverse, comparing exact PNG SHA and camera state (includes props, lighting, environment and geometry). [presentation-seek-verification.json](presentation-seek-verification.json).

Typecheck and lint: PASS. Tests: ${tests.includes('144 passed (144)')?'144/144 PASS with maxWorkers=2':'see attached test log'}. Initial unconstrained parallel run hit two existing 5 s test timeouts under concurrent heavy validators; no assertions or timeout thresholds changed, bounded-worker rerun passed. Production build: ${build.includes('Compiled successfully')?'PASS':'see build log'}. [validation-results.json](validation-results.json).

Archived execution evidence: [tests](tests.log), [production build](build.log), [mechanical/presentation gates](gates.log).

## Handoff

[QA gallery](index.html), [contact sheet](contact-sheet.png), [actual still manifest](stills/render-manifest.json). 15 required views including historical before, plus two underside-access views. Before image is the approved Polish 01 still at the equivalent completed separate-frame state, not a newly rerendered/modified historical candidate.

STOP: awaits director review. No full Polish 02 MP4 was rendered.

## Complete canonical PDF part mapping

| Internal ID | Presentation name |
| --- | --- |
${partRows}

## Complete hardware mapping

| PDF number | Presentation name |
| --- | --- |
${hardwareRows}

## Complete physical-instance mapping (unchanged IDs)

| Internal instance ID | Presentation name |
| --- | --- |
${instances}
`;
  await writeFile(`${dir}/report.md`,report);
  await writeFile(`${dir}/comparisons.json`,JSON.stringify([{title:'Equivalent completed face and separate carrier: helpers → real PDF timber floor contact',before:'stills/01-before-grey-supports.png',after:'stills/02-after-grounded-no-helpers.png'}],null,2));
  await writeFile(`${dir}/candidate-manifest.json`,JSON.stringify({candidate:polish02Plan.id,planSha256:createHash('sha256').update(JSON.stringify(polish02Plan)).digest('hex'),videoSha256:createHash('sha256').update(JSON.stringify(polish02Video)).digest('hex'),runtime:polish02Runtime,fullMp4Rendered:false,audioApproved:false},null,2));
  console.log(`${dir}/report.md`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
