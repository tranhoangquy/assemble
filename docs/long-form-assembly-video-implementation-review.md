# Long-form assembly video v1.0 — implementation and dry-run review
Date: 2026-10-05
Status: DOCUMENTATION PACKAGE COMPLETE; returned for director review.

## Integration and responsibilities
Repository root is `/Users/quyth/development/three/POC`. Inspection found root AGENTS.md (Next-generated block) and CLAUDE.md routing to it; no pre-existing rule/skill convention or .codex/.agents infrastructure. docs/ was empty. Product packages already separate product/assembly/director under src/products; generic engine and Vitest/product validators exist.

Rule: [rules/long-form-assembly-video.md](../rules/long-form-assembly-video.md) is concise normative repository-wide v1.0 requirements. Skill: [.agents/skills/long-form-assembly-video/SKILL.md](../.agents/skills/long-form-assembly-video/SKILL.md) supplies operational phases, recipes, artifacts, STOP gates and review boundaries, referencing rather than duplicating the rule. Root [AGENTS.md](../AGENTS.md) adds one routing paragraph outside the unchanged Next-generated block. CLAUDE.md/README/runtime configuration are unchanged.

Native repository skill discovery uses .agents/skills; explicit path routing works even before a new session discovers `$long-form-assembly-video`. No global skill install, dynamic catalog registration, agents/openai.yaml metadata or engine registration was needed. Sandbox-protected .agents writes completed with tool escalation; no user approval interruption or unresolved permission block remains.

## Validation
- Bundled quick_validate.py: PASS with existing system python3/PyYAML. Initial bundled-runtime attempt could not import yaml; no dependency installation or substituted validator occurred.
- 31 relative links resolve; four JSON templates parse; frontmatter/name/description valid. 10 templates, 11 checklists, five references, one SKILL.md.
- Generic core contains no historical product identifier/hash/path/dimension/camera/music filename. Repository adapter describes existing architecture, while this report alone contains historical validation references.
- Three locked master files rehashed against known approved values: PASS; see [validation evidence](long-form-assembly-video-validation.json).
- Test/lint/build: NOT RUN, not required for Markdown/JSON documentation and routing only. No runtime code, package registration, rendering, audio or engine behavior was modified. No product creation or upload.
- Independent-agent behavioral testing: NOT RUN; no delegation requested. The review below is a documentary dry-run, not a rerun of historical mechanical/visual/listening gates and not new director approval.

## Historical dry-run
Each row asks whether the generic package would require the relevant proven gate, not whether historical production now passes it.

| Lesson | Generic decision required | Read-only historical evidence | Dry-run |
|---|---|---|---|
| PDF/source authority | Source ranking and inference ledger; Phases 0–1 stop unresolved scope/conflict | [b8-closed-face-checkpoint.md](../src/products/wf311613-standalone-murphy-bed/references/b8-closed-face-checkpoint.md) | PASS |
| Assembly graph | Graph is mechanical authority; Phases 3–4 dependency/closure/path gates | [validate-assembly.ts](../scripts/validate-assembly.ts) | PASS |
| Mechanical validation | Actual-contact/path/support/pivot/tool-access checks; P0 STOP | [final-pass-blocked-checkpoint.md](../src/products/wf311613-standalone-murphy-bed/references/final-pass-blocked-checkpoint.md) | PASS |
| Panel fit investigation | Phase 10 source-backed fit ledger and proven repair/regression; no cosmetic fillers | [b8-closed-face-checkpoint.md](../src/products/wf311613-standalone-murphy-bed/references/b8-closed-face-checkpoint.md) | PASS |
| Hole/hardware audit | Feature classes, blind/opposite-mouth discipline, quantities, zero rejected classes | [DIRECTOR-REVIEW-REPORT.md](../output/wf311613-standalone-murphy-bed/final/product-fit-hole-audit/DIRECTOR-REVIEW-REPORT.md) | PASS |
| Camera occlusion correction | Phase 7 and camera checklist move view, never distort mechanical path | [steps01-10-paced-checkpoint.md](../src/products/wf311613-standalone-murphy-bed/references/steps01-10-paced-checkpoint.md) | PASS |
| Whole-product audit before render | Phase 10 all endpoints/intermediates and multi-angle visible evidence | [WHOLE-PRODUCT-VISUAL-AUDIT.md](../output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit/WHOLE-PRODUCT-VISUAL-AUDIT.md) | PASS |
| Deterministic rendering | Frame-index time, repeated/shuffled seek, native profile and freeze identity | [MASTER-DELIVERY-REPORT.md](../output/wf311613-standalone-murphy-bed/final/director-approved-full-720p-20261004/MASTER-DELIVERY-REPORT.md) | PASS |
| Visual master freeze | Phases 11–13 source hashes, silent master QA and explicit director visual decision | [MASTER-DELIVERY-REPORT.md](../output/wf311613-standalone-murphy-bed/final/director-approved-full-720p-20261004/MASTER-DELIVERY-REPORT.md) | PASS |
| Music provenance/acquisition | Intended-use license evidence, exact credits, authorized local file/hash gate | [ACQUISITION-GATE-REPORT.md](../output/wf311613-standalone-murphy-bed/final/lofi-music-pass01/ACQUISITION-GATE-REPORT.md) | PASS |
| Audio-only listening gate | WAV first; full preview/clips; metrics never assert actual listening or director approval | [MUSIC-PASS02-REPORT.md](../output/wf311613-standalone-murphy-bed/final/lofi-music-pass02/MUSIC-PASS02-REPORT.md) | PASS |
| Director transition selection | Lock selected transition; recompute downstream global/sample placement and review whole mix | [MUSIC-PASS02-REPORT.md](../output/wf311613-standalone-murphy-bed/final/lofi-music-pass02/MUSIC-PASS02-REPORT.md) | PASS |
| Locked visual + audio mux | Verify input hashes and all ordered video packets; final AAC tail/timescale and full decode | [FINAL-MUSIC-QA-REPORT.md](../output/wf311613-standalone-murphy-bed/final/final-lofi-720p/FINAL-MUSIC-QA-REPORT.md) | PASS |
| High-resolution resource gate | Phase 12 native short samples; preserve frames/defer at RENDER_RESOURCE_LIMIT | [FINAL-REVIEW-REPORT.md](../output/wf311613-standalone-murphy-bed/final/final-review-web-qa-01/FINAL-REVIEW-REPORT.md) | PASS |
| Honest STOP/raw evidence | Timeout stays FAIL; authorized changes do not relabel strict hash/replay rejection PASS | [STOP-REPORT.md](../output/wf311613-standalone-murphy-bed/final/final-micro-pass-visual-master-verification/STOP-REPORT.md) | PASS |

