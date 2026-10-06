import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const native = JSON.parse(fs.readFileSync(path.join(dir, 'native-resolution-qa/720p/manifest.json'), 'utf8'));
const baseline = JSON.parse(fs.readFileSync(path.join(dir, 'whole-scene-seek-verification.json'), 'utf8'));
const points = native.checkpoints.map(point => {
  const original = baseline.checkpoints.find(p => p.label === (point.sourceLabel ?? '09b-B8-complete-cabinet-face'));
  if (!original) throw Error('Missing frozen time match: ' + point.label);
  const bytes = fs.readFileSync(point.file);
  const currentSha256 = createHash('sha256').update(bytes).digest('hex');
  return { label: point.label, time: point.time, baselineTime: original.time, timeDifference: point.time - original.time, timestampExactlyEqual: point.time === original.time, baselineLabel: original.label,
    baselineSha256: original.sha256, currentSha256, pngByteIdentical: original.sha256 === currentSha256 };
});
const report = { valid: points.length === 12 && points.every(p => p.pngByteIdentical),
  candidate: baseline.candidate, method: 'Fresh production 720p PNGs after generic infrastructure changes vs frozen original production PNGs at the same approved semantic checkpoints. Exact timestamp identity is reported per point (B8 has floating-point accumulation roundoff); pixel comparison remains strict byte identity, with no resizing, tolerances or image transformations',
  points, testedAt: new Date().toISOString() };
fs.writeFileSync(path.join(dir, '720p-infrastructure-preservation.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
console.log(JSON.stringify(report, null, 2));
if (!report.valid) process.exitCode = 1;
