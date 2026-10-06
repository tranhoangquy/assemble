// Artifact report only. Does not execute tests, gates, build or rendering.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),parent=path.dirname(dir);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const optional=p=>fs.existsSync(path.join(dir,p))?read(path.join(dir,p)):null;
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const ledger=read(path.join(dir,'execution-order.json'));
if(ledger.commands.some(r=>r.status==='RUNNING'))throw new Error('Sequential retry is still running');
const before=optional('identity-before.json'),after=optional('identity-after.json');
const mechanical=optional('approved-mechanical-gates/validation-results.json'),micro=optional('micro-native/micro-validation.json'),props=optional('polish02b-presentation/presentation-fit.json'),tests=optional('tests-results.json');
const frozen=read(path.join(parent,'frozen-source-hashes.json')),history=read(path.join(parent,'preserved-history-hashes.json'));
const changed=m=>Object.entries(m.hashes).filter(([p,h])=>!fs.existsSync(p)||hash(p)!==h).map(([p])=>p);
const walk=r=>fs.existsSync(r)?fs.readdirSync(r,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(r,d.name)):d.isFile()?[path.join(r,d.name)]:[]):[];
const source=[...walk('src'),...walk('scripts'),...walk('public'),...['package.json','package-lock.json','tsconfig.json','next.config.ts','eslint.config.mjs','next-env.d.ts','AGENTS.md'].filter(p=>fs.existsSync(p))].sort();
const oldHistory=[...walk('output/wf311613-standalone-murphy-bed/reviews/final-micro-pass'),...walk('output/wf311613-standalone-murphy-bed/reviews/director-polish-02b'),...walk('output/wf311613-standalone-murphy-bed/reviews/director-polish-02'), 'output/wf311613-standalone-murphy-bed/final/wf311613-polish-02b-visual-master-720p.mp4'].sort();
const fileSetDeltas=(actual,expected)=>({added:actual.filter(p=>!expected.includes(p)),removed:expected.filter(p=>!actual.includes(p))});
const sourceChanges=changed(frozen),historyChanges=changed(history),fileSets={source:fileSetDeltas(source,Object.keys(frozen.hashes)),history:fileSetDeltas(oldHistory,Object.keys(history.hashes))};
const testTitles=['passes the existing assembly validator with all 355 operations','clears actual solid meshes along every new structural path and large carrier sweep'];
const timeoutTests=testTitles.map((title,i)=>{
  const file=tests?.testResults?.find(f=>f.name.endsWith('/steps11-20.test.ts'));
  const t=file?.assertionResults?.find(t=>t.title===title);
  return {title,existingTimeoutMs:i?60000:5000,previousMeasuredMs:i?66360:27424,status:t?.status??'NOT RECORDED',measuredMs:t?.duration??null,failureMessages:t?.failureMessages??[]};
});
const noOverlap=ledger.commands.every((r,i)=>!i||Date.parse(r.startedAt)>=Date.parse(ledger.commands[i-1].endedAt));
const unchangedSources=!sourceChanges.length&&!fileSets.source.added.length&&!fileSets.source.removed.length;
const unchangedHistory=!historyChanges.length&&!fileSets.history.added.length&&!fileSets.history.removed.length;
const configUnchanged=before&&hash('vitest.config.mts')===before.extraEvidence.vitestConfigSha256;
const renderState={frameDirectories:fs.readdirSync('output/wf311613-standalone-murphy-bed/frames').sort(),newMasterExists:fs.existsSync('output/wf311613-standalone-murphy-bed/final/wf311613-final-micro-pass-visual-master-720p.mp4')};
const noRender=before&&JSON.stringify(renderState)===JSON.stringify(before.renderState)&&!renderState.newMasterExists;
const mechanicalNames=['locks','assembly','structuralPaths','groundedFloor','frontStaging','mechanics','hardware','step28','foldingLegs','receiverPaths','pistons','seekReset','b8','presentationFit','captions'];
const results={sourceDataIdentity:!!before?.valid,mechanicalGates:!!mechanical?.valid&&!!mechanical?.complete&&mechanicalNames.every(n=>mechanical[n]?.valid),finalMicroValidation:!!micro?.valid,presentationChecker:!!props?.valid,
  typecheck:ledger.commands.find(r=>r.name==='5 typecheck')?.status==='PASS',lint:ledger.commands.find(r=>r.name==='6 application-source lint')?.status==='PASS',
  fullTests:tests?.numTotalTests===148&&tests?.numPassedTests===148&&tests?.numFailedTests===0&&timeoutTests.every(t=>t.status==='passed'),
  productionBuild:ledger.commands.find(r=>r.name==='8 production build')?.status==='PASS',sourceAfter:unchangedSources,historyAfter:unchangedHistory,vitestConfigUnchanged:!!configUnchanged,noRenderOutput:!!noRender,sequentialNoOverlap:noOverlap};
