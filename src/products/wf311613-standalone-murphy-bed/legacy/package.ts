import type { AnimationAction } from '@/types/assembly';
import type { DirectorPlan, DirectorShot, DirectorShotType } from '@/types/director';
import type { PartDefinition, ProductDefinition, Vector3Tuple } from '@/types/product';
import type { VideoDefinition } from '@/types/video';
import { DirectorPlanCompiler } from '@/engine/director/DirectorPlanCompiler';
import { HardwareRecipeBuilder } from '@/engine/director/HardwareRecipeBuilder';
import { wf311613HardwareCatalog } from './hardwareCatalog';

const WOOD = 'wood';
const PANEL = 'panel';
const METAL = 'metal';
const FASTENER = 'fastener';
const DOWEL = 'dowel';
const estimated = { source: 'mechanically_inferred' as const, confidence: 'medium' as const, note: 'Proportionally reconstructed because this dimension is not printed in the PDF.' };

const parts: PartDefinition[] = [
  { id: 'cabinet', name: 'Standalone Murphy Bed cabinet', type: 'group', position: [0, 0, 0], category: 'cabinet' },
  { id: 'left_side', name: 'PDF-left cabinet side subassembly', type: 'group', position: [-118, 0, 0], category: 'cabinet', visible: true, evidence: estimated },
  { id: 'right_side', name: 'PDF-right cabinet side subassembly', type: 'group', position: [118, 0, 0], category: 'cabinet', visible: true, evidence: estimated },
  { id: 'top_cap', name: 'Completed top-cap subassembly', type: 'group', position: [0, 0, 0], category: 'cabinet', visible: true, evidence: estimated },
];

function box(id: string, name: string, size: Vector3Tuple, position: Vector3Tuple, material = WOOD, parent?: string, category: PartDefinition['category'] = 'cabinet'): PartDefinition {
  const part: PartDefinition = {
    id, name, type: 'mesh', geometry: { type: 'box', size, bevel: Math.min(0.7, Math.min(...size) / 3) },
    position, material, parent, visible: false, category, evidence: estimated, explodeOffset: [0, 0, 42],
    connectionPoints: [{ id: 'target', position: [0, 0, 0], normal: [0, 0, 1], kind: 'mount' }],
  };
  parts.push(part);
  return part;
}

function point(partId: string, id: string, position: Vector3Tuple, normal: Vector3Tuple): void {
  const part = parts.find((candidate) => candidate.id === partId);
  if (!part) throw new Error(`Missing host part ${partId}`);
  part.connectionPoints = [...(part.connectionPoints ?? []), { id, position, normal, kind: 'hole' }];
}

function screw(id: string, name: string, position: Vector3Tuple, rotation: Vector3Tuple = [90, 0, 0], parent?: string): void {
  parts.push({ id, name, type: 'mesh', parent, geometry: { type: 'screw', radius: 0.72, length: 7, headRadius: 1.6, headHeight: 1.2, segments: 24 }, position, rotation, material: FASTENER, visible: false, category: 'hardware', evidence: estimated, explodeOffset: [0, 0, 24] });
}

function dowel(id: string, name: string, position: Vector3Tuple): void {
  parts.push({ id, name, type: 'mesh', geometry: { type: 'cylinder', radius: 1, height: 7, segments: 20 }, position, rotation: [90, 0, 0], material: DOWEL, visible: false, category: 'hardware', evidence: estimated, explodeOffset: [0, 0, 20] });
}

function cam(id: string, name: string, position: Vector3Tuple): void {
  parts.push({ id, name, type: 'mesh', geometry: { type: 'nut', innerRadius: 0.65, outerRadius: 1.8, thickness: 1.5 }, position, rotation: [90, 0, 0], material: FASTENER, visible: false, category: 'hardware', evidence: estimated, explodeOffset: [0, 0, 18] });
}

// Coordinate convention: X negative = PDF-left, X positive = PDF-right, Z positive = room/front.
box('A1', 'A1 PDF-left outer upright', [5, 225, 5], [0, 112.5, 17], WOOD, 'left_side');
box('A3', 'A3 PDF-left inner upright', [5, 225, 5], [0, 112.5, -17], WOOD, 'left_side');
box('A5', 'A5 PDF-left side panel', [3, 150, 28], [0, 122, 0], PANEL, 'left_side');
box('A7_L', 'A7 PDF-left upper tie', [4, 7, 34], [0, 198, 0], WOOD, 'left_side');
box('A8_L', 'A8 PDF-left lower tie', [4, 7, 34], [0, 45, 0], WOOD, 'left_side');
box('A9_L', 'A9 PDF-left lower panel', [3, 34, 28], [0, 23, 0], PANEL, 'left_side');