## Different-product scenario review
Request: “Create an assembly video for this new cabinet from this PDF.” The intake establishes cabinet identity, source/variant and native output, then extracts inventory before modeling. A missing variant produces SOURCE_SCOPE_REQUIRED; conflicting joint instructions produce SOURCE_CONFLICT. Cam/dowel/bracket recipes teach first joints with source-defined order, not inherited bed logic. Blocking closure or unsupported placement produces MECHANICAL_P0. Occluded cam access changes the camera; unclear holes need evidence, not removal by appearance. Whole-product endpoint/intermediate coverage precedes freeze/full silent render. Visual approval unlocks licensed music work; unavailable listening returns a full director package, and transition approval alone does not unlock mux. Full audio approval allows locked-master mux/QA; high-res rendering and publishing need their own authorized scope. No core edit is required to describe this cabinet. Documentary scenario result: PASS.

## Files created and instruction changes
30 new files; one existing, previously untracked AGENTS.md modified. All supporting files are listed below.

### Templates

- [director-plan.md](../.agents/skills/long-form-assembly-video/templates/director-plan.md)
- [director-review-decision.md](../.agents/skills/long-form-assembly-video/templates/director-review-decision.md)
- [final-master-qa-report.md](../.agents/skills/long-form-assembly-video/templates/final-master-qa-report.md)
- [fit-hole-audit-report.md](../.agents/skills/long-form-assembly-video/templates/fit-hole-audit-report.md)
- [mechanical-validation-report.md](../.agents/skills/long-form-assembly-video/templates/mechanical-validation-report.md)
- [music-edit-plan.json](../.agents/skills/long-form-assembly-video/templates/music-edit-plan.json)
- [music-provenance.json](../.agents/skills/long-form-assembly-video/templates/music-provenance.json)
- [pre-render-freeze-manifest.json](../.agents/skills/long-form-assembly-video/templates/pre-render-freeze-manifest.json)
- [product-brief.md](../.agents/skills/long-form-assembly-video/templates/product-brief.md)
- [source-authority-manifest.json](../.agents/skills/long-form-assembly-video/templates/source-authority-manifest.json)

### Checklists

- [audio-listening-review.md](../.agents/skills/long-form-assembly-video/checklists/audio-listening-review.md)
- [camera-occlusion.md](../.agents/skills/long-form-assembly-video/checklists/camera-occlusion.md)
- [director-plan.md](../.agents/skills/long-form-assembly-video/checklists/director-plan.md)
- [final-mux-qa.md](../.agents/skills/long-form-assembly-video/checklists/final-mux-qa.md)
- [fit-hole-audit.md](../.agents/skills/long-form-assembly-video/checklists/fit-hole-audit.md)
- [high-res-render-safety.md](../.agents/skills/long-form-assembly-video/checklists/high-res-render-safety.md)
- [mechanical-validation.md](../.agents/skills/long-form-assembly-video/checklists/mechanical-validation.md)
- [music-license-provenance.md](../.agents/skills/long-form-assembly-video/checklists/music-license-provenance.md)
- [pre-render-freeze.md](../.agents/skills/long-form-assembly-video/checklists/pre-render-freeze.md)
- [source-intake.md](../.agents/skills/long-form-assembly-video/checklists/source-intake.md)
- [visual-master-qa.md](../.agents/skills/long-form-assembly-video/checklists/visual-master-qa.md)

### References

- [artifact-contract.md](../.agents/skills/long-form-assembly-video/references/artifact-contract.md)
- [audio-and-mux.md](../.agents/skills/long-form-assembly-video/references/audio-and-mux.md)
- [connection-recipes.md](../.agents/skills/long-form-assembly-video/references/connection-recipes.md)
- [repository-adapter.md](../.agents/skills/long-form-assembly-video/references/repository-adapter.md)
- [stop-gates.md](../.agents/skills/long-form-assembly-video/references/stop-gates.md)

### Other files

- [Rule](../rules/long-form-assembly-video.md)
- [Skill entrypoint](../.agents/skills/long-form-assembly-video/SKILL.md)
- [AGENTS.md routing change](../AGENTS.md)
- [This implementation/dry-run report](long-form-assembly-video-implementation-review.md)
- [Machine-readable validation evidence](long-form-assembly-video-validation.json)

## Git diff scope
Git exists at task start, with many pre-existing untracked runtime/product/output files; only README.md is tracked. `git diff --stat` is empty because this task's rule/skill/report files are new and AGENTS.md was already untracked. No staging/commit or tracked file edit occurred. Task scope is +30 documentation files and one appended AGENTS.md routing section; pre-existing untracked files are excluded from this summary. File inventory above is the reviewable change set.

STOP after this documentation/process infrastructure package. No workflow for another product has started.