const logs=ledger.commands.map(r=>({check:r.name,path:r.log}));
const warnings=[...new Set(ledger.commands.flatMap(r=>fs.readFileSync(r.log,'utf8').split(/\r?\n/).filter(l=>/DeprecationWarning|Turbopack build encountered|Warning: The file pattern/.test(l))))];
const interpretation=results.fullTests?'Both previously failing tests passed unchanged under sequential job load. Prior timeouts are consistent with resource contention, which is the likely explanation; this does not prove causation.':'The clean result was not obtained. STOP remains in effect; no render is authorized.';
const report={candidate:'wf311613-final-micro-pass',retry:1,valid:ledger.valid===true&&Object.values(results).every(Boolean),results,executionOrder:ledger.commands,
  tests:tests?{total:tests.numTotalTests,passed:tests.numPassedTests,failed:tests.numFailedTests,files:tests.testResults.length,suites:tests.numTotalTestSuites}:null,previousTimeoutTests:timeoutTests,
  mechanicalGateResults:mechanicalNames.map(n=>({name:n,valid:mechanical?.[n]?.valid??false,errors:mechanical?.[n]?.errors??[]})),presentationResult:props,
  identity:before?.hashes,introUnchanged:before?.checks.introIdentity,step26CameraUnchanged:before?.checks.step26Camera,
  sourceAudit:{sourceFiles:source.length,historyFiles:oldHistory.length,changedSources:sourceChanges,changedHistory:historyChanges,fileSets,testConfigUnchanged:!!configUnchanged,postIdentity:after?.valid??null},
  orchestration:{newEvidenceDirectories:['approved-mechanical-gates','micro-native','polish02b-presentation'].map(n=>path.join(dir,n)),presentationDirectoryCreatedBeforeChecker:true,checkerSourceUnchanged:unchangedSources,gateRedirectionRunnerByteIdentical:before?.checks.gateRunnerUnchanged,
    reportersOnly:'Default + JSON reporters were selected solely to record per-test duration. No timeout, pool, workers, scheduling, assertion, sample count or build config overrides used.'},
  interpretation,warnings,logs,noFullFramesOrMasterRendered:!!noRender,testTimeoutsUnchanged:unchangedSources&&!!configUnchanged,validatorThresholdsUnchanged:unchangedSources,
  stopBoundary:'Sequential pre-render report only. Await new authorization before rendering the full master.',reportedAt:new Date().toISOString()};
