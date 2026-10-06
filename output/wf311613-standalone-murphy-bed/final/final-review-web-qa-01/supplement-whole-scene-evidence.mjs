// Artifact-only supplement. Uses read-only Playwright API GET, no browser/3D.
// Never edits the captured failed report, approved sources or native validators.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {classifyNetwork,probeImplicitFavicon} from './network-classification.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url));
const originalPath=path.join(dir,'whole-scene-seek-verification.json'),cameraPath=path.join(dir,'camera-replay-numeric-audit.json'),output=path.join(dir,'whole-scene-supplementary-verification.json');
if(fs.existsSync(output))throw Error('Refusing to overwrite supplementary evidence');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),originalBytes=fs.readFileSync(originalPath),original=JSON.parse(originalBytes),cameraBytes=fs.readFileSync(cameraPath),camera=JSON.parse(cameraBytes);
if(camera.sourceSha256!==sha(originalBytes)||!camera.valid)throw Error('Numeric camera interpretation does not match captured evidence');
const frozen=JSON.parse(fs.readFileSync(path.join(dir,'frozen-source-hashes.json')));
for(const [file,hash]of Object.entries(frozen.hashes))if(sha(fs.readFileSync(file))!==hash)throw Error('Frozen application changed: '+file);
const requestFailures=[...original.networkAudit.requestFailures];
const {responses,confirmations}=await probeImplicitFavicon(original.networkAudit.responses,original.consoleRecords,original.renderUrl);
const networkAudit=classifyNetwork(responses,requestFailures,original.consoleRecords,original.renderUrl);
const valid=networkAudit.valid&&!original.errors.length&&camera.valid;
const result={...original,valid,originalStrictReportValid:original.valid,originalReportPath:originalPath,originalReportSha256:sha(originalBytes),originalReportUnchanged:sha(fs.readFileSync(originalPath))===sha(originalBytes),networkAudit,supplementalEvidence:{cameraAudit:cameraPath,cameraAuditSha256:sha(cameraBytes),strictCameraJsonReplayPass:camera.strictCameraJsonReplayPass,wholeScenePngReplayExact:camera.wholeScenePngReplayExact,adjacentBinary64RepresentationOnly:true,explicitReadOnlyFaviconConfirmations:confirmations,candidateSourcesUnchanged:Object.keys(frozen.hashes).length,nativeValidationRulesUnchanged:true},verifiedAt:new Date().toISOString()};
fs.writeFileSync(output,JSON.stringify(result,null,2));console.log(JSON.stringify({valid,originalStrictReportValid:original.valid,originalReportUnchanged:result.originalReportUnchanged,networkAudit:networkAudit.valid,confirmations,strictCameraJsonReplayPass:camera.strictCameraJsonReplayPass,wholeScenePngReplayExact:camera.wholeScenePngReplayExact},null,2));
if(!valid)process.exitCode=1;
