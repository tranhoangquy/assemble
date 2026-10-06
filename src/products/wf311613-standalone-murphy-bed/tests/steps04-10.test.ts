import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {steps01To10Plan as plan,steps01To10Assembly as assembly,steps01To10Video as video} from '../director/steps04-10';
import {steps01To10Product as product,capMembers,capWood,capOffset,topDowels,centerScrewY} from '../product/parts-step04-10';
import {directorPlan as prefix,reviewVideo as prefixVideo} from '../director/directorPlan';
import {step03CorrectedProduct as prefixProduct} from '../product/parts-step03';
import {DirectorPlanCompiler} from '@/engine/director/DirectorPlanCompiler';
import {AssemblyValidator} from '@/engine/assembly/AssemblyValidator';
import {ObjectRegistry} from '@/engine/product/ObjectRegistry';
import {AnimationEngine} from '@/engine/animation/AnimationEngine';
import {GeometryFactory} from '@/engine/geometry/GeometryFactory';

function runtime(){
  const registry=new ObjectRegistry();
  for(const part of product.parts){
    const group=new THREE.Group();group.position.set(...part.position);group.rotation.set(...(part.rotation??[0,0,0]).map(x=>x*Math.PI/180) as [number,number,number]);group.visible=part.visible??true;
    if(part.type==='mesh'&&part.geometryVariants){const g=new THREE.BoxGeometry(1,1,1);group.add(new THREE.Mesh(g));group.userData.geometryVariants=Object.fromEntries(Object.keys(part.geometryVariants).map(k=>[k,new THREE.BoxGeometry(2,2,2)]));}
    registry.register(part.id,group);
  }
  registry.captureBaseline();const engine=new AnimationEngine(registry,new Map(product.parts.map(p=>[p.id,p])));
  let cursor=0;for(const s of plan.steps){engine.addActions(DirectorPlanCompiler.actions(s),cursor);cursor+=s.shots.reduce((n,x)=>n+x.duration,0);}return{registry,engine,duration:cursor};
}
describe('PDF Steps 4–10 director checkpoint',()=>{
  it('locks every approved Step 1–3 shot, action, material, baseline geometry and camera',()=>{
    expect(plan.steps.slice(0,3)).toEqual(prefix.steps);
    expect(product.materials).toEqual(prefixProduct.materials);
    for(const p of prefixProduct.parts){const q=product.parts.find(q=>q.id===p.id)!;expect({...q,geometryVariants:undefined}).toEqual({...p,geometryVariants:undefined});}
    for(const [id,camera]of Object.entries(prefixVideo.cameraPresets))expect(video.cameraPresets[id]).toEqual(camera);
    expect(plan.steps.map(s=>s.step)).toEqual([1,2,3,4,5,6,7,8,9,10]);
  });
  it('starts ALL bolts, checks square, and only THEN tightens Steps 4–6',()=>{
    for(const n of [4,5,6]){
      const step=plan.steps[n-1],actions=DirectorPlanCompiler.actions(step),bolts=actions.filter(a=>a.type==='installBolt');
      expect(bolts).toHaveLength(n===6?4:2);
      const firstTighten=actions.find(a=>a.type==='rotate'&&a.to===900)!;
      expect(firstTighten.at).toBeGreaterThan(Math.max(...bolts.map(a=>a.at!+a.duration!)));
      const square=step.shots.findIndex(s=>s.id===`S${n}-square`),tighten=step.shots.findIndex(s=>s.type==='TIGHTEN_HARDWARE');expect(square).toBeLessThan(tighten);
      expect(actions.filter(a=>a.type==='installDowel')).toHaveLength(n===6?4:2);
      expect(actions.filter(a=>a.type==='installNut')).toHaveLength(n===6?4:2);
    }
  });
  it('builds all SEVEN top-cap wood members with SIX edge-driven screws',()=>{
    expect(capWood).toHaveLength(7);expect(capWood.filter(id=>id.startsWith('B1'))).toHaveLength(2);expect(capWood.filter(id=>id.startsWith('B2'))).toHaveLength(2);expect(capWood.filter(id=>id.startsWith('B4'))).toHaveLength(2);
    const screws=DirectorPlanCompiler.actions(plan.steps[6]).filter(a=>a.type==='installScrew');expect(screws).toHaveLength(6);
    for(const a of screws)if(a.type==='installScrew'){expect(a.spinAxis).toBe('z');expect(a.installation!.seatedOffset).toEqual(capOffset);}
    const rail=product.parts.find(p=>p.id==='B1-front')!,tie=product.parts.find(p=>p.id==='B3')!,screw=product.parts.find(p=>p.id==='S7-H13-3')!;
    if(rail.type!=='mesh'||rail.geometry.type!=='profile-prism'||tie.type!=='mesh'||tie.geometry.type!=='bored-panel'||screw.type!=='mesh'||screw.geometry.type!=='screw')throw new Error('Missing cap geometry');
    expect(rail.position[2]+rail.geometry.size![2]/2).toBeCloseTo(22); // Flush with approved side-post depth.
    expect(tie.geometry.size[2]/2-(screw.position[2]-screw.geometry.length/2)).toBeGreaterThan(2); // Real thread purchase into B2/B3.
  });
  it('carries the complete cap rigidly, clears the cabinet and seats on four dowels before ten screws',()=>{
    const rt=runtime(),step=plan.steps[7],start=video.scenes.slice(0,7).reduce((n,s)=>n+s.duration,0);
    let cursor=start;
    for(const s of step.shots){
      if(['S8-cap-lift','S8-cap-above','S8-lower-align','S8-cap-seat'].includes(s.id)){
        expect(s.actions.map(a=>'target'in a?a.target:'')).toEqual(capMembers);
        for(const progress of [.1,.5,.9]){
          rt.engine.seek(cursor+progress*s.actions[0].duration!);
          const origin=rt.registry.get(capMembers[0])!.position;
          for(const id of capMembers){const p=product.parts.find(p=>p.id===id)!,base=product.parts.find(p=>p.id===capMembers[0])!;expect(rt.registry.get(id)!.position.clone().sub(origin).distanceTo(new THREE.Vector3(...p.position).sub(new THREE.Vector3(...base.position))),id).toBeLessThan(1e-6);}
          if(s.id==='S8-cap-above')expect(origin.y-1.5).toBeGreaterThan(225);
        }
      }
      cursor+=s.duration;
    }
    expect(topDowels).toHaveLength(4);const actions=DirectorPlanCompiler.actions(step);expect(actions.filter(a=>a.type==='installScrew')).toHaveLength(10);
    const firstScrew=actions.find(a=>a.type==='installScrew')!,seat=actions.filter(a=>a.type==='move').at(-1)!;expect(firstScrew.at).toBeGreaterThan(seat.at!+seat.duration!);
    rt.engine.dispose();
  });
  it('maps D9 right, D8 left, E5 center and all nine #24 screws to the INTERIOR face',()=>{
    expect(product.parts.find(p=>p.id==='D9')!.position[0]).toBeGreaterThan(0);expect(product.parts.find(p=>p.id==='D8')!.position[0]).toBeLessThan(0);expect(product.parts.find(p=>p.id==='E5')!.position[0]).toBe(0);
    expect(centerScrewY).toHaveLength(9);expect(centerScrewY[1]-6).toBeCloseTo(28.4);
    for(const n of [9,10]){const actions=DirectorPlanCompiler.actions(plan.steps[n-1]);expect(actions.filter(a=>a.type==='installScrew'&&a.target.includes('H21'))).toHaveLength(10);expect(actions.filter(a=>a.type==='installScrew'&&a.target.includes('H14'))).toHaveLength(2);}
    const screws=DirectorPlanCompiler.actions(plan.steps[9]).filter(a=>a.type==='installScrew'&&a.target.includes('H24'));expect(screws).toHaveLength(9);
    expect(screws.map(a=>product.parts.find(p=>p.id===('target'in a?a.target:''))!.position[1])).toEqual([...centerScrewY].reverse());
    for(const a of screws)if(a.type==='installScrew')expect(a.installation!.approachDirection).toEqual([0,0,-1]);
  });
  it('has physical feed/rotation for every fastener, no pop-in, and no actions outside their shot',()=>{
    for(const step of plan.steps.slice(3))for(const s of step.shots)for(const a of s.actions){expect((a.at??0)+(a.duration??0)).toBeLessThanOrEqual(s.duration+1e-8);if(['installScrew','installBolt','installDowel','installNut'].includes(a.type)&&'installation'in a){expect(a.duration).toBeGreaterThan(.4);expect(a.installation?.mechanicalPhases).toBe(true);}}
    const result=AssemblyValidator.validate(product,assembly);expect(result.valid).toBe(true);expect(result.errors).toEqual([]);expect(result.warnings).toEqual([]);expect(result.operationsChecked).toBe(176);
  });
  it('restores variant geometry and assembled state on backward seek and registry reset',()=>{
    const rt=runtime(),mesh=rt.registry.get('A1')!.children[0] as THREE.Mesh,baseline=mesh.geometry;
    rt.engine.seek(rt.duration-.05);const end=product.parts.map(p=>rt.registry.get(p.id)!.position.clone());expect(mesh.geometry).not.toBe(baseline);
    rt.engine.seek(0);expect(mesh.geometry).toBe(baseline);rt.engine.seek(rt.duration-.05);
    product.parts.forEach((p,i)=>expect(rt.registry.get(p.id)!.position.distanceTo(end[i]),p.id).toBeLessThan(1e-6));
    rt.registry.reset();expect(mesh.geometry).toBe(baseline);rt.engine.dispose();
  });
  it('creates non-empty routed rails and mirrored metal profiles without invalid vertices',()=>{
    for(const id of ['B1-front','B1-rear','D8','D9','S7-H13-0']){const p=product.parts.find(p=>p.id===id)!;if(p.type!=='mesh')throw new Error('missing mesh');const g=GeometryFactory.create(p.geometry),a=g.getAttribute('position');expect(a.count).toBeGreaterThan(100);expect(Array.from(a.array).every(Number.isFinite)).toBe(true);g.dispose();}
  });
});
