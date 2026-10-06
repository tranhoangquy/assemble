# Native-resolution visual inspection

Candidate: `wf311613-final-micro-pass`.

Scope: inspection of the actual captured native-resolution stills after the generic export-resolution changes. This is a technical visual regression inspection, **not director approval** and not a new creative polish pass. No source, camera, product, timing, material, lighting or presentation changes were made during this inspection. No browser, render, encode, build or test jobs were started by this inspector.

## Evidence inspected

The [overview contact sheet](native-comparison-contact-sheet.png) was inspected across all twelve checkpoint rows and all four profile columns. Its comparison images are reduced for inspection only; the underlying native PNGs remain untouched.

The following individual four-profile comparison sheets were also inspected:

- [Early hardware macro](comparison-sheets/04-early-hardware-macro.png).
- [Step 25 bearing connection](comparison-sheets/08-step25-connection.png).
- [Step 26 active connection](comparison-sheets/09-step26-corrected-active-connection.png).
- [Final bedroom hero](comparison-sheets/12-final-bedroom-hero.png).

Native originals inspected separately include the [720p hardware macro](720p/stills/04-early-hardware-macro.png), [1080p Step 25 connection](1080p/stills/08-step25-connection.png), [1440p Step 26 connection](1440p/stills/09-step26-corrected-active-connection.png) and [1440p final hero](1440p/stills/12-final-bedroom-hero.png). The two 1440p views were displayed with the image viewer's default downsampling; detail conclusions below therefore also use the original-size 4K views.

These 3840 × 2160 PNGs were inspected at original image resolution, without the image viewer's default resizing:

- [4K hardware macro](2160p/stills/04-early-hardware-macro.png).
- [4K Step 26 active connection](2160p/stills/09-step26-corrected-active-connection.png).
- [4K final bedroom hero](2160p/stills/12-final-bedroom-hero.png).

## Checkpoint observations

Times below are the actual same-timestamp capture values recorded in [native-verification.json](native-verification.json), rounded here only for readability. All twelve overview rows preserve the same apparent composition across 720p, 1080p, 1440p and 2160p.

| Checkpoint | Time (s) | Visual observation |
| --- | ---: | --- |
| Finished intro hero | 0.000000 | Closed product, window, plant, wall art and nightstand retain their relative placement. No aspect stretch or new edge crop is apparent. |
| Fully exploded intro | 3.750000 | Separated panels/rails remain in the same explanatory layout. The intentional exploded pose is consistent across profiles. |
| Exact Step 1 reset | 5.000000 | Grounded side-assembly parts retain spacing, orientation and wood tone. No visible residue from the preceding exploded pose appears in this still. |
| Early hardware macro | 20.951110 | Bolt head, visible metal portion, drilled holes and top cam remain discernible. The English instruction card remains in the lower-left safe area. |
| Cabinet medium | 78.063694 | Cross-rail and cabinet-side relationships remain readable. Caption placement and size relative to the frame remain consistent. |
| B8 cabinet face | 117.853694 | Paired B8 face panels and horizontal joins remain visible in the same tight framing. The cabinet bottom is cropped in this approved viewpoint at every resolution; this still is not a whole-product fit shot. |
| Bed face | 252.063694 | The separate grounded face subassembly remains visible with the same oblique view and empty workspace around it. |
| Step 25 connection | 383.413694 | Metal bearing/receiver interface and the wood receiver hole remain in the macro. Broad metal parts extend outside the frame identically; whole-bed context is intentionally absent from this connection viewpoint. |
| Step 26 active connection | 395.183694 | Interior bracket, metallic stud/rings and retainer detail remain visible against the wood. The active interface is not newly hidden by a panel at higher resolution. |
| Folding legs | 417.139694 | The arm, pivot fasteners and lower support retain the same connection framing. The lower-left instruction card stays clear of the pivot. |
| Wall anchoring | 469.191194 | Wall bracket and adjacent fastener location remain visible. The light wall separates from the wood and dark hardware consistently. |
| Final bedroom hero | 523.453694 | Open bed, legs, mattress, bedding, cabinet and restrained room arrangement retain their proportions and framing. No new clipping or stretched presentation is apparent. |

## Detail findings

Wood grain scale and direction are visually consistent across resolutions: broad panel grain, narrow rail grain and upright grain retain their orientation instead of changing with output size. Higher-resolution originals expose more of the same grain detail; they do not show a new material treatment. This finding concerns preservation of the approved visual baseline, not a fresh claim of photographic realism.

Panel edges, joins, small drilled holes and hardware silhouettes remain distinct in the inspected original-size 4K macros. Existing geometric facets/reflection bands on the metal remain part of the baseline. No newly missing texture, all-black render, gross edge break, aspect stretch or resolution-induced intersection was visible in the inspected stills. This is a visible-image observation, not a replacement for collision or mechanical validation.

The hardware macro's `Step 1 / 31` and `Fit the long bolt.` text is readable at 720p and proportionally enlarged at native 4K. It does not become tiny at 4K or grow disproportionately into the connection. The visible caption cards in the cabinet, leg and anchoring rows likewise retain the same normalized position and apparent scale. The approved Step 25/26 macro and showcase frames do not gain additional UI/debug overlays.

The final original-size 4K hero retains the current light bedroom presentation: both front supports and the cabinet are in frame, the mattress/bedding remain separate from the wood carrier, and the nightstand/window/plant/artwork retain the approved composition. No extra furniture, decoration, depth of field or lighting treatment appears in these captures.

## Supporting technical evidence — distinct from visual judgment

[native-verification.json](native-verification.json) reports `valid: true`, no errors, 48 dimension-checked native checkpoints, twelve exact canonical scene-state/camera comparisons across the four profiles and 24 successful seek/reset excursions. Actual viewport, canvas CSS size, canvas pixel size, drawing buffer and PNG dimensions agree at device scale factor 1. State equality was measured through the real renderer diagnostics, not inferred from matching pictures.

Normalized caption differences are below the existing 0.003 tolerance; the largest reported difference is approximately 0.000925926. This is consistent with the visible preservation of caption placement and size.

The same report records four actual 60-frame / 2-second native proofs at 30 fps, H.264/yuv420p, zero audio streams, complete decode, no unexpected black intervals and no upscaling. Those are technical proof results; this still inspection does not independently claim motion/pacing approval of the proof videos.

[720p-infrastructure-preservation.json](../720p-infrastructure-preservation.json) reports all twelve current 720p PNGs byte-identical to the pre-infrastructure-change frozen production captures. Eleven checkpoint timestamps are exactly equal; the B8 checkpoint differs only by floating-point accumulation of `4.263256414560601e-14` seconds and still has strict PNG byte identity. No image transform or pixel tolerance was used for that preservation comparison.

Retained nonfatal browser evidence includes the `THREE.Clock` deprecation and the specifically observed/probed same-origin optional `/favicon.ico` GET 404. The technical report does not classify unrelated resource failures as acceptable.

## Boundary and conclusion

No visible native-resolution regression requiring a product/presentation correction was found in this inspected checkpoint set. No changes are proposed or authorized by this report.

The overview does not inspect every pixel of every native image. Stills cannot establish screw threading motion, complete Step 25 route continuity, leg articulation through every angle, whole-video pacing or collision-free travel. Those remain covered by the separate frozen-candidate gate results, deterministic full-720p render verification and director motion review. The production web UI's completed export/download behavior is also a separate actual-UI audit, not proven by these native stills.

This report grants no director approval and does not authorize another polish pass.