if(fs.existsSync(path.join(dir,'sequential-report.json')))throw new Error('Refusing to overwrite retry report');
fs.writeFileSync(path.join(dir,'sequential-report.json'),JSON.stringify(report,null,2));
const lines=[
  '# Final micro-pass — controlled sequential pre-render retry',
  '',
  `Candidate: \`wf311613-final-micro-pass\`. Overall: **${report.valid?'PASS':'FAIL — STOP'}**. One retry; no candidate repair.`,
  '',
  '## 1–2. Exact execution order and results',
  '',
  '| Order/check | Result | Execution time | Log |',
  '|---|---|---:|---|',
  ...ledger.commands.map(r=>`| ${r.name} | ${r.status} | ${(r.elapsedMs/1000).toFixed(3)} s | [${path.basename(r.log)}](${path.basename(r.log)}) |`),
  '',
  `All commands were awaited before starting the next. No heavy validation/test/build jobs overlapped: **${noOverlap?'PASS':'FAIL'}**. Actual commands and ISO start/end/exit records are in [execution-order.json](execution-order.json).`,
  '',
  '## 3–4. Complete test result and previous timeout cases',
  '',
  tests?`${tests.numPassedTests}/${tests.numTotalTests} PASS; ${tests.numFailedTests} FAIL across ${tests.testResults.length} files (${tests.numTotalTestSuites} suites).`:'Test suite results were not produced.',
  '',
  '| Test in steps11-20.test.ts | Unchanged timeout | Previous duration | This run duration | Result |',
  '|---|---:|---:|---:|---|',
  ...timeoutTests.map(t=>`| ${t.title} | ${t.existingTimeoutMs} ms | ${t.previousMeasuredMs} ms | ${t.measuredMs===null?'not recorded':t.measuredMs.toFixed(3)+' ms'} | ${t.status.toUpperCase()} |`),
  '',
  interpretation,
  '',
  'The same full `npm run test` suite/config was used. Only console/default + JSON reporting arguments were added to record exact per-test milliseconds. No timeout/assertion/sample/scheduling/worker changes. See [tests-results.json](tests-results.json).',
  '',
  '## 5–6. Presentation checker and filesystem-only preparation',
  '',
  `Polish 02B presentation checker: **${results.presentationChecker?'PASS':'FAIL / not completed'}**. The previously missing new evidence directory was created before invoking the byte-unchanged checker. This was only orchestration/filesystem preparation; no checker/product/presentation logic changed. [Presentation-fit result](polish02b-presentation/presentation-fit.json).`,
  '',
  '## 7–9. Freeze, timeouts and thresholds',
  '',
  `- ${source.length} frozen source/config/asset files remain byte-identical: ${unchangedSources?'PASS':'FAIL'}. No source additions/removals.`,
  `- Vitest config tracked separately before/after and remains byte-identical: ${configUnchanged?'PASS':'FAIL'}.`,
  `- ${oldHistory.length} historical QA/master files and file sets remain unchanged: ${unchangedHistory?'PASS':'FAIL'}.`,
  `- Approved product/material/AssemblyDefinition/DirectorPlan/micro video hashes, exact 5.000 s intro, and corrected Step 26 preset match saved approval: ${before?.valid?'PASS':'FAIL'}.`,
  `- Source, geometry, cameras, assembly/actions/timings, test assertions/timeouts and validator thresholds were not modified: ${report.testTimeoutsUnchanged&&report.validatorThresholdsUnchanged?'PASS':'FAIL'}.`,
  '',
  '[Identity before](identity-before.json) · [Identity after](identity-after.json) · [Machine-readable full report](sequential-report.json).',
  '',
  'All native mechanical gate results:',
  '',
  ...report.mechanicalGateResults.map(g=>`- ${g.name}: ${g.valid?'PASS':'FAIL / not completed'}.`),
  '',
  '[Mechanical rerun evidence](approved-mechanical-gates/validation-results.json) · [Native micro-pass evidence](micro-native/micro-validation.json).',
  '',
  '## 10. No rendering',
  '',
  `No renderer was invoked, no frame directory was added and no full master was created: **${noRender?'PASS':'FAIL'}**. No audio, 2K/4K or Option 2 work.`,
  '',
  '## 11. Warnings',
  '',
  ...(warnings.length?warnings.map(w=>'- '+w):['No warnings recorded.']),
  '',
  '**STOP:** sequential verification report only. Await director authorization before the full render.'
];
fs.writeFileSync(path.join(dir,'SEQUENTIAL-PRE-RENDER-REPORT.md'),lines.join('\n')+'\n');
console.log(JSON.stringify({valid:report.valid,results,tests:report.tests,previousTimeoutTests:timeoutTests,report:path.join(dir,'SEQUENTIAL-PRE-RENDER-REPORT.md')},null,2));
if(!report.valid)process.exitCode=1;
