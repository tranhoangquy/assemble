# Steps 1–3: faster hardware and physical mating V2

User requested a further increase in screw/bolt turning and part assembly speed. This revision changes only the product pacing profile and associated tests/export filename. No new assembly steps, camera/material/geometry/path changes or engine architecture changes.

| Step | Previous action-speed review | V2 timeline seconds |
| --- | ---: | ---: |
| 1 | 52.999 | 40.897333 |
| 2 | 32.539333 | 25.646722 |
| 3 | 40.298333 | 31.722222 |
| Total | 125.836667 | 98.266278 |

Timing in `director/actionPacing.ts`:

- First dowel/cam/bolt: 1.55/1.05/1.60 s, previously 2.10/1.35/2.40 s.
- Repeated hardware cap: .54 × original operation duration, previously .72; second/later hierarchy remains 1.3×/1.8× instructional speed.
- First/repeat hold: .10/.06 s, previously .14/.08 s.
- Final tighten/cam lock: .40 × original operation time, previously .55. Rotation count and feed distance unchanged.
- Part assembly motion: .65 × original operation time for INSERT_PART/ALIGN_CONNECTION shots with physical motion. Relative offsets/durations are scaled together across the complete operation, including carried dowels and all members of a moving cabinet side. Original approach/alignment/final-seat path proportions remain intact. Post-assembly hold .12 s.
- Context, target explanation, verification, camera presets and camera cut order unchanged.
- All six Step 3 bolts still start before final tightening. No hardware pop-in introduced.

Existing V1 MP4 is retained. V2 output is `output/wf311613-standalone-murphy-bed/reviews/steps-01-03/wf311613-steps-01-03-action-speed-review-v2.mp4`, 1280×720, 30 fps. Render is the real deterministic timeline, not a speed-adjusted V1 video. This is for review and does not claim director approval.

Export completed: 2,948 frames, 98.266667 s. Typecheck, lint, production build and all 43 tests passed. Assembly validation: 72 operations, zero errors/warnings. Checked macro bolt, frame-first-side and second-side closure render checkpoints. Tests verify carried dowels remain rigid with the faster frame at multiple points in the insertion path, and the final physical state matches the original plan.
