/** Artifact-only final delivery report. No source writes, render/build/test
 * jobs, ffprobe or browser launches. Run only after all actual QA reports and
 * manual VISUAL-QA.json exist. Historical failures remain explicit. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { renderProfiles, defaultRenderProfileId } from '../../../../src/engine/export/RenderProfiles.ts';

const dir = path.dirname(fileURLToPath(import.meta.url));
const absolute = value => path.isAbsolute(value) ? value : path.join(dir, value);
const read = async value => JSON.parse(await fs.readFile(absolute(value), 'utf8'));
const text = value => fs.readFile(absolute(value), 'utf8');
const requireTrue = (value, name) => { if (value !== true) throw new Error(`Completion not evidenced: ${name}.`); };
const requireValue = (value, name) => { if (!value) throw new Error(`Missing required evidence: ${name}.`); return value; };
const stem = process.env.FINAL_REPORT_STEM ?? 'FINAL-REVIEW-REPORT';
const outputJson = path.join(dir, `${stem}.json`), outputMd = path.join(dir, `${stem}.md`);
for (const file of [outputJson,outputMd]) {
  try { await fs.access(file); throw new Error(`Refusing to overwrite history: ${file}`); }
  catch(error) { if(error.code !== 'ENOENT') throw error; }
}

const technical = await read('technical-verification.json');
const before = await read('quality-options-before.json');
const sourceReportFile = process.env.FINAL_SOURCE_QA_FILE ?? 'source-boundaries-delivery.json';
const sources = await read(sourceReportFile);
const preservation = await read('720p-infrastructure-preservation.json');
const native = await read('native-resolution-qa/native-verification.json');
const webQaSubdir = process.env.FINAL_WEB_QA_SUBDIR ?? 'web-qa/after-headed-02';
const webReportFile = path.join(webQaSubdir,'web-qa-report.json');
const rawWebReportBytes = await fs.readFile(absolute(webReportFile));
const rawWebReportSha256 = createHash('sha256').update(rawWebReportBytes).digest('hex');
const web = JSON.parse(rawWebReportBytes.toString('utf8'));
const webReviewFile = process.env.FINAL_WEB_REVIEW_FILE ?? path.join(webQaSubdir,'web-qa-reviewed.json');
const webReview = await read(webReviewFile);
const networkSupplementFile = process.env.FINAL_NETWORK_SUPPLEMENT_FILE
  ?? (typeof webReview.networkSupplement === 'string' ? webReview.networkSupplement : path.join(webQaSubdir,'download-network-supplement.json'));
const networkSupplement = await read(networkSupplementFile);
const reviewedNetwork = webReview.networkClassification ?? webReview.reviewedNetworkClassification;
const visualPath = process.env.FINAL_VISUAL_QA_FILE ?? path.join(dir,'VISUAL-QA.json');
const visual = await read(visualPath);
const validationSubdir = process.env.FINAL_VALIDATION_SUBDIR ?? 'post-startup-fix-validation';
const validationFile = value => path.join(validationSubdir,value);
const validationPath = absolute(validationFile('validation-summary.json'));
const validation = await read(validationPath);
const previousValidation = await read('post-infrastructure-validation/validation-summary.json');
const mechanical = await read(validationFile('approved-mechanical-gates/validation-results.json'));
const props = await read(validationFile('polish02b-presentation/presentation-fit.json'));
const micro = await read(validationFile('micro-native/micro-validation.json'));
const strictSeek = await read('whole-scene-seek-verification.json');
const supplementarySeek = await read('whole-scene-supplementary-verification.json');
const cameraAudit = await read('camera-replay-numeric-audit.json');
const beforeWeb = await read('web-qa/before/web-qa-error.json');
const interactiveHeadlessFailure = await read('web-qa/after/web-qa-error.json');
const focusedHeadlessDiagnostic = await read('web-qa/profile-selection-diagnostic-01/diagnostic.json');
const focusedHeadedDiagnostic = await read('web-qa/profile-selection-diagnostic-headed-01/diagnostic.json');
const firstHeadedExportFailure = await read('web-qa/after-headed-01/web-qa-error.json');
const coldDiagnosticFile = process.env.FINAL_COLD_DIAGNOSTIC_FILE ?? 'web-qa/render-readiness-2026-10-04T00-53-40-961Z-1b9772c2/render-readiness-diagnostic.json';
const coldDiagnostic = await read(coldDiagnosticFile);
const profileLog = await text(validationFile('profile-tests.log'));
const fullLog = await text(validationFile('full-tests.log'));
const buildLog = await text(validationFile('build-webpack.log'));

for(const [name,report] of [['completed 720p MP4',technical],['source boundaries',sources],['720p preservation',preservation],
  ['native resolution QA',native],['strict network-reviewed actual production web QA',webReview],['manual visual QA',visual],['mechanical gates',mechanical],['Polish02B presentation',props]]) requireTrue(report.valid,name);
requireTrue(validation.valid,'recorded command exit validation');
requireTrue(web.actualProductionUI,'actual production workflow');
if(web.apiMocked !== false) throw new Error('Actual web QA must explicitly declare apiMocked:false.');
const networkCheckName = 'no unexplained critical HTTP/resource/console failures';
const rawFailedChecks = web.checks.filter(item=>!item.passed);
if(web.valid !== false || rawFailedChecks.length !== 1 || rawFailedChecks[0].name !== networkCheckName || web.checks.filter(item=>item.passed).length !== 34) throw new Error('Raw web aggregate must retain its sole network-classification FAIL; every other actual functional check must PASS.');
if((webReview.rawReportSha256 ?? webReview.rawSha256) !== rawWebReportSha256) throw new Error('Reviewed network supplement does not bind the exact unchanged raw web report SHA.');
if(webReview.rawAggregateValid !== false || path.resolve(webReview.rawReport) !== absolute(webReportFile)) throw new Error('Reviewed web evidence must explicitly retain the exact raw aggregate FAIL and report path.');
const reviewedNetworkCheck = webReview.checks?.find(item=>item.name===networkCheckName);
if(webReview.checks?.length !== web.checks.length || reviewedNetworkCheck?.passed !== true || reviewedNetworkCheck.originalRawPassed !== false
  || JSON.stringify(webReview.checks.filter(item=>item.name!==networkCheckName)) !== JSON.stringify(web.checks.filter(item=>item.name!==networkCheckName))) throw new Error('Only the separately reviewed network check may differ from the unchanged raw functional checks.');
requireTrue(networkSupplement.valid,'separate strict completed-download supplement');
requireTrue(networkSupplement.originalReportUnmodified,'raw web report preserved by supplement');
if(networkSupplement.rawAggregateValid !== false || networkSupplement.rawReportSha256 !== rawWebReportSha256
  || path.resolve(networkSupplement.rawReport) !== absolute(webReportFile)
  || networkSupplement.appSourceModified !== false || networkSupplement.classifierModified !== false || networkSupplement.validatorThresholdsModified !== false) throw new Error('Network supplement must bind the unchanged raw FAIL without source, classifier or threshold modifications.');
if(JSON.stringify(reviewedNetworkCheck.details) !== JSON.stringify(networkSupplement)
  || (typeof webReview.networkSupplement==='object' && JSON.stringify(webReview.networkSupplement)!==JSON.stringify(networkSupplement))) throw new Error('Reviewed network check and standalone supplement evidence differ.');
requireTrue(reviewedNetwork?.valid,'reviewed network classification');
if(JSON.stringify(reviewedNetwork)!==JSON.stringify(networkSupplement.reviewedNetwork)) throw new Error('Reviewed classifier result must match the separate strict supplement.');
for(const field of ['requestFailures','unexplainedHttpFailures','fatalConsoleErrors']){
  if(!Array.isArray(reviewedNetwork[field]) || reviewedNetwork[field].length!==0) throw new Error(`Reviewed network classification still has unexplained failures: ${field}.`);
}
const verifiedDownloadJob = web.download?.job;
const verifiedDownloadUrl = new URL(`/api/export/${verifiedDownloadJob?.id}/download`,web.origin).href;
const rawDownloadAbort = web.requestFailures?.[0];
if(web.requestFailures?.length !== 1 || rawDownloadAbort.url !== verifiedDownloadUrl || rawDownloadAbort.method !== 'GET' || rawDownloadAbort.resourceType !== 'document' || rawDownloadAbort.failure?.errorText !== 'net::ERR_ABORTED' || verifiedDownloadJob?.status !== 'completed') throw new Error('Only the exact completed-job download navigation abort is eligible for separately evidenced explanation.');
if(!web.responses.some(item=>item.url===verifiedDownloadUrl && item.status===200 && item.method==='GET' && item.resourceType==='document')) throw new Error('The exact explained download navigation does not have a matching actual HTTP200 response.');
if(web.pageErrors.length !== 0) throw new Error('Actual web page exceptions cannot be waived by the download explanation.');
if(networkSupplement.exactDownloadUrl!==verifiedDownloadUrl || networkSupplement.completedJobId!==verifiedDownloadJob.id
  || JSON.stringify(networkSupplement.explainedEvent)!==JSON.stringify(rawDownloadAbort)
  || networkSupplement.observedDownloadHttpStatus!==200 || networkSupplement.downloadPath!==web.download.path
  || !Array.isArray(networkSupplement.applicationFailedRequests) || networkSupplement.applicationFailedRequests.length!==0) throw new Error('The supplement must explain only the exact verified completed-job download event, with no other failed application requests.');
requireTrue(networkSupplement.completeDecode,'independent completed web proof decode');
if(networkSupplement.unexpectedBlackIntervals!==0) throw new Error('Actual downloaded web proof has unexpected black intervals.');
const actualWebProofBytes = await fs.readFile(web.download.path);
const actualWebProofSha256 = createHash('sha256').update(actualWebProofBytes).digest('hex');
if(actualWebProofBytes.length!==networkSupplement.bytes || actualWebProofBytes.length!==web.download.size
  || actualWebProofSha256!==networkSupplement.sha256 || actualWebProofSha256!==web.download.sha256) throw new Error('The actual saved web download no longer matches the SHA/byte evidence.');
const webProofVideo = networkSupplement.reProbe?.streams?.filter(item=>item.codec_type==='video') ?? [];
if(webProofVideo.length!==1 || networkSupplement.reProbe.streams.some(item=>item.codec_type==='audio')
  || webProofVideo[0].width!==1280 || webProofVideo[0].height!==720 || webProofVideo[0].codec_name!=='h264' || webProofVideo[0].pix_fmt!=='yuv420p'
  || webProofVideo[0].r_frame_rate!=='30/1' || webProofVideo[0].avg_frame_rate!=='30/1'
  || Number(webProofVideo[0].nb_frames)!==60 || Number(webProofVideo[0].nb_read_frames)!==60
  || Number(networkSupplement.reProbe.format?.duration)!==2 || Number(networkSupplement.reProbe.format?.size)!==actualWebProofBytes.length) throw new Error('Independent web proof re-probe must confirm native 720p / 30 fps / H.264 / yuv420p / 60 frames / 2 seconds / silent.');
requireTrue(technical.completeDecode,'complete review MP4 decode');
requireTrue(technical.constantFrameRate,'constant frame rate');
requireTrue(technical.sourceSequenceContiguous,'contiguous source frames');
requireTrue(technical.noHistoricalMp4OrFramesUsed,'fresh source frames/no historical sequence');
requireTrue(native.noFullHighResolutionRenders,'no full high resolution rendering');
requireTrue(native.noAudioAdded,'no audio added');
if(technical.audioStreams !== 0 || technical.unexpectedBlackIntervals !== 0 || technical.missingOrEmptyFrames !== 0) throw new Error('Master audio/black/missing-frame verification failed.');
if(native.proofResults?.length !== 4 || native.proofResults.some(item => !item.valid || item.frames !== 60 || item.audioStreams !== 0 || !item.noUpscaling || !item.completeDecode || item.unexpectedBlackIntervals)) throw new Error('Four actual silent native encode proofs are not all evidenced.');
if(native.profiles?.length !== 4 || native.profiles.some(item => item.checked.length !== 12 || !item.native)) throw new Error('Four native profiles with 12 checkpoints are required.');
if((visual.inspectedEvidence?.length ?? 0) < 1 && (visual.evidencePaths?.length ?? 0) < 1) throw new Error('Manual visual QA requires actual inspectedEvidence or evidencePaths, not an unsubstantiated flag.');
if(!/Tests\s+39 passed \(39\)/.test(profileLog) || !/Test Files\s+7 passed \(7\)/.test(profileLog) || !/Tests\s+187 passed \(187\)/.test(fullLog) || !/Test Files\s+37 passed \(37\)/.test(fullLog)) throw new Error('Actual post-startup profile/full test counts do not match recorded expected results.');
if(!/Compiled successfully/.test(buildLog) || !/Finalizing page optimization/.test(buildLog)) throw new Error('Successful production webpack build is not evidenced.');
const commandRecords = validation.commands ?? validation.results;
if(!Array.isArray(commandRecords)) throw new Error('validation-summary.json requires commands or results with recorded actual exitCode.');
const requiredCommandNames=['mechanical','props','profile-tests','full-tests','typecheck','lint','build-webpack'];
for(const name of requiredCommandNames){
  const result=commandRecords.find(item => item.name === name || item.id === name);
  if(result?.exitCode !== 0) throw new Error(`Actual zero command exit not recorded: ${name}.`);
}

const oldIds = before.existingResolutionOptions.map(item => item.id);
for(const previous of before.existingResolutionOptions){
  const current=renderProfiles.find(item => item.id === previous.id);
  if(!current || current.label!==previous.label || current.width!==previous.width || current.height!==previous.height || JSON.stringify(current.supportedFps)!==JSON.stringify(previous.allowedFps)) throw new Error(`Existing profile changed: ${previous.id}.`);
}
if(defaultRenderProfileId!==before.webDefaults.resolutionId) throw new Error('Existing web default changed.');
if((sources.unexpectedDeltas?.length ?? 0) || (sources.protectedProductChanges?.length ?? 0) || (sources.historyChanged?.length ?? 0)) throw new Error('Protected source/history boundary violation.');
if((micro.errors?.length ?? 0) !== 0 || !micro.step1Reset?.valid || micro.explodedPaths?.newPenetrations?.length) throw new Error('Native micro physical/reset/path check actually failed.');
const nativeMicroUnexpected = micro.unexpectedSourceDeltas ?? [];
if(micro.valid !== false || JSON.stringify([...nativeMicroUnexpected].sort())!==JSON.stringify(['src/engine/export/ExportJobManager.ts','src/engine/render/FrameRenderer.ts'].sort())) throw new Error('Historical micro source-lock outcome differs; inspect actual native validator evidence before reporting.');

const changedFiles=[...(sources.changed ?? []).map(item=>({path:item.path,status:'changed'})),...(sources.added ?? []).map(item=>({path:item.path,status:'added'}))];
const newTests=changedFiles.filter(item=>item.path.endsWith('.test.ts'));
const gateNames=['locks','assembly','structuralPaths','groundedFloor','frontStaging','mechanics','hardware','step28','foldingLegs','receiverPaths','pistons','seekReset','b8','presentationFit','captions'];
const gateResults=gateNames.map(name=>({name,valid:mechanical[name]?.valid}));
if(gateResults.some(item=>!item.valid)) throw new Error('Not all 15 mechanical gates pass.');
const sourceStats={changed: sources.changed.length,added:sources.added.length,totalGenericPaths:changedFiles.length,protectedProductChanges:0,unexpectedDeltas:0,historyChanges:0};
const profileSummary=renderProfiles.map(item=>({id:item.id,label:item.label,width:item.width,height:item.height,defaultFps:item.fps,supportedFps:item.supportedFps,codec:item.codec,pixelFormat:item.pixelFormat,kind:item.kind}));
const profileTable=profileSummary.map(item=>`| ${item.id} | ${item.label} | ${item.width}×${item.height} | ${item.defaultFps} | ${item.supportedFps.join('/')} | ${item.kind} |`).join('\n');
const oldTable=before.existingResolutionOptions.map(item=>`| ${item.id} | ${item.label} | ${item.width}×${item.height} | ${item.allowedFps.join('/')} |`).join('\n');
const nativePaths=native.profiles.map(item=>({id:item.profile.id,directory:path.join(dir,'native-resolution-qa',item.profile.id),manifest:path.join(dir,'native-resolution-qa',item.profile.id,'manifest.json'),stills:item.checked.map(point=>point.file),measuredDimensions:[item.profile.width,item.profile.height],checkedCount:item.checked.length,surface:item.checked[0]?.surface}));
const proofSummary=native.proofResults.map(item=>({profile:item.profile,output:item.output,width:item.width,height:item.height,frames:item.frames,duration:item.duration,fps:item.fps,codec:item.codec,pixelFormat:item.pixelFormat,bytes:item.bytes,sha256:item.sha256,nativeSourceFrames:item.nativeSourceFrames,audioStreams:item.audioStreams,completeDecode:item.completeDecode,unexpectedBlackIntervals:item.unexpectedBlackIntervals,valid:item.valid}));
const screenshots=(web.screenshots ?? []).map(item=>typeof item==='string'?item:item.path);
const manualUiObservations = absolute(path.join(webQaSubdir,'AFTER-WEB-VISUAL-OBSERVATIONS.md'));
const findings=[
  ...(web.findings ?? []).map(item=>({...item,source:'unchanged raw scripted production UI QA',
    status:item.summary==='Unexplained production HTTP/resource/console failures require review.'
      ? 'explained separately by strict network-review supplement; raw finding remains unchanged'
      : 'remaining reported finding; no unrelated source fix implied'})),
  ...(visual.unrelatedFindings ?? []).map(item=>({...item,source:'manual visual QA'})),
].map(item=>({...item,status:item.status ?? 'remaining reported finding; no unrelated source fix implied'}));
const explainedRawNetworkFindings = findings.filter(item=>item.status.startsWith('explained separately'));
const remainingFindings = findings.filter(item=>!item.status.startsWith('explained separately'));
const beforeJobLast=beforeWeb.jobs?.at(-1);
const afterJob=web.download?.job ?? web.jobs?.findLast(item=>item.status==='completed') ?? web.createdJob;
const p0Fixed=Boolean(afterJob?.status==='completed' && web.download?.path && web.checks?.some(item=>item.name==='download complete decode' && item.passed));
if(!p0Fixed) throw new Error('Before export P0 fix is not proven by actual completed/downloaded after job.');
const previousCommands = previousValidation.commands ?? previousValidation.results ?? [];
const buildAttempts=[
  ...previousCommands.map(item=>({...item,phase:'pre-startup-fix'})),
  ...commandRecords.map(item=>({...item,phase:'post-startup-fix'})),
].filter(item=>/build|turbopack/i.test(item.name ?? item.id ?? ''));
const coldFirstReadySeconds = coldDiagnostic.readyObservation?.relativeToReadyWaitMs / 1000;
const overlapWarning = 'An early props-check attempt briefly overlapped the running mechanical gate. That props attempt exited 0 before the attempted interruption. The mechanical run continued; the unchanged props checker was then rerun after mechanical completion. This limited overlap is retained as an operational warning; not all attempts are claimed to have been strictly sequential.';
const elapsedProfileCapture=native.profiles.map(item=>({profile:item.profile.id,checkpointCount:item.checked.length,proofFrames:60}));
const strictCameraDifferences=(cameraAudit.allFindings ?? []).flatMap(item=>item.differences ?? []);

const retainedFailures={
  nativeMicroAggregate:{valid:micro.valid,unexpectedSourceDeltas:nativeMicroUnexpected,mechanicalSourceLocksUnchanged:micro.mechanicalSourceLocksUnchanged,
    physicalErrors:micro.errors,step1Reset:micro.step1Reset,explodedPaths:micro.explodedPaths,cameraCheckCount:micro.cameraChecks?.length,
    explanation:'UNCHANGED native aggregate validator remains FAIL because its historical 92-source byte branch permits only ProductViewer changes; newly authorized generic ExportJobManager and FrameRenderer edits are rejected by that legacy branch. No assertion/threshold/manifest/validator was altered or waived. Independent source boundaries and 15 unchanged mechanical gates pass. Do not report all native validators PASS.'},
  wholeSceneStrict:{valid:strictSeek.valid,strictCameraJsonReplayPass:cameraAudit.strictCameraJsonReplayPass,changedScalarCount:strictCameraDifferences.length,
    wholeScenePngReplayExact:cameraAudit.wholeScenePngReplayExact,adjacentBinary64Only:supplementarySeek.supplementalEvidence?.adjacentBinary64RepresentationOnly,
    explanation:'Original strict camera JSON seek report remains FAIL: five position/direction scalar representations differ by 1 binary64 ULP at two points. All 30 fresh whole-scene PNG replay checks and exact Step 1 reset pass. Supplement retained separately; not a silently relaxed camera threshold.'},
  turbopackBuildAttempts:buildAttempts.filter(item=>item.exitCode!==0),
  beforeExport:{report:absolute('web-qa/before/web-qa-error.json'),error:beforeWeb.error,finalObservedJob:beforeJobLast,p0CorrectedAndProven:p0Fixed,
    scope:'Generic navigation domcontentloaded and exact original 127.0.0.1 origin. Measured cold readiness exceeded the former 60 s production budget; production readiness was aligned to the already-existing 90 s CLI budget. Navigation remains 60 s. No assembly, camera, validator or test-timeout change. Correction is proven only by the final actual completed/downloaded/decoded 720p job.'},
  firstHeadedExportFailure:{report:absolute('web-qa/after-headed-01/web-qa-error.json'),valid:firstHeadedExportFailure.valid,error:firstHeadedExportFailure.error,createdJob:firstHeadedExportFailure.createdJob,finalObservedJob:firstHeadedExportFailure.jobs?.at(-1)},
  coldStartDiagnostic:{report:absolute(coldDiagnosticFile),diagnosticComplete:coldDiagnostic.diagnosticComplete,original60SecondGate:coldDiagnostic.readyGate60s,firstReadyObservedSeconds:coldFirstReadySeconds,milestones:coldDiagnostic.milestones,readyPng:coldDiagnostic.readyPng,pageErrors:coldDiagnostic.pageErrors,requestFailures:coldDiagnostic.requestFailures,
    explanation:'The original 60 s gate remains FAIL. Actual readiness was first observed after that deadline; 90/120 s observations are separate diagnostic evidence, not a passed former gate or an altered validator.'},
  validationAttemptOverlap:{warning:overlapWarning,evidence:validationPath},
  previousValidation:{report:absolute('post-infrastructure-validation/validation-summary.json'),profileTests:38,totalTests:186,logsPreserved:true,commands:previousCommands},
  rawWebAggregate:{report:absolute(webReportFile),sha256:rawWebReportSha256,valid:web.valid,rawChecksPassed:34,rawChecksTotal:35,failedChecks:rawFailedChecks,
    observedDownloadNavigationAbort:rawDownloadAbort,downloadUrl:verifiedDownloadUrl,
    supplement:absolute(networkSupplementFile),reviewReport:absolute(webReviewFile),reviewedNetworkValid:reviewedNetwork.valid,review:webReview,
    actualSavedDownload:{path:web.download.path,bytes:actualWebProofBytes.length,sha256:actualWebProofSha256},
    explanation:'The original raw web aggregate remains FAIL (34/35). Its only failed check is strict network classification of one exact completed-job download GET/document net::ERR_ABORTED. The same exact URL returned HTTP200 and produced a successfully saved, probed and completely decoded MP4. A separate SHA-bound review reruns the unchanged classifier only after that precisely verified navigation event is classified as explained; no other failed requests are allowed. The raw abort and original classifier result are retained. Reviewed network PASS is not a renamed raw aggregate PASS or a blanket abort/favicon waiver.'},
  interactiveBrowserAutomation:{
    firstHeadlessAfterRun:{report:absolute('web-qa/after/web-qa-error.json'),valid:interactiveHeadlessFailure.valid,error:interactiveHeadlessFailure.error,checksPassed:interactiveHeadlessFailure.checks?.filter(item=>item.passed).length,jobCreated:Boolean(interactiveHeadlessFailure.createdJob)},
    focusedHeadless:{report:absolute('web-qa/profile-selection-diagnostic-01/diagnostic.json'),valid:focusedHeadlessDiagnostic.valid,error:focusedHeadlessDiagnostic.error,pageErrors:focusedHeadlessDiagnostic.pageErrors},
    focusedHeaded:{report:absolute('web-qa/profile-selection-diagnostic-headed-01/diagnostic.json'),valid:focusedHeadedDiagnostic.valid,headed:focusedHeadedDiagnostic.headed,operations:focusedHeadedDiagnostic.operations,pageErrors:focusedHeadedDiagnostic.pageErrors},
    completedWorkflowReport:absolute(webReportFile),
    explanation:'Deterministic headless frame rendering and native-resolution QA succeeded. Interactive headless UI automation timed out after completed clicks; both raw failures remain FAIL. A focused actual headed Chromium run showed all four profile selections and matching summaries in 41–80 ms with no page exceptions. The complete real workflow uses headed Chromium at the same 1600×1000 viewport, unchanged interaction assertions and interactive-test timeouts; no UI-source repair. The separate measured production-renderer readiness alignment to 90 s is documented explicitly. This is an observed automation limitation, not a blanket browser-failure waiver or a proven root-cause diagnosis. Renderer export correction is claimed only if the completed workflow actually downloads and completely decodes its newly rendered MP4.'},
};

const nativeMicroText=`Native micro aggregate is **FAIL**, not PASS. Physical errors: ${micro.errors.length}; Step 1 reset valid: ${micro.step1Reset.valid}; exploded-path pair checks: ${micro.explodedPaths.pairChecks}; new penetrations: ${micro.explodedPaths.newPenetrations?.length ?? 0}; camera checks: ${micro.cameraChecks.length}. Only historical source-lock rejection is ${nativeMicroUnexpected.join(', ')}. The validator and its thresholds were left unchanged; no waiver. Independent approved-data/source-boundary evidence and unchanged 15 mechanical gates pass.`;
const seekText=`Original strict whole-scene camera JSON replay remains **FAIL** (${strictCameraDifferences.length} scalar 1 ULP representation differences). All 30 whole-scene PNGs replay byte-exactly and exact Step 1 reset passes; supplementary numeric evidence is retained separately. No camera/validator edit or claim of original strict PASS.`;
const interactiveBrowserText='Interactive headless UI automation retained two timeout failures (the first after-workflow profile check, and a focused diagnostic). Those raw results remain FAIL, not waived. Actual headed Chromium profile selection succeeded with matching summaries in 41–80 ms and no page exceptions. The completed headed workflow retains the same 1600×1000 viewport, assertions and interactive-test timeouts, with no UI-source changes. The separate production renderer readiness budget was aligned to the existing CLI 90 s budget after measured cold-start evidence. Deterministic headless rendering/native QA succeeds independently; that does not make the interactive headless failures PASS. The underlying interactive timeout cause is not conclusively diagnosed.';
const startupReadinessText=`The first headed actual export also failed at the former 60 s renderer-ready wait with zero frames; that failure is retained. An isolated unchanged 60 s diagnostic also failed, then first observed actual readiness at ${coldFirstReadySeconds.toFixed(3)} s after wait start; the 90/120 s observations were ready. Production readiness now uses the already-existing CLI budget of 90 s; navigation remains 60 s. Only this operational budget and its one regression test changed. Assembly timing, geometry, cameras, validators and test-timeout settings were untouched. The former 60 s failures are not retroactively PASS.`;
const networkReviewText=`Raw scripted web aggregate: **FAIL, 34/35**. All 34 functional/page checks passed, including actual generation, completion, native metadata, download, SHA and full decode. The sole failed network check records the exact completed-job GET/document download navigation \`net::ERR_ABORTED\`, alongside HTTP 200 for that URL and a successful saved MP4. Separate strict reviewed network result: **PASS**; supplement ${absolute(networkSupplementFile)} binds raw SHA \`${rawWebReportSha256}\` and retains the abort. The actual saved ${actualWebProofBytes.length.toLocaleString()}-byte MP4 was independently SHA-checked as \`${actualWebProofSha256}\`; the supplement's re-probe and complete decode confirm 2 seconds / 60 frames / native 720p / 30 fps / silent. The existing classifier was rerun only after that exact verified navigation was explained; no other failed requests are allowed. The proven optional favicon 404 is classified from actual HTTP evidence. Raw JSON, failed check and original console classification remain unchanged—not renamed PASS or waived globally.`;
const proofTable=proofSummary.map(item=>`| ${item.profile} | ${item.width}×${item.height} | ${item.duration} s | ${item.frames} | ${item.valid?'PASS':'FAIL'} | ${item.output} |`).join('\n');
const dimensionsTable=nativePaths.map(item=>`| ${item.id} | ${item.measuredDimensions.join('×')} | ${item.checkedCount} | viewport/canvas/CSS/drawing buffer/PNG exact |`).join('\n');
const noHighResText='No full 1080p, 1440p or 2160p video was rendered. Only 12 checkpoints and a 2-second / 60-frame proof per standard profile; one extra actual web 720p proof. No music/SFX/audio downloaded or muxed.';

const items=[];
const add=(id,title,value,evidence,markdown)=>items.push({id,title,value,evidence,markdown});
add(1,'Full 720p review master',technical.output,[absolute('technical-verification.json')],technical.output);
add(2,'Actual runtime',{expectedTimeline:technical.timelineDuration,encoded:technical.encodedDuration,roundingDifference:technical.finalFrameRoundingDifference},[],`Expected ${technical.timelineDuration.toFixed(9)} s; encoded ${technical.encodedDuration.toFixed(6)} s; final-frame rounding +${technical.finalFrameRoundingDifference.toFixed(9)} s. Intro 5 s, unchanged assembly 498.253694 s and showcase 20.8 s.`);
add(3,'Frame count',technical.frameCount,[],`${technical.frameCount.toLocaleString()} encoded frames; ${technical.sourceFrameCount.toLocaleString()} fresh contiguous source frames.`);
add(4,'Exact file size',technical.fileSizeBytes,[],`${technical.fileSizeBytes.toLocaleString()} bytes.`);
add(5,'SHA-256',technical.sha256,[],`\`${technical.sha256}\``);
add(6,'ffprobe/decode/black-frame verification',{valid:technical.valid,resolution:technical.resolution,fps:technical.fps,CFR:technical.constantFrameRate,codec:technical.codec,pixelFormat:technical.pixelFormat,completeDecode:technical.completeDecode,blackIntervals:technical.unexpectedBlackIntervals,missingFrames:technical.missingOrEmptyFrames,audioStreams:technical.audioStreams},[absolute('ffprobe.json'),absolute('complete-decode-blackdetect.log'),absolute('frame-cadence-verification.json')],`PASS: 1280×720, 30 fps CFR, H.264/yuv420p, complete decode, 0 unexpected black intervals, 0 missing/empty frames, 0 audio streams. Fresh time-zero render, no historical MP4/frame reuse.`);
add(7,'Decoded-MP4 contact sheet',technical.decodedContactSheet,[absolute('decoded-spot-checks.json'),absolute('DECODED-VISUAL-OBSERVATIONS.md'),absolute(visualPath)],`${technical.decodedContactSheet}\n\n${technical.decodedSpotCheckCount} representative frames decoded directly from completed MP4. Manual QA artifact: ${absolute(visualPath)}. Intro→Step 1 reset clean; approved Step 26 position [-114.3,116,17], target [-115.3,111,7], FOV 62 unchanged. This is review delivery, not director approval.`);
add(8,'Actual production web audit',{rawAggregateValid:web.valid,reviewedNetworkValid:reviewedNetwork.valid,workflowReport:absolute(webReportFile),networkReview:absolute(webReviewFile),networkSupplement:absolute(networkSupplementFile),checks:web.checks,createdJob:web.createdJob,download:web.download&&{path:web.download.path,size:web.download.size,sha256:web.download.sha256},p0Fixed,automationLimitations:retainedFailures.interactiveBrowserAutomation,startupReadiness:retainedFailures.coldStartDiagnostic},[absolute(webReportFile),absolute(webReviewFile),absolute(networkSupplementFile),absolute('web-qa/before/web-qa-error.json'),absolute('web-qa/after/web-qa-error.json'),absolute('web-qa/after-headed-01/web-qa-error.json'),absolute(coldDiagnosticFile),absolute('web-qa/profile-selection-diagnostic-01/diagnostic.json'),absolute('web-qa/profile-selection-diagnostic-headed-01/diagnostic.json')],`Actual headed production functionality PASS: product selector/viewer, preview play/pause, seek/reset, product-switch isolation, six quality choices, real selected 720p export/status/completion/download. No API/progress/output mocks. Before zero-frame renderer timeout P0 was retained; only the after job's actual completion/download/decode proves the scoped generic lifecycle correction. Downloaded web proof: ${web.download.path}.\n\n${networkReviewText}\n\n${startupReadinessText}\n\n${interactiveBrowserText}`);
add(9,'P0/P1/P2 web findings',{before:beforeWeb.findings,findings,remainingFindings,explainedRawNetworkFindings,fixedP0:retainedFailures.beforeExport,networkException:retainedFailures.rawWebAggregate},[absolute(webReportFile),absolute(webReviewFile),absolute(networkSupplementFile),absolute(visualPath),manualUiObservations],`P0 fixed and proven: actual export timeout (${beforeWeb.error?.message ?? 'see before evidence'}).\n\nRemaining unrelated findings:\n\n${remainingFindings.map(item=>`- ${item.severity}: ${item.summary} (${item.status})`).join('\n')||'No remaining unrelated P0/P1/P2 findings recorded in after QA.'}\n\nSeparately explained raw network finding:\n\n${explainedRawNetworkFindings.map(item=>`- ${item.severity}: ${item.summary} (${item.status})`).join('\n')}\n\nScripted and manual findings are distinguished in the JSON report; raw web QA evidence is unchanged. The raw network P1 is explained separately by the strict SHA-bound download review, not erased or mislabeled as a remaining unexplained failure. Unrelated findings are reported, not silently repaired.`);
add(10,'All quality options before changes',before.existingResolutionOptions,[absolute('quality-options-before.json'),absolute('quality-options-before.md')],`| ID | Label | Dimensions | FPS |\n|---|---|---|---|\n${oldTable}\n\nDefault: 1920x1080 / 30 FPS. No saved settings or persistent render jobs found; settings are component state, jobs in-memory.`);
add(11,'All quality options after changes',profileSummary,['src/engine/export/RenderProfiles.ts'],`| ID | Label | Dimensions | Default FPS | Available FPS | Kind |\n|---|---|---|---|---|---|\n${profileTable}`);
add(12,'Legacy options/IDs/default preserved',{oldIds,defaultRenderProfileId,defaultFps:30,legacyAvailableFps:[30,60],persistedSettings:false,jobStore:'in-memory',jobTTL:'30 minutes; 60 seconds after download stream close'},[],`Both old IDs/labels/dimensions remain exact; default 1920x1080 / 30 remains unchanged. 30 / 60 FPS remains available. Legacy dimension-only requests resolve explicitly to legacy IDs. No silent resolution fallback or stored-ID reinterpretation.`);
add(13,'Generic render-profile architecture',{registry:'src/engine/export/RenderProfiles.ts',identity:'src/engine/export/RenderIdentity.ts',native:'src/engine/export/NativeSurface.ts',resume:'src/engine/export/FrameManifest.ts'},[],`Shared authoritative profiles drive UI→server validation→job snapshot→render query/viewport→native capture→FFmpeg→filename/completed metadata. Identity binds product/project, video SHA, profile ID, dimensions, FPS, start timestamp. Profile/job-isolated frames and outputs; unsafe/cross-profile/historical resume rejected. Streamed download; incremental PNG writes; truthful frame progress and indeterminate encoding. Standard native frames are never upscaled. Render-only caption proportional scaling leaves 720p unchanged. Public profiles allow 30 / 60; historical custom CLI dimensions/FPS remain explicit and isolated.`);
add(14,'Files changed',{sourceStats,files:changedFiles},[absolute(sourceReportFile),absolute('source-boundaries-final.json')],`${sourceStats.totalGenericPaths} authorized generic paths (${sourceStats.changed} changed, ${sourceStats.added} added). Zero protected product changes, zero unexpected changes, zero historical output changes. Final completion evidence: ${absolute(sourceReportFile)}. Prior source audits are preserved.\n\n${changedFiles.map(item=>`- ${item.status}: ${item.path}`).join('\n')}`);
add(15,'Production web screenshots',screenshots,[absolute(webReportFile)],screenshots.map(value=>`- ${value}`).join('\n'));
for(const [index,id] of ['720p','1080p','1440p','2160p'].entries()){
  const entry=nativePaths.find(item=>item.id===id);
  add(16+index,`${id} native QA paths`,entry,[entry.manifest],`${entry.directory}\n\n12 fresh native stills/state records; manifest: ${entry.manifest}.`);
}
add(20,'Measured native dimensions',nativePaths.map(item=>({id:item.id,dimensions:item.measuredDimensions,checkpoints:item.checkedCount})),[absolute('native-resolution-qa/native-verification.json')],`| Profile | Measured pixels | Checkpoints | Native verification |\n|---|---|---|---|\n${dimensionsTable}`);
add(21,'Cross-resolution comparison sheets',{contactSheet:native.comparisonContactSheet,sheets:native.comparisonSheets,comparisons:native.comparisons},[absolute('native-resolution-qa/native-verification.json')],`${native.comparisonContactSheet}\n\n${native.comparisonSheets.map(item=>`- ${item.file}`).join('\n')}\n\nActual non-raster scene/camera hashes match at identical timestamps across profiles. Caption wording/visibility and normalized screen proportions verified. Thumbnails alone are downscaled for comparison sheets; native source PNG/proof frames remain untouched.`);
add(22,'Short encode-proof paths/results',proofSummary,[absolute('native-resolution-qa/native-verification.json')],`| Profile | Native pixels | Runtime | Frames | Result | MP4 |\n|---|---|---|---|---|---|\n${proofTable}\n\nEach actual encoded proof: 30 fps CFR, H.264/yuv420p, silent, full decode/no unexpected black interval; native 60 PNG source frames, no upscaling.`);
add(23,'Tests added/changed',newTests,[absolute(validationFile('profile-tests.log'))],`${newTests.map(item=>`- ${item.path}`).join('\n')}\n\nCovers old/new IDs/defaults/FPS, exact 16:9 sizes, API validation/rejection/same-origin, job propagation/naming, native canvas/PNG policy, cache/profile isolation/resume, video/state identity and generic scene diagnostics.`);
add(24,'Complete test result',{profileTests:39,profileTestFiles:7,totalTests:187,totalTestFiles:37,allPassed:true,previousCounts:{profileTests:38,totalTests:186},attemptOverlap:retainedFailures.validationAttemptOverlap},[absolute(validationFile('profile-tests.log')),absolute(validationFile('full-tests.log')),validationPath,absolute('post-infrastructure-validation/profile-tests.log'),absolute('post-infrastructure-validation/full-tests.log')],`Post-startup-fix: 39/39 profile/diagnostic tests PASS in 7 files; complete 187/187 tests PASS in 37 files. The one added regression exercises the actual job lifecycle with only Chromium mocked, asserts the 90 s readiness budget and unchanged 60 s navigation, then verifies controlled error/cleanup without capturing frames or launching FFmpeg. Existing test-timeout settings, assertions and mechanical validators were unchanged. Earlier 38/186 test results and logs are preserved as history.\n\n${overlapWarning}`);
add(25,'Mechanical and native validation',{mechanicalGateResults:gateResults,presentation:props.valid,microAggregate:retainedFailures.nativeMicroAggregate,seek:retainedFailures.wholeSceneStrict},[absolute(validationFile('approved-mechanical-gates/validation-results.json')),absolute(validationFile('polish02b-presentation/presentation-fit.json')),absolute(validationFile('micro-native/micro-validation.json')),absolute('whole-scene-seek-verification.json'),absolute('whole-scene-supplementary-verification.json'),absolute('720p-infrastructure-preservation.json')],`15/15 unchanged mechanical gates PASS, including B8, pivots/bearings/pistons, folding legs, collision/path/access, seek/reset. Polish 02B presentation checker PASS.\n\n${nativeMicroText}\n\n${seekText}\n\nPost-infrastructure 720p preservation: 12/12 fresh PNG byte-identical. 11 timestamps are exactly equal; B8 timestamp roundoff ${preservation.points.find(item=>!item.timestampExactlyEqual)?.timeDifference ?? 0} s lies in the same hold. This is not claimed as 12 exact timestamps.`);
add(26,'Typecheck/lint/production build',{commands:commandRecords,buildAttempts,attemptOverlap:retainedFailures.validationAttemptOverlap},[validationPath,absolute(validationFile('typecheck.log')),absolute(validationFile('lint.log')),absolute(validationFile('build-webpack.log')),absolute('post-infrastructure-validation/build.log'),absolute('post-infrastructure-validation/build-retry-01.log'),absolute('post-infrastructure-validation/props.log')],`Post-startup-fix typecheck PASS, lint PASS, production build PASS using explicit Next webpack backend. Two earlier default Turbopack attempts exited 137; their failed logs remain under post-infrastructure-validation, not the new validation directory. No build config/package alteration was used to change the backend; CLI backend selection only. The earlier props evidence-directory ENOENT is also retained, followed by its unchanged successful retry.\n\n${overlapWarning}`);
add(27,'Browser/WebGL limitations',{surfaces:nativePaths.map(item=>({profile:item.id,...item.surface})),networkWarnings:native.warnings,interactiveAutomation:retainedFailures.interactiveBrowserAutomation},[absolute('native-resolution-qa/native-verification.json'),absolute('web-qa/after/web-qa-error.json'),absolute('web-qa/profile-selection-diagnostic-01/diagnostic.json'),absolute('web-qa/profile-selection-diagnostic-headed-01/diagnostic.json')],`Actual Chromium/WebGL supported all four native sizes; sampled maxTextureSize/maxRenderbufferSize: ${Math.min(...nativePaths.map(item=>item.surface?.maxTextureSize ?? Infinity))}. Canvas, drawing buffer and PNG sizes matched. Context/capability/size failures are explicit, no lower-resolution fallback. These are observed machine-specific limits, not a guarantee for other GPUs/browsers. Three Clock/CommonJS deprecations and observed optional favicon 404 remain reported; no unexplained fatal browser/page errors are waived.\n\n${interactiveBrowserText}`);
add(28,'Memory/performance observations',{incrementalFrames:true,streamedDownload:true,wholeVideoFrameBuffer:false,rssMeasured:false,captureCounts:elapsedProfileCapture},[],`Frames are captured/written one at a time; no whole-video PNG sequence held in RAM. Completed MP4 download streams from disk. Browser/encoder resources close on completion/failure/cancel; profile/job isolation protects unrelated outputs. 4K is heavier; only 60 proof frames per profile were encoded. No quantitative peak RSS claim is made because peak RSS was not measured. Turbopack exit 137 is retained as a build/runtime warning, not conclusively attributed to memory without evidence.`);
add(29,'No full 1080p render',{confirmed:true},[absolute('native-resolution-qa/native-verification.json')],'Confirmed: no full 1080p timeline rendered. Only native still checkpoints and a 2-second proof.');
add(30,'No full 1440p render',{confirmed:true},[absolute('native-resolution-qa/native-verification.json')],'Confirmed: no full 1440p timeline rendered. Only native still checkpoints and a 2-second proof.');
add(31,'No full 2160p render',{confirmed:true},[absolute('native-resolution-qa/native-verification.json')],'Confirmed: no full 2160p timeline rendered. Only native still checkpoints and a 2-second proof.');
add(32,'No audio',{masterAudioStreams:technical.audioStreams,proofAudioStreams:proofSummary.map(item=>({profile:item.profile,audioStreams:item.audioStreams})),musicAdded:false,sfxAdded:false},[absolute('technical-verification.json'),absolute('native-resolution-qa/native-verification.json')],noHighResText);

const report={
  deliveryComplete:true,reviewReady:true,directorApprovalClaimed:false,allNativeValidatorsPass:false,
  candidate:technical.candidate,generatedAt:new Date().toISOString(),deliveryItems:items.map(({markdown,...item})=>item),
  summary:{master:technical.output,duration:technical.encodedDuration,frames:technical.frameCount,bytes:technical.fileSizeBytes,sha256:technical.sha256,
    profilesBefore:oldIds,profilesAfter:profileSummary.map(item=>item.id),defaultUnchanged:true,profileTestCount:39,testCount:187,testFiles:37,
    nativeProfileCount:4,nativeStillCount:48,nativeProofCount:4,webActualExportProof:true,rawWebAggregatePass:false,reviewedWebNetworkPass:true,productSourceUnchanged:true},
  manualVisualQa:{path:absolute(visualPath),...visual},retainedFailures,
  evidence:{technical:absolute('technical-verification.json'),sources:absolute(sourceReportFile),previousSourceAudit:absolute('source-boundaries-final.json'),native:absolute('native-resolution-qa/native-verification.json'),web:absolute(webReportFile),webReviewed:absolute(webReviewFile),webNetworkSupplement:absolute(networkSupplementFile),validation:validationPath,manualVisualQa:absolute(visualPath)},
  stopBoundary:'STOP after review render/web QA/native profile delivery. No further creative/mechanical/Option 2/audio/high-resolution-full-video work; await director review.',
};
const markdown=`# WF311613 — Final review render and actual-web/native-resolution QA\n\nReview delivery complete. **Not director approval.**\n\nFull master: ${technical.encodedDuration.toFixed(6)} s (${Math.floor(technical.encodedDuration/60)}:${(technical.encodedDuration%60).toFixed(3).padStart(6,'0')}), 1280×720 / 30 fps CFR, H.264/yuv420p, silent.\n\nImportant retained exceptions: historical native micro aggregate FAIL due two newly authorized generic byte deltas; original strict camera JSON replay FAIL due five 1 ULP scalar representations; two default Turbopack build attempts exited 137 before successful webpack build. The raw scripted web aggregate remains FAIL (34/35), while a separate strict SHA-bound network review is PASS for the one proven completed-download navigation abort. Raw results are not concealed, waived or renamed PASS. Independent 15 mechanical gates, protected data/source identity, actual raster/native/UI functionality and encode evidence pass.\n\n${items.map(item=>`## ${item.id}. ${item.title}\n\n${item.markdown}\n\n${item.evidence?.length ? `Evidence:\n\n${item.evidence.map(value=>`- ${value}`).join('\n')}\n` : ''}`).join('\n')}\n## Stop boundary\n\n${report.stopBoundary}\n`;
await fs.writeFile(outputJson,`${JSON.stringify(report,null,2)}\n`,{flag:'wx'});
await fs.writeFile(outputMd,markdown,{flag:'wx'});
console.log(JSON.stringify({deliveryComplete:true,directorApprovalClaimed:false,allNativeValidatorsPass:false,outputJson,outputMd,master:technical.output,items:items.length,retainedFailures:['historical micro aggregate byte lock','original strict camera JSON replay','two default Turbopack 137 attempts']},null,2));