box('A2', 'A2 PDF-right inner upright', [5, 225, 5], [0, 112.5, -17], WOOD, 'right_side');
box('A4', 'A4 PDF-right outer upright', [5, 225, 5], [0, 112.5, 17], WOOD, 'right_side');
box('A6', 'A6 PDF-right side panel', [3, 150, 28], [0, 122, 0], PANEL, 'right_side');
box('A7_R', 'A7 PDF-right upper tie', [4, 7, 34], [0, 198, 0], WOOD, 'right_side');
box('A8_R', 'A8 PDF-right lower tie', [4, 7, 34], [0, 45, 0], WOOD, 'right_side');
box('A9_R', 'A9 PDF-right lower panel', [3, 34, 28], [0, 23, 0], PANEL, 'right_side');

box('D5', 'D5 lower cross member', [231, 6, 6], [0, 15, -13]);
box('B9', 'B9 lower face rail', [231, 8, 5], [0, 30, 14]);
box('E3', 'E3 rear floor rail', [231, 5, 5], [0, 5, -16]);
box('E4', 'E4 lower center connector', [7, 28, 6], [0, 22, -12]);

[65, 123, 181].forEach((y, row) => {
  box(`B8_${row * 2 + 1}`, `B8 row ${row + 1} PDF-left panel`, [111, 42, 3], [-56, y, -17], PANEL);
  box(`B8_${row * 2 + 2}`, `B8 row ${row + 1} PDF-right panel`, [111, 42, 3], [56, y, -17], PANEL);
  box(`B7_${row + 1}`, `B7 row ${row + 1} center upright`, [6, 48, 5], [0, y, -14]);
});
box('D4_1', 'D4 first row rail', [231, 5, 5], [0, 92, -13]);
box('D4_2', 'D4 second row rail', [231, 5, 5], [0, 150, -13]);
box('B5', 'B5 upper rear rail', [231, 6, 5], [0, 207, -16]);
box('B6', 'B6 upper front rail', [231, 6, 5], [0, 207, 16]);

box('B1_1', 'B1 top-cap front rail', [239, 7, 5], [0, 220, 17], WOOD, 'top_cap');
box('B1_2', 'B1 top-cap rear rail', [239, 7, 5], [0, 220, -17], WOOD, 'top_cap');
box('B2_1', 'B2 top-cap PDF-left end', [5, 7, 31], [-117, 220, 0], WOOD, 'top_cap');
box('B2_2', 'B2 top-cap PDF-right end', [5, 7, 31], [117, 220, 0], WOOD, 'top_cap');
box('B3', 'B3 top-cap center connector', [5, 7, 31], [0, 220, 0], WOOD, 'top_cap');
box('B4_1', 'B4 top-cap PDF-left panel', [113, 3, 29], [-58, 220, 0], PANEL, 'top_cap');
box('B4_2', 'B4 top-cap PDF-right panel', [113, 3, 29], [58, 220, 0], PANEL, 'top_cap');

box('D9', 'D9 PDF-right inner mechanism plate', [4, 47, 15], [114, 43, 0], METAL, undefined, 'mechanism');
box('D8', 'D8 PDF-left inner mechanism plate', [4, 47, 15], [-114, 43, 0], METAL, undefined, 'mechanism');
box('E5', 'E5 center closing stile — PDF 284 mm lower offset', [7, 142, 5], [0, 117, 17], WOOD);
box('H25_R', '#25 PDF-right inner angle bracket', [8, 8, 8], [111, 199, -13], METAL, undefined, 'hardware');
box('H25_L', '#25 PDF-left inner angle bracket', [8, 8, 8], [-111, 199, -13], METAL, undefined, 'hardware');

type Host = { id: string; position: Vector3Tuple; normal?: Vector3Tuple };
const hardwareByStep = new Map<number, string[]>();
function remember(step: number, id: string): void { hardwareByStep.set(step, [...(hardwareByStep.get(step) ?? []), id]); }

