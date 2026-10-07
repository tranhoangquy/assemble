# LONG-FORM ASSEMBLY VIDEO PRODUCTION STANDARD
Version: 1.1
Scope: all long-form instructional 3D assembly videos in this repository.
Typical duration: 5–12 minutes; complex furniture often 7–10 minutes when appropriate.
MUST/REQUIRE are obligations; defaults may be overridden explicitly by the Director/Product Brief.
This standard describes required outcomes, not a claim that every engine capability already exists.

## Source and architecture
1. Each product MUST declare authoritative sources. Default precedence: official assembly manual/PDF → approved product data/dimensions → approved mechanical relationships → DirectorPlan → approved visual/material references → documented engineering inference. Resolve conflicts explicitly. Marketing, AI imagery, previous products and aesthetic guesses MUST NOT silently outrank assembly authority. Infer undocumented details only as necessary for mechanical/visual plausibility; record important inference, never invent available authoritative mechanics.
2. Separate PRODUCT DATA (what), ASSEMBLY DATA (how assembled), and VIDEO/DIRECTOR DATA (how presented), using product.json/assembly.json/video.json or equivalent typed data. Generic engine code MUST NOT contain product, part, hardware or step IDs, product dimensions or assembly sequence.
3. AssemblyGraph is authoritative for mechanical order. Validate dependencies, installation paths, future access and closure/access order; directing MUST NOT override them.
4. Preserve equivalent state semantics: PART `UNASSEMBLED → STAGED → ALIGNING → INSTALLED → SECURED`; HARDWARE `HIDDEN → STAGED → ALIGNING → INSERTING → TIGHTENING → SECURED`; INSTALLATION PATH `START → STAGING → PRE-INSTALL → ALIGNMENT → FINAL`.
5. Isolate each product's source package, product/assembly/video data, caches, render frames, manifests, audio and final output. No cross-product contamination.

## Mechanics and instruction
6. Default directing contract: CURRENT STATE → INTRODUCE PART → SHOW TARGET → STAGE → ALIGN → INSERT/PLACE → CONNECTION CLOSE-UP → HARDWARE → TIGHTEN/SECURE → VERIFY → PULL BACK → NEXT. Shorthand: PART → TARGET → ALIGN → CONNECT → HARDWARE → TIGHTEN → VERIFY. Teach the first important connection type clearly; accelerate understood repetition where appropriate.
7. Require plausible support for heavy parts, correct seating, pivots and tool/access paths. No unrelated-solid penetration, structural teleportation or premature loss of future access. Distinguish intended mating contact from invalid collision. Camera cuts MUST NOT conceal impossible motion.
8. Default: one primary structural operation at a time. Parallel/repeated operations are acceptable only with preserved clarity. Future parts normally remain hidden or staged away; no accidental duplicate parts/hardware.
9. Camera grammar: MEDIUM-WIDE 3/4 → TARGET → CONNECTION CLOSE-UP → AXIS/HARDWARE DETAIL → PULL BACK. Move the camera when a connection is hidden; never move a part through geometry for visibility. Avoid constant orbiting/unnecessary cinematic motion.
10. Use semantic timing: teach/new operations and mechanisms slower, understood repeats faster, verification readable. Compress repetition before shortening important actions; no global acceleration solely to meet duration. Instructional clarity outranks arbitrary runtime.
11. An optional intro typically lasts 3–6 seconds: finished hero → controlled structural overview/explosion → exact assembly start state. Reverse assembly MUST NOT serve as assembly instruction. Exclude props, bedding, environment and hardware clouds from irrelevant explosion. End with completed product and important functionality.
12. Presentation environment/props MUST stay separate from product parts, assembly dependencies/registry and structural collision participants. Declared installation surfaces may inform support/access validation without becoming product parts.

