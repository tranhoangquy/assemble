import { execFileSync } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.resolve(root, 'output/merax-queen-film');
const clipsDir = path.resolve(root, 'tmp/merax-narration-clips');
const silentVideo = path.join(outputDir, 'merax-queen-new-assembly-silent.mp4');
const audioFile = path.join(outputDir, 'merax-queen-narration-en.m4a');
const finalVideo = path.join(outputDir, 'merax-queen-new-assembly-en.mp4');

const narration = [
  [0.7, 'This film presents an image-based reconstruction of the Merax Queen Murphy bed with adjustable side storage and a dual assist mechanism.'],
  [10.7, 'The product separates into four functional systems: the fixed cabinet, side storage, moving bed platform, and lift mechanism.'],
  [17.7, 'Identify the large panels and rails first. Install each hardware item only after its supporting part is correctly positioned.'],
  [25.7, 'Step one. Position the base plinth, align all three vertical uprights, and tighten the representative base fasteners.'],
  [42.7, 'Step two. Slide in the storage back, install the bottom, and place the four adjustable shelves from bottom to top.'],
  [58.7, 'Step three. Add the rear brace, lower crossbar, upper header, inset panels, and the full-width top cap.'],
  [75.7, 'Safety step. Anchor the cabinet into structural framing with the hardware and spacing specified in the official manual.'],
  [83.7, 'Step four. Assemble the moving bed perimeter from four rails, then install the longitudinal center support.'],
  [98.7, 'Step five. Install all five horizontal support slats first. Then lower the two large deck panels into the completed frame.'],
  [111.7, 'Step six. Fit both folding leg assemblies and secure each pivot bolt while tool access remains clear.'],
  [122.7, 'Step seven. Install the left bracket and insert its bolt from inside the opening. Move to the opposite face and thread the hex locknut onto the exposed end. Repeat on the right.'],
  [137.7, 'Step eight. Stand the bed platform upright, align both pivot axes, and move the frame carefully into the cabinet.'],
  [149.7, 'Step nine. Mount each assist assembly against the inner cabinet side. Focus on the left connection first, then repeat on the right. Follow the official piston instructions.'],
  [160.7, 'Step ten. Complete the cabinet face with six panels, perimeter framing, vertical mullions, and both pull handles.'],
  [174.7, 'Lower the platform, deploy both feet, and verify floor contact. With the bed horizontal, place a Queen mattress no thicker than eight inches onto the frame.'],
  [184.7, 'Finally, perform one complete close and open cycle with the mattress installed. Always consult the official manual.']
];

await rm(clipsDir, { recursive: true, force: true });
await mkdir(clipsDir, { recursive: true });
await mkdir(outputDir, { recursive: true });

const clipFiles = [];
for (let index = 0; index < narration.length; index += 1) {
  const [, text] = narration[index];
  const file = path.join(clipsDir, `scene-${String(index + 1).padStart(2, '0')}.aiff`);
  execFileSync('say', ['-v', 'Samantha', '-r', '165', '-o', file, text]);
  clipFiles.push(file);
}

const ffmpegArgs = ['-y', '-f', 'lavfi', '-t', '195', '-i', 'anullsrc=r=48000:cl=stereo'];
for (const file of clipFiles) ffmpegArgs.push('-i', file);
const filters = narration.map(([start], index) => `[${index + 1}:a]adelay=${Math.round(start * 1000)}:all=1[a${index}]`);
filters.push(`[0:a]${narration.map((_, index) => `[a${index}]`).join('')}amix=inputs=${narration.length + 1}:normalize=0:dropout_transition=0,alimiter=limit=0.95[aout]`);
ffmpegArgs.push('-filter_complex', filters.join(';'), '-map', '[aout]', '-t', '195', '-c:a', 'aac', '-b:a', '160k', audioFile);
execFileSync('ffmpeg', ffmpegArgs, { stdio: 'inherit' });

execFileSync('ffmpeg', [
  '-y', '-i', silentVideo, '-i', audioFile,
  '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', finalVideo,
], { stdio: 'inherit' });

console.log(`Narrated video written to ${finalVideo}`);