function addDowelSet(step: number, hosts: Host[]): void {
  hosts.forEach((host, index) => {
    const id = `s${String(step).padStart(2, '0')}_h06_${String(index + 1).padStart(2, '0')}`;
    dowel(id, `Step ${step} #6 dowel ${index + 1}`, host.position);
    point(host.id, `s${step}_dowel_${index + 1}`, [0, 0, 0], host.normal ?? [0, 0, 1]);
    remember(step, id);
  });
}

function addCamBoltSet(step: number, hardwareId: 4 | 5, hosts: Host[]): void {
  hosts.forEach((host, index) => {
    const n = String(index + 1).padStart(2, '0');
    const camId = `s${String(step).padStart(2, '0')}_h08_${n}`;
    const boltId = `s${String(step).padStart(2, '0')}_h${String(hardwareId).padStart(2, '0')}_${n}`;
    cam(camId, `Step ${step} #8 cam ${index + 1}`, [host.position[0], host.position[1], host.position[2] - 1.8]);
    screw(boltId, `Step ${step} #${hardwareId} bolt ${index + 1}`, host.position);
    point(host.id, `s${step}_cam_${index + 1}`, [0, 0, 0], host.normal ?? [0, 0, 1]);
    point(host.id, `s${step}_bolt_${index + 1}`, [0, 0, 0], host.normal ?? [0, 0, 1]);
    remember(step, camId); remember(step, boltId);
  });
}

function addScrewSet(step: number, hardwareId: 12 | 13 | 14 | 21 | 24, hosts: Host[], parent?: string): void {
  hosts.forEach((host, index) => {
    const id = `s${String(step).padStart(2, '0')}_h${String(hardwareId).padStart(2, '0')}_${String(index + 1).padStart(2, '0')}`;
    screw(id, `Step ${step} #${hardwareId} screw ${index + 1}`, host.position, [90, 0, 0], parent);
    point(host.id, `s${step}_h${hardwareId}_screw_${index + 1}`, [0, 0, 0], host.normal ?? [0, 0, 1]);
    remember(step, id);
  });
}

const leftJoints: Host[] = [
  { id: 'A1', position: [-118, 198, 17] }, { id: 'A3', position: [-118, 198, -17] }, { id: 'A1', position: [-118, 159, 17] }, { id: 'A3', position: [-118, 159, -17] },
  { id: 'A1', position: [-118, 45, 17] }, { id: 'A3', position: [-118, 45, -17] }, { id: 'A1', position: [-118, 23, 17] }, { id: 'A3', position: [-118, 23, -17] },
];
const rightJoints: Host[] = leftJoints.map((host, index) => ({ ...host, id: index % 2 ? 'A2' : 'A4', position: [-host.position[0], host.position[1], host.position[2]] }));
addDowelSet(1, leftJoints.slice(0, 6)); addCamBoltSet(1, 5, leftJoints);
addDowelSet(2, rightJoints.slice(0, 6)); addCamBoltSet(2, 5, rightJoints);

for (const [step, parent, parentX] of [[1, 'left_side', -118], [2, 'right_side', 118]] as const) {
  for (const id of hardwareByStep.get(step) ?? []) {
    const part = parts.find((candidate) => candidate.id === id);
    if (!part) continue;
    part.parent = parent;
    part.position = [part.position[0] - parentX, part.position[1], part.position[2]];
  }
}

const spanHosts = (count: number, y: number): Host[] => Array.from({ length: count }, (_, index) => ({ id: index % 2 ? 'A2' : 'A1', position: [index % 2 ? 118 : -118, y + Math.floor(index / 2) * 7, index % 2 ? -12 : 12], normal: [index % 2 ? -1 : 1, 0, 0] }));
addDowelSet(3, spanHosts(6, 12)); addCamBoltSet(3, 4, spanHosts(6, 12));
addDowelSet(4, spanHosts(2, 65)); addCamBoltSet(4, 4, spanHosts(2, 65));
addDowelSet(5, spanHosts(2, 123)); addCamBoltSet(5, 4, spanHosts(2, 123));
addDowelSet(6, spanHosts(4, 181)); addCamBoltSet(6, 4, spanHosts(4, 181));