## Fit and production cleanliness
13. Audit the whole product before full final render: every step endpoint plus important intermediate/final states, using sufficient front, both sides, upper/lower, interior and under-product angles where relevant. Cover holes, fit, seams, hardware, duplicates, collision, symmetry, support, stray geometry and presentation contamination.
14. Classify visible features: REQUIRED, JUSTIFIED_UNUSED, TEMPORARY_ASSEMBLY_ACCESS, PRESENTATION_ONLY, UNNECESSARY, INCORRECT, DUPLICATE, ARTIFACT. Final approval requires UNNECESSARY = INCORRECT = DUPLICATE = ARTIFACT = 0 for visible product features. Retained features require evidence.
15. Use blind holes where mechanically appropriate; no accidental opposite mouths. Unexpected daylight gaps/overlaps are defects unless explicitly designed. Hardware counts MUST match authoritative data.
16. Production requires ZERO visible debug/helper geometry: axes, grids, pivots, bounds, collision meshes, installation paths, connection markers and helper meshes.
17. Before expensive final render require applicable PASS gates: SOURCE AUTHORITY, ASSEMBLY DEPENDENCY, INSTALLATION PATH, COLLISION, EXPECTED CONTACT, TOOL ACCESS, FUTURE ACCESS, SUPPORT, PIVOT, HARDWARE COUNT, FIT, HOLE AUDIT, FINAL FUNCTION, PRESENTATION, DEBUG CLEANLINESS. No known P0 mechanical issue may enter final render.

## Render and source control
18. Deterministic seek/renderFrame MUST produce the same geometry, transforms, hardware, visibility, materials, camera, captions and presentation at the same timestamp. Use `time = frameIndex / fps`; no wall-clock, random or playback-history dependency.
19. Freeze relevant product, assembly, timeline, camera, material and DirectorPlan hashes/fingerprints before expensive rendering. A creative source change invalidates automatic freshness claims for the old render.
20. Render target profiles natively (e.g. 720p, 1080p, 1440p, 2160p). Resolution MUST NOT change creative state. Upscaled lower-resolution MP4s MUST NOT be labeled native higher-resolution masters.
21. LONG-FORM VIDEO GENERATION MUST BE RESUMABLE, including long 720p exports. Long/high-resolution exports MUST NOT rely solely on one monolithic operation. Require chunked work units over one deterministic continuous frame sequence, persistent atomic checkpoints, frame validation, resume, bounded retry, configurable renderer recycling and automatic final assembly. Creative source/product/profile/FPS identity MUST protect all reuse. A failed chunk MUST NOT invalidate verified prior frames; Cancel preserves work and explicit isolated Delete removes it. Before encoding require exact expected count, zero missing/invalid frames and contiguous valid native frames. Apply approved audio only once at final mux; complete only after output verification.
22. A successful 720p job does not prove 4K stability. Perform short native-resolution resource tests before expensive high-resolution jobs. If inadequate, defer to stronger hardware; never silently reduce creative quality.

## Audio and approval
23. Default audio is MUSIC-ONLY unless explicitly overridden. Do not automatically add procedural SFX. Default music: instrumental lofi/chill, unobtrusive, stable energy, no vocals/spoken samples or aggressive drops.
24. Build a continuous soundtrack with intro/body/phrase/outro/energy analysis and useful intro/outro trims: STABLE PHRASE → MUSICAL CROSSFADE → STABLE PHRASE. Do not mechanically concatenate full songs. Music fits the locked video; never retime approved assembly video to fit music.
25. Every asset needs provenance: title, artist, source, license, YouTube-use status, commercial-use status when available, attribution, Content ID information when available and source SHA256. “No Copyright” is not public domain/unrestricted use. STOP when provenance/license is insufficient for intended use.
26. Lock the visual master after visual approval and audio master after audio approval. Prefer final mux from locked visual + locked audio with video stream copy; verify video stream identity where possible and disclose inability to verify.
27. Director approval MUST be explicit. Technical metrics do not establish listening/visual approval. Evidence must distinguish PASS, FAIL, WARNING, NOT RUN, REQUIRES DIRECTOR REVIEW.
28. DIRECTOR APPROVED + TECHNICAL QA PASS means APPROVED & LOCKED. Never overwrite locked masters; creative changes create new revisions. Publishing/upload requires separate explicit authorization.

## Governing priority
This is an INSTRUCTIONAL ASSEMBLY VIDEO GENERATOR. Mechanical truth, visual clarity, directorial continuity and deterministic reproducibility govern every phase. Assembly clarity wins when cinematic appearance conflicts with understanding real assembly.

Operational implementation: [.agents/skills/long-form-assembly-video/SKILL.md](../.agents/skills/long-form-assembly-video/SKILL.md).

## Shared Short and retention standards
Native portrait Shorts extend shared source/mechanical/provenance principles through [the Short standard](short-form-assembly-video.md), with their own presentation identities and Director gates. Explicit post-freeze cleanup follows [production artifact retention](production-artifact-retention.md); it does not change rendering behavior or automatic cache retention.
