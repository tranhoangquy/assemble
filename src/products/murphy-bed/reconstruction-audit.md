# Product Reconstruction Audit — Merax Murphy Bed with Side Storage

## Scope and source policy

This model is reconstructed from the eight supplied product images. The supplied videos are used only for pacing, camera language, overlays, and instructional presentation. They are not used as evidence for geometry, hardware quantity, or assembly order.

The resulting assembly is a physically plausible reconstruction, not an official manufacturer procedure.

## Observed product structure

- A full-height fixed cabinet with one side-storage bay and one Murphy-bed bay.
- The dominant supplied configuration places storage on the viewer's left. Two isolated catalog images show the mirrored right-storage variant; the implementation consistently uses the left-storage configuration.
- Four visible storage shelf levels plus the base shelf, a back panel, and a full-depth outer frame.
- A moving bed perimeter with two side rails, head and foot rails, steel support/deck panels, a longitudinal center rail, and five pale timber slats.
- A six-panel framed facade with two vertical handles. The facade belongs to the moving bed assembly; it is not a separate closed-state mesh.
- Two folding legs at the foot end and black assist components near the lower cabinet sides.

## Current-model audit and resolved mismatches

- The earlier folding-desk model was rejected because the supplied product has side storage and no desk.
- The current model uses one shared logical geometry for open and closed states.
- The cabinet envelope, storage bay, bed opening, five slats, paired legs, facade divisions, handles, and visible lower assist components were rebuilt to match the supplied images.
- The model deliberately does not reproduce the room dressing, plants, baskets, mattress linens, or other lifestyle props because they are not product structure.
- Small hidden joints remain simplified. They are represented only where needed to explain a plausible connection.

## Dimension calibration

All internal dimensions use centimeters. Conversion: `1 in = 2.54 cm`.

| Labeled reference | Inches | Centimeters | Confidence |
|---|---:|---:|---|
| Overall width | 94.2 | 239.268 | High |
| Overall height | 88.5 | 224.790 | High |
| Cabinet depth | 15.7 | 39.878 | High |
| Side-storage clear width | 24.4 | 61.976 | High |
| Typical shelf clear height | 16.1 | 40.894 | High |
| Bed support width | 61.0 | 154.940 | High |
| Open bed length | 80.7 | 204.978 | High |
| Foot-to-foot width | 61.4 | 155.956 | High |

The rendered mesh uses rounded construction values where the difference is visually negligible (for example, 239 cm instead of 239.268 cm). Exact labeled values remain stored in `product.json` as calibration metadata.

## Estimated logical BOM

- 20 cabinet components: plinth, three full-height uprights, top cap, storage back/base/shelves, upper header, lower crossbar, rear brace, and inset details.
- 26 bed components: perimeter, center support, two deck panels, five slats, facade frame/panels, handles, and mattress representation.
- 13 mechanism components: bed pivot group, two leg pivots, two legs, two feet, two pivot brackets, and four visible assist elements.
- 24 representative hardware objects: base/top screws, bracket screws, washers, pivot bolts/nuts, shelf dowels, and leg bolts.

Total: 83 logical objects. Hardware quantities are illustrative and not manufacturer-confirmed.

## Static and moving groups

- Fixed: cabinet, side storage, header, crossbar, rear brace, and cabinet-mounted pivot brackets.
- Moving: `bed_pivot` and all bed perimeter, support, slat, mattress, facade, handle, and bed-side assist children.
- Nested moving groups: `left_leg_pivot` and `right_leg_pivot`, both under `bed_pivot`.

## Connections

High-confidence visible connections include shelf supports, bed perimeter joints, leg pivots, facade-to-bed relationship, and the cabinet-side pivot region.

Mechanically inferred connections include hidden bracket screws, pivot washers/nuts, some crossbar fasteners, and the exact assist-bar joints. These are intentionally minimal and tagged low or medium confidence in `product.json`.

## Pivot evidence and mechanism uncertainty

- The pivot region is visible near the lower inside edges of the cabinet in open views.
- The open and closed images show the facade rotating with the bed.
- The paired legs remain associated with the foot end and rotate through nested pivots.
- Exact spring/gas-strut rating, linkage geometry, hidden stops, locking hardware, and manufacturer tolerances are unknown.

## Assembly reasoning

The estimated order follows these constraints:

1. Establish the plinth and uprights before supported cabinet parts.
2. Build the open cabinet and side-storage internals before the top closure.
3. Build the bed perimeter before deck panels and slats.
4. Install pivot brackets and assist parts before facade closure blocks access.
5. Add the facade to the same bed hierarchy, then add legs and mattress.
6. Test motion only after structural and pivot operations are complete.

Every connected operation resolves a start, staging, pre-install, alignment, and final waypoint. The validator checks missing parts/connections/dependencies, duplicate installation, target availability, access closure, path collision, tool access, and unsupported/future-state warnings.

## Confidence summary

- High: overall envelope, storage location for the chosen variant, shelf spacing, main opening, bed width/length, five slats, closed silhouette.
- Medium: facade thickness/depth, exact pivot offsets, leg section sizes, deck construction, assist-bar placement.
- Low: hidden hardware count, hidden bracket geometry, exact tool-access directions, and the inferred assembly order.