addScrewSet(7, 13, Array.from({ length: 6 }, (_, index) => ({ id: index < 3 ? 'B1_1' : 'B1_2', position: [-94 + (index % 3) * 94, 220, index < 3 ? 17 : -17], normal: [0, 1, 0] })), 'top_cap');
addDowelSet(8, [-90, -30, 30, 90].map((x) => ({ id: x < 0 ? 'A1' : 'A4', position: [x, 217, 0], normal: [0, 1, 0] })));
addScrewSet(8, 12, Array.from({ length: 10 }, (_, index) => ({ id: index < 5 ? 'B1_1' : 'B1_2', position: [-96 + (index % 5) * 48, 222, index < 5 ? 17 : -17], normal: [0, 1, 0] })), 'top_cap');
addScrewSet(9, 21, Array.from({ length: 10 }, (_, index) => ({ id: 'D9', position: [114, 25 + index * 4, index % 2 ? 5 : -5], normal: [-1, 0, 0] })));
addScrewSet(9, 14, [{ id: 'H25_R', position: [111, 199, -9], normal: [0, 0, 1] }, { id: 'H25_R', position: [115, 203, -13], normal: [-1, 0, 0] }]);
addScrewSet(10, 21, Array.from({ length: 10 }, (_, index) => ({ id: 'D8', position: [-114, 25 + index * 4, index % 2 ? 5 : -5], normal: [1, 0, 0] })));
addScrewSet(10, 24, Array.from({ length: 9 }, (_, index) => ({ id: 'E5', position: [0, 58 + index * 14, 19], normal: [0, 0, 1] })));
addScrewSet(10, 14, [{ id: 'H25_L', position: [-111, 199, -9], normal: [0, 0, 1] }, { id: 'H25_L', position: [-115, 203, -13], normal: [1, 0, 0] }]);

const partMap = new Map(parts.map((part) => [part.id, part]));
const contactIds = parts.map((part) => part.id);
const pos = (id: string): Vector3Tuple => [...(partMap.get(id)?.position ?? [0, 0, 0])] as Vector3Tuple;
const connectionHost = (pointId: string): string => parts.find((part) => part.connectionPoints?.some((candidate) => candidate.id === pointId))?.id ?? 'A1';

const moveFrom = (id: string, offset: Vector3Tuple, at = 0, duration = 1.2): AnimationAction => {
  const p = pos(id);
  return { type: 'move', target: id, from: [p[0] + offset[0], p[1] + offset[1], p[2] + offset[2]], to: p, at, duration, ease: 'power2.inOut' };
};

const installPart = (id: string, host: string, offset: Vector3Tuple, at = 0, duration = 1.3): AnimationAction => ({
  type: 'installPart', target: id, connection: { part: host, point: 'target' }, at, duration,
  installation: {
    stagingOffset: offset,
    preInstallOffset: offset.map((value) => value * 0.25) as Vector3Tuple,
    approachDirection: offset.map((value) => value === 0 ? 0 : Math.sign(value)) as Vector3Tuple,
    approachDistance: 8, allowedContacts: contactIds, collisionTolerance: 1.2, estimated: true,
  },
});

function hardwareActions(step: number, finalTightening = true): AnimationAction[] {
  const ids = hardwareByStep.get(step) ?? [];
  const actions: AnimationAction[] = [];
  const cams = ids.filter((id) => id.includes('_h08_'));
  const dowels = ids.filter((id) => id.includes('_h06_'));
  const bolts = ids.filter((id) => /_h0[45]_/.test(id));
  dowels.forEach((id, index) => {
    const pointId = `s${step}_dowel_${index + 1}`;
    actions.push(...HardwareRecipeBuilder.dowel({ id: `${id}:install`, target: id, connection: { part: connectionHost(pointId), point: pointId }, at: index * 0.16, duration: index ? 0.72 : 1.15, approach: [0, 0, 1], allowedContacts: contactIds }));
  });
  cams.forEach((id, index) => {
    const pointId = `s${step}_cam_${index + 1}`;
    const host = connectionHost(pointId);
    actions.push({ type: 'installNut', id: `${id}:install`, target: id, connection: { part: host, point: pointId }, at: 1 + index * 0.13, duration: index ? 0.65 : 1.0, turns: 0.75, spinAxis: 'z', installation: { approachDirection: [0, 0, -1], approachDistance: 14, allowedContacts: contactIds, collisionTolerance: 1.2, estimated: true } });
  });
  bolts.forEach((id, index) => {
    const pointId = `s${step}_bolt_${index + 1}`;
    const host = connectionHost(pointId);
    actions.push({ type: 'installBolt', id: `${id}:start`, target: id, connection: { part: host, point: pointId }, at: 2 + index * 0.22, duration: index ? 0.75 : 1.15, turns: finalTightening ? 4 : 1.25, spinAxis: step >= 3 ? 'x' : 'z', installation: { approachDirection: step >= 3 ? [index % 2 ? 1 : -1, 0, 0] : [0, 0, 1], approachDistance: 18, allowedContacts: contactIds, collisionTolerance: 1.2, estimated: true } });
  });
  return actions;
}

