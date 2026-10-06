import pathlib,json,re,hashlib
P=pathlib.Path(__file__).resolve().parent;q=json.loads((P/'AUDIO-QA.json').read_text());plan=json.loads((P/'AudioCuePlan.json').read_text());clips=json.loads((P/'review-clips.json').read_text());assert q['valid'] and q['cueCount']==plan['cueCount'];assert hashlib.sha256((P/'WF311613-audio-pass01-720p.mp4').read_bytes()).hexdigest()==q['outputSha256'];assert all(x['pass'] for x in q['checks'])
def link(f,label=None):return f'[{label or f}]({P/f})'
s=f'''# WF311613 — Audio / Sound Design Pass 01

Technical QA: PASS. SFX ONLY. **MUSIC_ASSET_REQUIRED**.

{link('WF311613-audio-pass01-720p.mp4','Audio Pass 01 full review')} · {link('WF311613-SFX-pass01.wav','48kHz stereo SFX mix')}.

The director-approved silent master is immutable and preserved. No Three.js render was run. All15,722 encoded H.264 video packets, hashes, PTS, DTS and duration fields match the silent master exactly. No source, product, material, assembly, camera, caption, bedroom, bedding, intro, showcase or render-profile changes were made.

## Audio design and provenance

No explicitly approved music file or approved SFX library was found in the project. Existing music approval/mux code is infrastructure, not a licensed music asset. No music was searched, selected or downloaded. No external samples, narration or workshop ambience were used.

Eight original procedural effects were generated locally: soft wood contact, dry dowel seat, muted mechanical seat, restrained driver friction, cam turn, mechanism movement, hinge movement and soft wooden completion. These are procedural approximations, not recorded foley. Deterministic filtered noise/damped resonances, seeds, sample format, hashes, attribution and modification status are in {link('asset-provenance.json')}. No third-party audio license is asserted or invented.

The intro/exploded overview stays silent. Mechanical section25–27 receives seating/retaining sounds and a soft motion test. Close/open movements receive quiet continuous friction; final closed seating and leg end positions receive subdued contact. Mattress/bedding and final hero stay calm and silent. The last cue decays well before the file end.

## Cue plan and repetition

{link('AudioCuePlan.json')} contains{plan['cueCount']} selected cues from{plan['candidateCount']} candidates;{plan['omittedCount']} omitted events are documented in {link('omitted-cues.json')}. Counts are semantic audio cues, not hardware quantities. Most repeated fasteners are intentionally silent; first representatives, occasional handed counterparts and important joints carry the sound.

Times derive from the unchanged actual DirectorPlan shots and compiled assembly actions, with cumulative scene/shot offsets and the existing5-second prefix. Every cue records global time, step, shot, operation/action, part/hardware, asset, gain/fades, rationale and original action. Full exported read-only timing data: {link('semantic-timeline.json')}.

Contact cues align to the first30fps master frame showing completed seating, never the preceding frame. Driver sounds are confined to the executable screw-feed/spin window after approach/contact. Cam sounds follow actual seated tightening rotation. Movement sounds remain within articulated movement; their tails fade before the action ends. Natural short contact decay follows contact.

| Semantic type | Cue count |
|---|---:|
'''
for k,v in plan['countsBySemanticType'].items():s+=f'| {k} | {v} |\n'
s+=f'''
## Mix and technical QA

- Output duration: {q['duration']}s (08:44.067), matching silent master.
- Video: native1280×720,30fps,H.264,yuv420p; copied, not re-encoded.
- Audio: AAC,48kHz,stereo,192kbps encoder setting; MP4 faststart.
- Encoded true peak: {q['loudness']['truePeakDbTP']:.1f}dBTP. Decoded sample peak: {q['loudness']['decodedSamplePeakDbfs']:.2f}dBFS. No clipping.
- Integrated loudness: {q['loudness']['integratedLUFS']:.1f}LUFS. This sparse SFX-only mix deliberately retains quiet rests; it is not normalized to a music/programme target.
- Full A/V decode: PASS, no decode errors. Audio starts at0; video and audio durations match. All selected cues have valid paths, phase bounds and nonzero decoded energy. No cue tail is truncated.
- All22 frozen approved source hashes still match. Original silent MP4 SHA256 remains`{q['silentMasterSha256Unchanged']}`.
- Audio Pass01 MP4 SHA256: `{q['outputSha256']}`.

Evidence: {link('review-clips-sync-QA.json','Review-clip A/V sync and decode checks')}, {link('AUDIO-QA.json')}, {link('video-stream-identity.json')}, {link('sync-verification.json')}, {link('output-ffprobe.json')}, {link('loudness-summary.json')}, {link('waveform-summary.json')}, {link('WAVEFORM-OVERVIEW.png','Waveform/peak overview')}, {link('CUE-SYNC-MASTER-FRAMES.png','Representative cue frames from frozen master')}, {link('full-av-decode.log')}.

Sync QA is based on deterministic executable action phases, existing master frames and post-encode energy checks. AAC is perceptually coded; sample-exact encoded waveform identity is not claimed. Representative master frames were visually inspected at contact/driver cue positions. Listening approval of procedural timbre, realism, fatigue and balance remains with the director; a human listening sign-off is not claimed.

## Review clips A–G

All excerpts use video/audio stream copy. Boundaries expand to source keyframes to avoid visual re-encoding; exact requested and actual ranges are in {link('review-clips.json')}. Any boundary preroll is a trim/container property, not a visual design change.

| Clip | Content | Source range, seconds | Duration |
|---|---|---|---:|
'''
names={'A':'Early assembly','B':'Cam / dowel connection','C':'Screw / bolt tightening','C2':'Supplemental bolt tightening','D':'Steps25–27 mechanism','E':'Folding-leg attachment/test','F':'Wall anchors','G':'Closed/open showcase'}
for c in clips:s+=f'| {c["id"]} | [{names[c["id"]]}]({c["file"]}) | {c["sourceKeyframeRange"][0]:.3f}–{c["sourceKeyframeRange"][1]:.3f} | {float(c["duration"]):.3f}s |\n'
s+=f'''
## Reproduction and stop

Output-only scripts are retained: {link('export-timeline.mjs')}, {link('build-audio.py')}, {link('qa-audio.py')}, {link('make-review-evidence.py')}. Run timeline export with`node --import tsx`; run Python scripts using the bundled Python runtime with NumPy/Pillow. Mux the generated WAV against the approved silent MP4 with`-map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -t 524.066667 -movflags +faststart`, into a new output path. QA verifies the approved master SHA before processing.

Stopped after Audio Pass01. **MUSIC_ASSET_REQUIRED**. Returned for director listening/review. No narration, high-resolution variant, publication/upload or Option2 was started.
'''
(P/'AUDIO-PASS01-DIRECTOR-REPORT.md').write_text(s);(P/'SHA256SUMS.txt').write_text(q['outputSha256']+'  WF311613-audio-pass01-720p.mp4\n');assert all(pathlib.Path(x).exists() for x in re.findall(r'\]\(([^)]+)\)',s));print('Report, hashes and artifact links verified.')
