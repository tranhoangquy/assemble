# Final micro-pass export — stopped before rendering

Candidate: `wf311613-final-micro-pass`.

The requested STOP condition was triggered: the full regression run returned **146 PASS / 2 FAIL**, out of 148 tests. No new full master or full fresh frame sequence was rendered. No candidate source or validator threshold was changed.

## Failed pre-render checks

Both failures are in `src/products/wf311613-standalone-murphy-bed/tests/steps11-20.test.ts`:

- `passes the existing assembly validator with all 355 operations`: existing 5,000 ms test timeout, measured 27,424 ms in this run.
- `clears actual solid meshes along every new structural path and large carrier sweep`: existing 60,000 ms test timeout, measured 66,360 ms in this run.

These are timeout failures, not reported geometry/connection assertions. Heavy build, native gate and test jobs ran concurrently; resource contention is a possible explanation, not an established diagnosis. Timeouts were not increased and tests were not changed or rerun after this STOP condition.

The additional unchanged Polish 02B presentation checker encountered an artifact-report write failure (`ENOENT`) because the new redirected `polish02b-presentation` output directory did not exist. This concerns the new history-preserving orchestration, not an approved candidate geometry change. It was not silently repaired/rerun. See `props.log`.

## Completed results

- Approved data identity: PASS; product/material/AssemblyDefinition/DirectorPlan/micro video hashes match the reviewed QA exactly.
- Approved intro: exactly 1.250 + 2.500 + 0.875 + 0.375 = 5.000 seconds; unchanged.
- Approved Step 26 camera: position [-114.3,116,17], target [-115.3,111,7], FOV 62; unchanged.
- Native approved mechanical suite: all 15 gates PASS, complete. Includes structural paths, floor, Step 25, mechanisms, hardware, Step 28, folding legs, receiver paths, pistons, seek/reset, B8, presentation fit and captions.
- Native micro-pass validation: PASS; intro determinism/reset, unchanged actions, camera access/framing, exploded paths and data locks.
- Typecheck: PASS.
- Application-source lint: PASS using the previously approved `npm run lint -- --ignore-pattern 'output/**'`. Historical generated output helpers excluded; no lint rules/configuration modified.
- Production build: PASS.
- Whole-scene browser verification, final render and post-render decode/black-frame checks: NOT STARTED because pre-render tests failed.

214 frozen source/config/asset files and 126 historical QA/master files remain unchanged after the checks. The previous Polish 02B master, micro-pass QA, intro clip and all historical reports remain intact.

## Evidence

- [Tests](tests.log)
- [Approved mechanical gate rerun](approved-mechanical-gates/validation-results.json)
- [Native micro-pass rerun](micro-native/micro-validation.json)
- [Presentation checker artifact error](props.log)
- [Frozen identity](pre-render-identity.json)
- [Source manifest](frozen-source-hashes.json)
- [Preserved history manifest](preserved-history-hashes.json)

Recommended next authorization: rerun the SAME checks sequentially, with existing timeouts/thresholds and candidate unchanged, and create the missing new evidence subdirectory before the presentation checker. Do not render until all required checks PASS.