function finalTighten(step: number): AnimationAction[] {
  return (hardwareByStep.get(step) ?? []).filter((id) => /_h04_/.test(id)).map((id, index) => ({ type: 'rotate', target: id, axis: 'x', from: 450, to: 1530, unit: 'deg', at: index * 0.28, duration: 0.8, ease: 'none' }));
}

function screwActions(step: number, hardwareId: 12 | 13 | 14 | 21 | 24, startAt = 0): AnimationAction[] {
  const ids = (hardwareByStep.get(step) ?? []).filter((id) => id.includes(`_h${String(hardwareId).padStart(2, '0')}_`));
  return ids.flatMap((id, index) => {
    const pointId = `s${step}_h${hardwareId}_screw_${index + 1}`;
    const host = connectionHost(pointId);
    return HardwareRecipeBuilder.screw({
      id: `${id}:install`, target: id, connection: { part: host, point: pointId }, at: startAt + index * 0.24,
      duration: index ? 0.78 : 1.25,
      approach: hardwareId === 12 || hardwareId === 13 ? [0, 1, 0] : hardwareId === 21 ? [step === 9 ? -1 : 1, 0, 0] : [0, 0, 1],
      distance: 18, turns: index ? 3.25 : 5, allowedContacts: contactIds,
    });
  });
}

function shot(id: string, type: DirectorShotType, duration: number, camera: string, actions: AnimationAction[] = [], note?: string): DirectorShot {
  return { id, type, duration, camera, actions, note };
}

type StepInput = {
  step: number; title: string; subtitle: string; page: number; parts: string[]; hardware: string;
  wide: string; macro: string; partActions: AnimationAction[]; installActions: AnimationAction[]; tightenActions?: AnimationAction[];
  establishActions?: AnimationAction[]; establishDuration?: number;
};

function buildStep(input: StepInput): DirectorPlan['steps'][number] {
  const prefix = String(input.step).padStart(2, '0');
  return {
    step: input.step, id: `step-${prefix}`, title: input.title, subtitle: input.subtitle, pdfPage: input.page, parts: input.parts, hardwareLabel: input.hardware,
    shots: [
      shot(`${prefix}A`, 'ESTABLISHING', input.establishDuration ?? 1.0, input.wide, [...(input.step === 1 ? [{ type: 'visibility' as const, targets: 'all' as const, visible: false, at: 0 }] : []), ...(input.establishActions ?? [])], 'Show the inherited completed state.'),
      shot(`${prefix}B`, 'INTRODUCE_PART', 0.9, input.wide, input.parts.map((target, index) => ({ type: 'show', target, at: index * 0.06 })), 'Introduce only this PDF step parts.'),
      shot(`${prefix}C`, 'SHOW_TARGET', 0.8, input.macro, input.parts.slice(0, 2).map((target) => ({ type: 'highlight', target, color: '#ff7138', intensity: 0.45, duration: 0.7 })), 'Show the exact connection before closure.'),
      shot(`${prefix}D`, 'STAGE_PART', 1.5, input.wide, input.partActions, 'Use a clear-space staging path.'),
      shot(`${prefix}E`, 'ALIGN_CONNECTION', 0.8, input.macro, [], 'Hold on the aligned joint.'),
      shot(`${prefix}F`, 'INSERT_PART', 0.8, input.macro, [], 'Seat along the mechanical axis.'),
      shot(`${prefix}G`, 'CONNECTION_MACRO', 0.7, input.macro, [], 'Expose holes and hardware axis.'),
      shot(`${prefix}H`, 'INSTALL_HARDWARE', Math.max(2.8, 1.6 + input.installActions.length * 0.22), input.macro, input.installActions, 'Every fastener remains a separate object.'),
      ...(input.tightenActions?.length ? [shot(`${prefix}I`, 'TIGHTEN_HARDWARE', Math.max(1.8, input.tightenActions.length * 0.35), input.macro, input.tightenActions, 'Final tightening begins after all bolts are started.')] : []),
      shot(`${prefix}J`, 'VERIFY_CONNECTION', 0.8, input.macro, input.parts.filter((target) => target !== 'top_cap').map((target) => ({ type: 'unhighlight', target, duration: 0.25 })), 'Verify the final seated state.'),
      shot(`${prefix}K`, 'PULL_BACK', 1.0, input.wide, [{ type: 'clearFocus', duration: 0.3 }], 'Return to assembly context.'),
      shot(`${prefix}L`, 'STEP_COMPLETE', 0.8, input.wide, [], 'Completed work stays installed.'),
    ],
  };
}

