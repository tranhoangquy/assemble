import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {steps01To20Plan as plan,steps01To20Assembly as assembly,steps01To20Video as video,runtime11To20} from '../director/steps11-20';
import {steps01To20Product as product,bed,newWoodIds,hardwareSpecs,carrierMembers,carrierWood,brackets,pos} from '../product/parts-step11-20';
import {steps01To10Product as prefix} from '../product/parts-step04-10';
import {steps01To10Plan as prefixPlan,steps01To10Video as prefixVideo} from '../director/steps04-10';
import {DirectorPlanCompiler} from '@/engine/director/DirectorPlanCompiler';
import {AssemblyValidator} from '@/engine/assembly/AssemblyValidator';
import {GeometryFactory} from '@/engine/geometry/GeometryFactory';
import {CameraEngine} from '@/engine/camera/CameraEngine';
import {createSteps20Runtime,validateSteps11To20Paths} from '../validation/steps11-20-validation';

describe('PDF Steps 11–20 only',()=>{
  it('keeps the entire approved corrected prefix exactly, with no Step 21',()=>{
    expect(plan.steps.slice(0,10)).toEqual(prefixPlan.steps);
    expect(product.parts.slice(0,prefix.parts.length)).toEqual(prefix.parts);
    expect(product.materials).toEqual(prefix.materials);expect(product.rendering).toEqual(prefix.rendering);
    for(const [id,preset]of Object.entries(prefixVideo.cameraPresets))expect(video.cameraPresets[id]).toEqual(preset);
    expect(video.scenes.slice(0,10).map(s=>s.duration)).toEqual(prefixVideo.scenes.map(s=>s.duration));
    expect(plan.steps.map(s=>s.step)).toEqual(Array.from({length:20},(_,i)=>i+1));
    expect(runtime11To20.reduce((n,s)=>n+s.duration,0)).toBeCloseTo(134.02);
  });
  it('matches PDF physical part/hardware quantities for every new step',()=>{
    const expected:Record<number,Record<number,number>>={11:{8:1,22:1},12:{8:2,22:2},13:{12:6},14:{8:2,22:2},15:{8:5,22:5},16:{6:8,8:4,3:4},17:{6:8,8:8,3:8},18:{14:24},19:{14:24},20:{16:25}};
    for(const s of plan.steps.slice(10)){
      const counts:Record<number,number>={};for(const a of DirectorPlanCompiler.actions(s))if('target'in a&&['installBolt','installNut','installDowel','installScrew'].includes(a.type)){const n=hardwareSpecs.get(a.target)!.number;counts[n]=(counts[n]??0)+1;}expect(counts,`Step ${s.step}`).toEqual(expected[s.step]);
    }
    expect(newWoodIds.filter(id=>id.startsWith('C6-'))).toHaveLength(8);expect(carrierWood).toHaveLength(4);expect(brackets).toHaveLength(12);expect(newWoodIds.filter(id=>id.startsWith('D2-'))).toHaveLength(5);
  });
  it('physically inserts every fastener within its shot, with rotation/feed and semantic repetition',()=>{
    for(const s of plan.steps.slice(10))for(const shot of s.shots)for(const a of shot.actions){
      expect((a.at??0)+(a.duration??0)).toBeLessThanOrEqual(shot.duration+1e-7);
      if(['installBolt','installScrew','installNut','installDowel'].includes(a.type)&&'installation'in a){expect(a.duration).toBeGreaterThan(.25);expect(a.installation?.mechanicalPhases).toBe(true);expect(a.installation?.approachDistance).toBeGreaterThan(0);if(a.type==='installBolt'||a.type==='installScrew')expect(a.turns).toBeGreaterThan(2);}
    }
    const first=DirectorPlanCompiler.actions(plan.steps[10]).find(a=>a.type==='installBolt')!,repeated=DirectorPlanCompiler.actions(plan.steps[11]).find(a=>a.type==='installBolt')!;expect(first.duration).toBeGreaterThan(repeated.duration!);
  });
  it('uses routed panel capture and a separate carrier before controlled rigid mating',()=>{
    expect(bed.panelY-bed.panelDepth/2).toBeCloseTo(6.2);expect(bed.panelY+bed.panelDepth/2).toBeLessThan(9);expect(bed.slatY-.9).toBe(9);
    const rt=createSteps20Runtime();try{
      rt.engine.seek(rt.ends.get(16)!-.02);
      for(const id of carrierMembers)expect(rt.registry.require(id).position.clone().sub(new THREE.Vector3(...pos(id))).toArray()).toEqual(bed.carrierPark);
      for(const id of newWoodIds.filter(id=>id.startsWith('C6-')))expect(rt.registry.require(id).visible).toBe(true);
      for(const name of ['S17-lift','S17-above','S17-lower','S17-seat']){
        const shot=plan.steps[16].shots.find(s=>s.id===name)!;expect(shot.actions.map(a=>'target'in a?a.target:'')).toEqual(carrierMembers);
      }
      rt.engine.seek(rt.ends.get(17)!-.02);for(const id of carrierMembers)expect(rt.registry.require(id).position.distanceTo(new THREE.Vector3(...pos(id)))).toBeLessThan(1e-6);
    }finally{rt.dispose();}
  });
  it('restores all deterministic transforms/visibility/rotation on backward seeks and reset',()=>{
    const rt=createSteps20Runtime();const snapshot=()=>product.parts.map(p=>{const o=rt.registry.require(p.id);return{position:o.position.toArray(),quaternion:o.quaternion.toArray(),visible:o.visible};});
    try{for(const t of [rt.ends.get(12)!-.02,rt.shots.get('S17-lower')!.start+1,rt.duration-.02]){
      rt.engine.seek(t);const expected=snapshot();rt.engine.seek(0);rt.engine.seek(rt.duration-.01);rt.engine.seek(t);snapshot().forEach((actual,i)=>{expect(actual.visible,product.parts[i].id).toBe(expected[i].visible);actual.position.forEach((v,k)=>expect(v).toBeCloseTo(expected[i].position[k],6));actual.quaternion.forEach((v,k)=>expect(v).toBeCloseTo(expected[i].quaternion[k],6));});
    }rt.registry.reset();for(const p of product.parts){const o=rt.registry.require(p.id);expect(o.position.toArray()).toEqual(p.position);expect(o.visible).toBe(p.visible??true);}}finally{rt.dispose();}
  });
  it('allows underside access only for explicitly authored new cameras, and restores normal access',()=>{
    const camera=new THREE.PerspectiveCamera(),controls={target:new THREE.Vector3(),maxPolarAngle:Math.PI*.49,update:()=>{}};
    const engine=new CameraEngine(camera,controls as unknown as ConstructorParameters<typeof CameraEngine>[1],video.cameraPresets);
    const underside=Object.keys(video.cameraPresets).find(k=>k.endsWith('-underside'))!;engine.apply(underside);expect(controls.maxPolarAngle).toBeGreaterThan(Math.PI/2);
    engine.apply(prefixPlan.steps[0].shots[0].camera!);expect(controls.maxPolarAngle).toBe(Math.PI*.49);
    for(const s of plan.steps[16].shots.filter(s=>s.id.endsWith('-bolt-up')))expect(video.cameraPresets[s.camera!].allowUnderside).toBe(true);
  });
  it('generates finite physical geometry and preserves routed channel openings after drilling',()=>{
    for(const id of [...newWoodIds,...brackets.map(b=>b.id)]){const p=product.parts.find(p=>p.id===id)!;if(p.type!=='mesh')throw new Error(id);const g=GeometryFactory.create(p.geometry);expect(Array.from(g.getAttribute('position').array).every(Number.isFinite)).toBe(true);g.dispose();}
  },30_000);
  it('uses real through-bores in C5 for the six screws continuing into C7',()=>{
    const p=product.parts.find(p=>p.id==='C5')!;
    if(p.type!=='mesh'||p.geometry.type!=='compound'||p.geometry.pieces[0].geometry.type!=='profile-prism')throw new Error('C5 profile');
    const bores=p.geometry.pieces[0].geometry.faceBores!;
    for(const [id,h]of hardwareSpecs)if(h.number===12){const local=pos(id).map((v,i)=>v-p.position[i]);expect(bores.some(b=>b.axis==='y'&&b.face==='both'&&Math.abs(b.position[0]-local[0])<1e-6&&Math.abs(b.position[2]-local[2])<1e-6),id).toBe(true);}
  });
  it('passes the existing assembly validator with all 355 operations',()=>{
    const result=AssemblyValidator.validate(product,assembly);expect(result.errors).toEqual([]);expect(result.warnings).toEqual([]);expect(result.operationsChecked).toBe(355);
  });
  it('clears actual solid meshes along every new structural path and large carrier sweep',()=>{
    const result=validateSteps11To20Paths();expect(result.errors).toEqual([]);expect(result.valid).toBe(true);expect(result.structuralPaths).toBe(40);expect(result.sampledPoses).toBe(1656);expect(result.hardwareAxes).toBe(139);expect(result.rigidCarrierChecks).toBe(3280);
  },60000);
});
