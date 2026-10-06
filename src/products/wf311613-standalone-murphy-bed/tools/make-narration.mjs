import { execFileSync } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.resolve(root, 'output/wf311613-standalone-murphy-bed/reviews/legacy-daybed');
const clipsDir = path.resolve(root, 'tmp/wf311613-narration-clips');
const silentVideo = path.join(outputDir, 'wf311613-manual-assembly-silent.mp4');
const audioFile = path.join(outputDir, 'wf311613-narration-en.m4a');
const finalVideo = path.join(outputDir, 'wf311613-manual-assembly-en.mp4');
const duration = 266;

const narration = [
  [0.6, 'Step one. Assemble the left back panel from parts A five, A nine, A seven, and A eight.'],
  [8.6, 'Step two. Build the mirrored right back panel with A six and the matching rails.'],
  [16.6, 'Step three. Join the left cabinet legs to D five, E three, and the lower B nine rail.'],
  [24.6, 'Step four. Install the first B eight cross panel and its center support.'],
  [32.6, 'Step five. Add the second B eight panel and keep the cabinet frame square.'],
  [40.6, 'Step six. Complete the remaining cabinet cross structure and upper rails.'],
  [48.6, 'Step seven. Assemble the two B four top cap panels.'],
  [56.6, 'Step eight. Lower the completed cap onto the cabinet and fasten it from above.'],
  [64.6, 'Step nine. Install the D nine corner mechanism on the left cabinet side.'],
  [72.6, 'Step ten. Mirror the mechanism with D eight on the right side.'],
  [80.6, 'Step eleven. Lay out the left bed rails and join the first long members.'],
  [88.6, 'Step twelve. Repeat the rail assembly on the right side.'],
  [96.6, 'Step thirteen. Align and fasten all three C seven cross supports.'],
  [104.6, 'Step fourteen. Complete the platform perimeter and install the four C three spacers.'],
  [112.6, 'Step fifteen. Seat the first four C six deck panels inside the completed rails.'],
  [120.6, 'Step sixteen. Add the remaining deck panels, center rail, and perimeter inserts.'],
  [128.6, 'Step seventeen. Install the B two head rails and the B three foot rail.'],
  [136.6, 'Step eighteen. Fit the first six number twenty angle brackets beneath the deck.'],
  [144.6, 'Step nineteen. Install the remaining six brackets to complete all twelve connections.'],
  [152.6, 'Step twenty. Turn to the underside and fasten all five D two crossbars.'],
  [160.6, 'Step twenty-one. Attach the first E one pivot plate to the left platform rail.'],
  [168.6, 'Step twenty-two. Install the matching E one plate on the right rail.'],
  [176.6, 'Step twenty-three. Seat bearing nineteen, nut seventeen, and the left seven hundred fifty newton piston.'],
  [184.6, 'Step twenty-four. Repeat the bearing and piston installation on the right.'],
  [192.6, 'Step twenty-five. Four people lift the platform. Two people hold it while both pivot hooks are seated.'],
  [202.6, 'Step twenty-six. Thread nut seventeen onto the exposed left pivot shaft.'],
  [210.6, 'Step twenty-seven. Secure the matching locknut on the right pivot.'],
  [218.6, 'Step twenty-eight. Build and deploy both mirrored folding leg assemblies.'],
  [226.6, 'Step twenty-nine. Secure both leg hinges with bolts, washers, and caps.'],
  [234.6, 'Step thirty. Level the cabinet and anchor the left side into structural framing.'],
  [242.6, 'Step thirty-one. Complete the right wall anchor. Never operate an unsecured wall bed.'],
  [250.6, 'Option two, step one. Open the alternative daybed configuration and verify both support legs.'],
  [258.6, 'Option two, step two. Fold the legs, close the platform, and confirm the cabinet face is flush.'],
];

await rm(clipsDir, { recursive: true, force: true });
await mkdir(clipsDir, { recursive: true });
await mkdir(outputDir, { recursive: true });

const clipFiles = [];
for (let index = 0; index < narration.length; index += 1) {
  const [, words] = narration[index];
  const file = path.join(clipsDir, `scene-${String(index + 1).padStart(2, '0')}.aiff`);
  execFileSync('say', ['-v', 'Samantha', '-r', '180', '-o', file, words]);
  clipFiles.push(file);
}

const ffmpegArgs = ['-y', '-f', 'lavfi', '-t', String(duration), '-i', 'anullsrc=r=48000:cl=stereo'];
for (const file of clipFiles) ffmpegArgs.push('-i', file);
const filters = narration.map(([start], index) => `[${index + 1}:a]adelay=${Math.round(start * 1000)}:all=1[a${index}]`);
filters.push(`[0:a]${narration.map((_, index) => `[a${index}]`).join('')}amix=inputs=${narration.length + 1}:normalize=0:dropout_transition=0,alimiter=limit=0.95[aout]`);
ffmpegArgs.push('-filter_complex', filters.join(';'), '-map', '[aout]', '-t', String(duration), '-c:a', 'aac', '-b:a', '160k', audioFile);
execFileSync('ffmpeg', ffmpegArgs, { stdio: 'inherit' });

execFileSync('ffmpeg', [
  '-y', '-i', silentVideo, '-i', audioFile,
  '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', finalVideo,
], { stdio: 'inherit' });

console.log(`Narrated video written to ${finalVideo}`);