const stepInputs: StepInput[] = [
  { step: 1, page: 9, title: 'Build PDF-left Cabinet Side', subtitle: 'A1, A3, A5, A7, A8 and A9 form the first side assembly.', parts: ['A5','A7_L','A8_L','A9_L','A1','A3'], hardware: '#6 ×6 · #5 ×8 · #8 ×8', wide: 's01-wide', macro: 's01-macro', establishActions: [{ type:'move',target:'left_side',to:[112,112,0],duration:0.01 },{ type:'rotate',target:'left_side',axis:'z',to:90,unit:'deg',duration:0.01 }], partActions: [moveFrom('A5',[0,0,65]), installPart('A7_L','A5',[0,35,45],0.15), installPart('A8_L','A5',[0,-30,45],0.3), installPart('A9_L','A5',[0,-25,60],0.45), installPart('A1','A5',[-35,0,35],0.6), installPart('A3','A5',[35,0,-35],0.75)], installActions: hardwareActions(1) },
  { step: 2, page: 9, title: 'Build Mirrored PDF-right Cabinet Side', subtitle: 'A2, A4, A6, A7, A8 and A9 mirror Step 1 with outward hole faces preserved.', parts: ['A6','A7_R','A8_R','A9_R','A2','A4'], hardware: '#6 ×6 · #5 ×8 · #8 ×8', wide: 's02-wide', macro: 's02-macro', establishActions: [{ type:'move',target:'left_side',to:[-118,0,-85],duration:0.7 },{ type:'rotate',target:'left_side',axis:'z',to:0,unit:'deg',duration:0.7 },{ type:'move',target:'right_side',to:[-112,112,0],duration:0.01 },{ type:'rotate',target:'right_side',axis:'z',to:-90,unit:'deg',duration:0.01 }], partActions: [moveFrom('A6',[0,0,65]), installPart('A7_R','A6',[0,35,45],0.15), installPart('A8_R','A6',[0,-30,45],0.3), installPart('A9_R','A6',[0,-25,60],0.45), installPart('A2','A6',[-35,0,-35],0.6), installPart('A4','A6',[35,0,35],0.75)], installActions: hardwareActions(2) },
  { step: 3, page: 10, title: 'Join Cabinet Sides with Lower Structure', subtitle: 'Install D5, B9, E3 and E4; start all six bolts before tightening.', parts: ['D5','B9','E3','E4'], hardware: '#6 ×6 · #4 ×6 · #8 ×6', wide: 's03-wide', macro: 's03-macro', establishDuration: 1.8, establishActions: [{ type:'move',target:'left_side',to:[-118,0,0],duration:1.4 },{ type:'rotate',target:'left_side',axis:'z',to:0,unit:'deg',duration:1.4 },{ type:'move',target:'right_side',to:[118,0,0],duration:1.4 },{ type:'rotate',target:'right_side',axis:'z',to:0,unit:'deg',duration:1.4 }], partActions: [installPart('D5','A1',[0,0,65]), installPart('B9','A1',[0,0,75],0.2), installPart('E3','A1',[0,0,-65],0.4), installPart('E4','D5',[0,35,45],0.6)], installActions: hardwareActions(3,false), tightenActions: finalTighten(3) },
  { step: 4, page: 11, title: 'Install First Back-panel Row', subtitle: 'Two B8 panels, D4 and B7 form the first row.', parts: ['B8_1','B8_2','D4_1','B7_1'], hardware: '#6 ×2 · #4 ×2 · #8 ×2', wide: 's04-wide', macro: 's04-macro', partActions: ['B8_1','B8_2','D4_1'].map((id,index)=>installPart(id,'A1',[0,0,65],index*0.18)).concat(installPart('B7_1','D4_1',[0,45,25],0.6)), installActions: hardwareActions(4,false), tightenActions: finalTighten(4) },
  { step: 5, page: 12, title: 'Install Second Back-panel Row', subtitle: 'Repeat the row connection and verify parallel spacing.', parts: ['B8_3','B8_4','D4_2','B7_2'], hardware: '#6 ×2 · #4 ×2 · #8 ×2', wide: 's05-wide', macro: 's05-macro', partActions: ['B8_3','B8_4','D4_2'].map((id,index)=>installPart(id,'A1',[0,0,65],index*0.18)).concat(installPart('B7_2','D4_2',[0,45,25],0.6)), installActions: hardwareActions(5,false), tightenActions: finalTighten(5) },
  { step: 6, page: 13, title: 'Complete Upper Cross Structure', subtitle: 'Install the final B8 pair, B5, B6 and B7; start all four bolts first.', parts: ['B8_5','B8_6','B5','B6','B7_3'], hardware: '#6 ×4 · #4 ×4 · #8 ×4', wide: 's06-wide', macro: 's06-macro', partActions: ['B8_5','B8_6','B5','B6'].map((id,index)=>installPart(id,'A1',[0,0,70 + index*8],index*0.16)).concat(installPart('B7_3','B5',[0,40,30],0.7)), installActions: hardwareActions(6,false), tightenActions: finalTighten(6) },
  { step: 7, page: 14, title: 'Build Separate Top Cap', subtitle: 'Assemble B1 ×2, B2 ×2, B3 and B4 ×2 with six #13 screws.', parts: ['B1_1','B1_2','B2_1','B2_2','B3','B4_1','B4_2'], hardware: '#13 ×6', wide: 's07-wide', macro: 's07-macro', partActions: [{ type:'move',target:'top_cap',from:[-145,-145,65],to:[-145,-145,65],duration:0.01 }, ...['B1_1','B1_2','B2_1','B2_2','B3','B4_1','B4_2'].map((id,index)=>moveFrom(id,[index%2?35:-35,35,35],index*0.12,1.0))], installActions: screwActions(7,13) },
  { step: 8, page: 14, title: 'Mount Top Cap to Cabinet', subtitle: 'Insert four dowels, lower the complete cap vertically and drive ten #12 screws.', parts: ['top_cap'], hardware: '#6 ×4 · #12 ×10', wide: 's08-wide', macro: 's08-macro', partActions: [{ type:'move',target:'top_cap',from:[-145,-145,65],to:[0,0,0],at:0,duration:2.1,ease:'power2.inOut' }], installActions: [...hardwareActions(8), ...screwActions(8,12,1.2)] },
  { step: 9, page: 15, title: 'Install PDF-right D9 and #25 Bracket', subtitle: 'D9 mounts on the right inner face with ten #21 screws.', parts: ['D9','H25_R'], hardware: '#21 ×10 · #25 ×1 · #14 ×2', wide: 's09-wide', macro: 's09-macro', partActions: [installPart('D9','A2',[45,0,0]), installPart('H25_R','A2',[25,25,25],0.5)], installActions: [...screwActions(9,21), ...screwActions(9,14,2.5)] },
  { step: 10, page: 16, title: 'Install PDF-left D8, E5 and #25 Bracket', subtitle: 'D8 mirrors D9; E5 is centered at the PDF 284 mm lower offset and receives nine #24 screws.', parts: ['D8','E5','H25_L'], hardware: '#21 ×10 · #24 ×9 · #25 ×1 · #14 ×2', wide: 's10-wide', macro: 's10-macro', partActions: [installPart('D8','A1',[-45,0,0]), installPart('E5','B9',[0,0,65],0.35), installPart('H25_L','A1',[-25,25,25],0.7)], installActions: [...screwActions(10,21), ...screwActions(10,24,2.4), ...screwActions(10,14,4.8)] },
];

