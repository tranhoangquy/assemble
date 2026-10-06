# Final micro-pass — controlled sequential pre-render retry

Candidate: `wf311613-final-micro-pass`. Overall: **PASS**. One retry; no candidate repair.

## 1–2. Exact execution order and results

| Order/check | Result | Execution time | Log |
|---|---|---:|---|
| 1 frozen source/data identity | PASS | 0.262 s | [identity.log](identity.log) |
| 2 native approved mechanical gates | PASS | 342.483 s | [gates.log](gates.log) |
| 3 native final-micro-pass validation | PASS | 13.381 s | [micro-native.log](micro-native.log) |
| 4 Polish 02B presentation checker | PASS | 14.103 s | [props.log](props.log) |
| 5 typecheck | PASS | 1.683 s | [typecheck.log](typecheck.log) |
| 6 application-source lint | PASS | 3.489 s | [lint.log](lint.log) |
| 7 complete test suite | PASS | 70.805 s | [tests.log](tests.log) |
| 8 production build | PASS | 113.249 s | [build.log](build.log) |
| post-run byte/history identity | PASS | 0.379 s | [identity-after.log](identity-after.log) |

All commands were awaited before starting the next. No heavy validation/test/build jobs overlapped: **PASS**. Actual commands and ISO start/end/exit records are in [execution-order.json](execution-order.json).

## 3–4. Complete test result and previous timeout cases

148/148 PASS; 0 FAIL across 30 files (59 suites).

| Test in steps11-20.test.ts | Unchanged timeout | Previous duration | This run duration | Result |
|---|---:|---:|---:|---|
| passes the existing assembly validator with all 355 operations | 5000 ms | 27424 ms | 3182.310 ms | PASSED |
| clears actual solid meshes along every new structural path and large carrier sweep | 60000 ms | 66360 ms | 33590.050 ms | PASSED |

Both previously failing tests passed unchanged under sequential job load. Prior timeouts are consistent with resource contention, which is the likely explanation; this does not prove causation.

The same full `npm run test` suite/config was used. Only console/default + JSON reporting arguments were added to record exact per-test milliseconds. No timeout/assertion/sample/scheduling/worker changes. See [tests-results.json](tests-results.json).

## 5–6. Presentation checker and filesystem-only preparation

Polish 02B presentation checker: **PASS**. The previously missing new evidence directory was created before invoking the byte-unchanged checker. This was only orchestration/filesystem preparation; no checker/product/presentation logic changed. [Presentation-fit result](polish02b-presentation/presentation-fit.json).

## 7–9. Freeze, timeouts and thresholds

- 214 frozen source/config/asset files remain byte-identical: PASS. No source additions/removals.
- Vitest config tracked separately before/after and remains byte-identical: PASS.
- 126 historical QA/master files and file sets remain unchanged: PASS.
- Approved product/material/AssemblyDefinition/DirectorPlan/micro video hashes, exact 5.000 s intro, and corrected Step 26 preset match saved approval: PASS.
- Source, geometry, cameras, assembly/actions/timings, test assertions/timeouts and validator thresholds were not modified: PASS.

[Identity before](identity-before.json) · [Identity after](identity-after.json) · [Machine-readable full report](sequential-report.json).

All native mechanical gate results:

- locks: PASS.
- assembly: PASS.
- structuralPaths: PASS.
- groundedFloor: PASS.
- frontStaging: PASS.
- mechanics: PASS.
- hardware: PASS.
- step28: PASS.
- foldingLegs: PASS.
- receiverPaths: PASS.
- pistons: PASS.
- seekReset: PASS.
- b8: PASS.
- presentationFit: PASS.
- captions: PASS.

[Mechanical rerun evidence](approved-mechanical-gates/validation-results.json) · [Native micro-pass evidence](micro-native/micro-validation.json).

## 10. No rendering

No renderer was invoked, no frame directory was added and no full master was created: **PASS**. No audio, 2K/4K or Option 2 work.

## 11. Warnings

- (node:84212) [THREE_CJS_DEPRECATED] DeprecationWarning: `require("three")` is deprecated and will be removed.
- (node:84214) [THREE_CJS_DEPRECATED] DeprecationWarning: `require("three")` is deprecated and will be removed.
- (node:86300) [THREE_CJS_DEPRECATED] DeprecationWarning: `require("three")` is deprecated and will be removed.
- (node:86390) [THREE_CJS_DEPRECATED] DeprecationWarning: `require("three")` is deprecated and will be removed.
- (node:86584) [THREE_CJS_DEPRECATED] DeprecationWarning: `require("three")` is deprecated and will be removed.
- (node:86583) [THREE_CJS_DEPRECATED] DeprecationWarning: `require("three")` is deprecated and will be removed.
- (node:86587) [THREE_CJS_DEPRECATED] DeprecationWarning: `require("three")` is deprecated and will be removed.
- (node:86590) [THREE_CJS_DEPRECATED] DeprecationWarning: `require("three")` is deprecated and will be removed.
- (node:86585) [THREE_CJS_DEPRECATED] DeprecationWarning: `require("three")` is deprecated and will be removed.
- (node:86586) [THREE_CJS_DEPRECATED] DeprecationWarning: `require("three")` is deprecated and will be removed.
- (node:86607) [THREE_CJS_DEPRECATED] DeprecationWarning: `require("three")` is deprecated and will be removed.
- Turbopack build encountered 1 warning:
- Warning: The file pattern (<dynamic> '/frames' | <dynamic> 'frames') matches 72856 files in [project]/
- (node:87740) [THREE_CJS_DEPRECATED] DeprecationWarning: `require("three")` is deprecated and will be removed.

**STOP:** sequential verification report only. Await director authorization before the full render.
