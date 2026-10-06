# STOP gates
Stop dependent work, preserve evidence and state the remedy. Continue independent authorized preparation when possible; do not proceed through approval merely because time passed.

| Gate | Trigger | Required resolution |
|---|---|---|
| SOURCE_SCOPE_REQUIRED | Major product/variant/manual scope missing | Director supplies scope decision |
| SOURCE_CONFLICT | Authoritative sources disagree on important assembly truth | Document conflict and obtain authority resolution |
| MECHANICAL_P0 | Known blocking mechanical issue | Correct evidenced defect; rerun affected and required regression gates |
| FIT_AUDIT_FAILED | Unexplained seating/gap/overlap/support defect | Evidence-based repair and fit/mechanical regressions |
| HOLE_AUDIT_FAILED | Unjustified/incorrect/duplicate/artifact visible features | Classify and correct; repeat coverage and regressions |
| PRE_RENDER_REGRESSION_FAILED | Required applicable pre-render check fails, including timeout | Report raw failure; diagnose/retry within authorized bounds; all required checks PASS |
| VISUAL_DIRECTOR_APPROVAL_REQUIRED | Silent master not explicitly approved | Return full master/stills/clips; director decision tied to hash |
| MUSIC_LICENSE_REVIEW_REQUIRED | Rights/provenance insufficient for intended use | Obtain reliable evidence or director-selected properly licensed replacement |
| OFFICIAL_AUDIO_ASSET_REQUIRED | Required approved production asset not actually acquired/verified | Obtain required official asset or explicitly director-supplied authorized local file; supplied asset does not itself prove license |
| AUDIO_DIRECTOR_APPROVAL_REQUIRED | Full soundtrack listening approval missing | Return full preview, transitions, intro/ending and limitations; director approval tied to hash |
| RENDER_RESOURCE_LIMIT | Native target-resolution resources unstable/inadequate | Preserve completed frames; defer or use explicitly authorized stronger hardware/profile; never disguise upscale |
| RENDER_CHECKPOINT_INCOMPATIBLE | Job creative/product/profile/FPS identity differs or manifest is untrusted | Preserve old work; create a fresh compatible job, never merge revisions |
| FRAME_VALIDATION_FAILED | PNG integrity/dimensions/checksum/count/continuity gate fails | Resume compatible job and repair missing/invalid frames; no encode until exact valid sequence |
| ENCODE_FAILED | Final encode/mux times out or fails | Preserve validated frames and locked audio; bounded/manual resume, no creative changes |
| FINAL_QA_FAILED | Identity, decode, timing, audio, container or final approval requirements fail | Preserve locked inputs; repair only authorized packaging issue and rerun relevant final QA |

Voice capability absent: `VOICE_CONTENT_REQUIRES_DIRECTOR_LISTENING`. Metadata voice tags neither prove audible vocals nor justify rejection by themselves. A transition selection approves that transition only, not the complete soundtrack. Final creative approval cannot be inferred from visual/audio approval or technical metrics.