export const wf311613DirectorPlan: DirectorPlan = {
  id: 'wf311613-steps-01-10-director-plan',
  source: 'WF311613/WF311614/WF311615 PDF pages 9–16; approved 31-step DirectorPlan, implementation checkpoint 1–10',
  presentationReference: 'https://www.youtube.com/watch?v=0U14ugOw5vw',
  steps: stepInputs.map(buildStep),
};

export const wf311613Product: ProductDefinition = {
  id: 'wf311613-standalone-murphy-bed',
  name: 'WF311613 / WF311614 / WF311615 Standalone Murphy Bed',
  unit: 'cm',
  sourceNote: `PDF-authoritative parts and hardware for Steps 1–10. Hardware registry contains all ${wf311613HardwareCatalog.length} PDF IDs. Unprinted geometry is proportional and explicitly estimated.`,
  calibration: { conversion: '1 in = 2.54 cm', dimensions: [
    { label: 'Closed width', inches: 94.2, centimeters: 239.268, source: 'dimension_label', confidence: 'high' },
    { label: 'Closed height', inches: 88.5, centimeters: 224.79, source: 'dimension_label', confidence: 'high' },
    { label: 'Closed depth', inches: 15.7, centimeters: 39.878, source: 'dimension_label', confidence: 'high' },
  ] },
  evidenceGroups: [{ parts: parts.filter((part) => part.type === 'mesh').map((part) => part.id), ...estimated }],
  materials: {
    wood: { type: 'standard', color: '#bd8d5c', roughness: 0.58, metalness: 0.01, surface: 'wood', grainScale: 3.2 },
    panel: { type: 'standard', color: '#c99b69', roughness: 0.64, metalness: 0.01, surface: 'wood', grainScale: 2.3 },
    metal: { type: 'standard', color: '#252b2e', roughness: 0.28, metalness: 0.72, surface: 'metal' },
    fastener: { type: 'standard', color: '#d9dde0', roughness: 0.2, metalness: 0.86, surface: 'metal' },
    dowel: { type: 'standard', color: '#e0b978', roughness: 0.7, metalness: 0.01, surface: 'wood', grainScale: 1.2 },
  },
  parts,
};

