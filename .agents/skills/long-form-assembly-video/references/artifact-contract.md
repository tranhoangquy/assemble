# Artifact and evidence contract
Use existing repository formats; names below are conceptual, not a demand for duplicated JSON beside typed data. Every revision records product/revision ID, status, evidence paths, source fingerprint and responsible reviewer. Paths must resolve; report counts with their units (features, families, meshes or frames).

| Phases | Required artifacts |
|---|---|
| 0 | Product Brief; Source Authority Manifest, scope/variant decisions, source files and inference ledger |
| 1 | Parts/hardware inventory with quantities, source page/step references; mechanisms/support requirements |
| 2–4 | Product data, assembly graph/data, dependency/path/state definitions, mechanical validation report with coverage/error taxonomy |
| 5–9 | DirectorPlan, camera plan, timing report with operation durations/global boundaries, intro reset and presentation ownership |
| 10 | Fit/hole feature ledger, classification/counts, step/time/view coverage, stills/contact sheets, regressions and visual observations |
| 11 | Freeze manifest: relevant file and evaluated-data hashes, render profile, gate results, expected frame count and revision identity |
| 12–13 | Frame/checkpoint manifest, silent native visual master, visual QA report, targeted clips/stills and explicit director decision |
| 14–15 | Music provenance/source hashes/credits, analysis and edit plan, lossless audio master, full compressed preview, intro/transition/ending clips, numeric QA, listening evidence and director decision |
| 16 | Final master, final QA, input/output hashes, ordered stream identity evidence, full decode/audio/container reports and SHA256 manifest |
| 17, if requested | Release metadata and final director decision; no automatic upload |

Inventory row: source ID, runtime ID, description, quantity, units/dimensions, evidence, inferred fields, variant applicability. Graph operation: prerequisites, active parts/hardware, path, expected contacts, support/access requirements, resulting states. Camera/timing row: operation ID, teach/repeat/mechanism intent, start/end, view/target/axis, hold and occlusion evidence.

Evidence statuses: PASS (actual check succeeded), FAIL (actual check failed), WARNING (non-blocking limitation with rationale), NOT RUN (not performed), REQUIRES DIRECTOR REVIEW (perceptual/creative decision pending). Inapplicable checks use NOT RUN plus explicit not-applicable rationale; do not invent PASS. Required applicable gates must PASS before dependent production. Technical and director status are distinct fields.

Retain original logs and failures; an approved revised fingerprint or successful retry gets a new result and does not erase the raw prior outcome. Record command/tool versions, parameters, time, expected/actual values and limitations. Hash authoritative originals and production copies. Approvals bind to artifact hashes, revision, scope and exact director evidence.
