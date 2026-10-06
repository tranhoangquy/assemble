import type { PartDefinition, ProductDefinition, Vector3Tuple } from '@/types/product';
const estimated = { source: 'mechanically_inferred' as const, confidence: 'medium' as const, note: 'PDF page 9 controls topology and axes. Unprinted panel sizes, bores, cam envelope and groove clearance are proportional estimates, not manufacturing dimensions.' };
export const parts: PartDefinition[] = [];
export const cams: { id: string; bolt: string; host: string; x: number; side: number }[] = [];
for (const side of [-1, 1]) for (const [i, x] of [-109, -60, -40, 92].entries()) cams.push({ id: `cam-${side}-${i}`, bolt: `bolt-${side}-${i}`, host: i === 0 ? 'A8' : i === 1 ? 'A7' : 'A5', x, side });

function timber(id: string, size: Vector3Tuple, position: Vector3Tuple, grain: string, bored = false) {
  parts.push({ id, name: `${id} — PDF Step 1`, type: 'mesh', visible: false, position, material: grain, category: 'cabinet', evidence: estimated,
    geometry: bored ? { type: 'bored-panel', size, holes: cams.filter(c => c.host === id).map(c => ({ x: c.x - position[0], z: c.side * 12, radius: 0.8 })), edgeBores: [...cams.filter(c=>c.side<0&&c.host===id).map(c=>({x:c.x-position[0],radius:0.35})),...([{A8:-107.5,A7:-58.5,A5:99} as Record<string,number>][0][id]!==undefined?[{x:({A8:-107.5,A7:-58.5,A5:99} as Record<string,number>)[id]-position[0],radius:0.42}]:[])] } : { type: 'box', size, bevel: 0.08 },
    connectionPoints: [{ id: 'mount', position: [0,0,0], normal: [0,1,0], kind: 'mount' }] });
}
// Work-surface coordinates: X follows long upright; +Y is above the work surface.
// A1 is the near upright, A3 is the opposite upright; this is a flat side, NOT a shelf unit.
timber('A5', [165,3,28], [25.5,1.55,0], 'oak-x', true);
timber('A7', [6,3,28], [-60,1.55,0], 'oak-z', true);
timber('A8', [6,3,28], [-109,1.55,0], 'oak-z', true);
timber('A9', [43,1.2,28], [-85,1.55,0], 'oak-x');
timber('A1', [225,3,8], [0,1.55,-18], 'oak-x');
timber('A3', [225,3,8], [0,1.55,18], 'oak-x');
for (const id of ['A1','A3']) {
  const rail = parts.find(p=>p.id===id)!;
  if (rail.type==='mesh') rail.geometry={type:'bored-panel',boreAxis:'z',size:[225,3,8],holes:[...[-109,-60,-40,92].map(x=>({x,z:0,radius:0.35})),...[-107.5,-58.5,99].map(x=>({x,z:0,radius:0.42}))]};
}

export const dowels = [-1,1].flatMap(side => [-107.5,-58.5,99].map((x,i) => ({ id: `dowel-${side}-${i}`, side, x, host: i === 0 ? 'A8' : i === 1 ? 'A7' : 'A5' })));
for (const d of dowels) parts.push({ id: d.id, name: '#6 wood dowel Ø8 ×30 mm', type: 'mesh', geometry: { type:'fluted-dowel',radius:0.4,height:3 }, position:[d.x,1.55,d.side*14], rotation:[d.side * 90,0,0], material:'dowel',visible:false,category:'hardware',evidence:{source:'dimension_label',confidence:'high',note:'PDF hardware list #6: Ø8 ×30 mm.'} });
for (const c of cams) {
  parts.push({ id:c.id,name:'#8 horizontal-hole cam',type:'mesh',geometry:{type:'horizontal-cam',radius:0.75,height:1.1},position:[c.x,2.45,c.side*12],material:'zinc',visible:false,category:'hardware',evidence:estimated });
  parts.push({ id:c.bolt,name:'#5 1/4 inch ×100 mm bolt',type:'mesh',geometry:{type:'socket-bolt',radius:0.3175,height:10},position:[c.x,1.55,c.side*17],rotation:[c.side*90,0,0],material:'zinc',visible:false,category:'hardware',evidence:{source:'dimension_label',confidence:'high',note:'PDF #5 thread diameter and length; head/thread pitch modeled proportionally.'} });
}

export const step01V2Product: ProductDefinition = {id:'wf311613-step01-v2',name:'WF311613 / WF311614 / WF311615 Standalone Murphy Bed — Step 1 V2',unit:'cm',rendering:{lighting:'instructional-review',cameraControls:'instructional'},sourceNote:estimated.note,parts,materials:{
  'oak-x':{type:'standard',color:'#947857',finish:'oak-review',grainAxis:'x',surface:'wood',roughness:0.55},
  'oak-z':{type:'standard',color:'#997d5b',finish:'oak-review',grainAxis:'z',surface:'wood',roughness:0.55},
  dowel:{type:'standard',color:'#d0b38c',finish:'oak-review',grainAxis:'y',surface:'wood'},
  zinc:{type:'standard',color:'#c3c8cc',roughness:0.24,metalness:0.92,surface:'metal'},
}};