export const wf311613Assembly = DirectorPlanCompiler.assembly(wf311613DirectorPlan);

const cameraPresets: VideoDefinition['cameraPresets'] = {
  's01-wide': { position: [15,520,120], target: [0,112,0], fov: 32 }, 's01-macro': { position: [-70,270,55], target: [-35,112,0], fov: 24 },
  's02-wide': { position: [-15,520,120], target: [0,112,0], fov: 32 }, 's02-macro': { position: [70,270,55], target: [35,112,0], fov: 24 },
  's03-wide': { position: [290,145,355], target: [0,105,0], fov: 34 }, 's03-macro': { position: [-175,48,105], target: [-112,28,0], fov: 22 },
  's04-wide': { position: [285,150,350], target: [0,105,-5], fov: 34 }, 's04-macro': { position: [-168,82,90], target: [-112,65,-12], fov: 21 },
  's05-wide': { position: [-285,155,350], target: [0,110,-5], fov: 34 }, 's05-macro': { position: [168,138,90], target: [112,123,-12], fov: 21 },
  's06-wide': { position: [285,175,345], target: [0,132,-5], fov: 34 }, 's06-macro': { position: [-168,195,88], target: [-112,185,-12], fov: 21 },
  's07-wide': { position: [-265,260,305], target: [-55,78,40], fov: 34 }, 's07-macro': { position: [-170,115,92], target: [-50,78,65], fov: 22 },
  's08-wide': { position: [375,255,500], target: [20,130,0], fov: 37 }, 's08-macro': { position: [160,268,145], target: [70,220,0], fov: 22 },
  's09-wide': { position: [345,145,420], target: [20,108,0], fov: 35 }, 's09-macro': { position: [162,68,84], target: [114,43,0], fov: 20 },
  's10-wide': { position: [20,155,485], target: [-55,108,0], fov: 35 }, 's10-macro': { position: [-162,75,88], target: [-112,60,0], fov: 20 },
};

export const wf311613Video: VideoDefinition = {
  id: 'wf311613-steps-01-10-director-review',
  title: 'WF311613 Standalone Murphy Bed — Steps 1–10 Director Review',
  width: 1280, height: 720, fps: 30, background: '#f1eee7',
  quickActions: [
    { id: 'play-review', label: 'Play Steps 1–10', sceneId: 'step-01', primary: true },
    { id: 'lower-frame', label: 'Step 3 lower frame', sceneId: 'step-03' },
    { id: 'top-cap', label: 'Step 8 top cap', sceneId: 'step-08' },
    { id: 'mechanisms', label: 'Step 10 mechanisms', sceneId: 'step-10' },
  ],
  cameraPresets,
  scenes: DirectorPlanCompiler.scenes(wf311613DirectorPlan),
  audio: { voiceover: null, music: null },
};
