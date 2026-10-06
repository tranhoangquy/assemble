import {describe,it,expect} from 'vitest';
import {cabinetFace,cabinetInnerWidth,b8PanelWidth,b8CenterX,b8Staging,b8Insertion,steps01To10Product as product,rows} from '../product/parts-step04-10';
import {steps01To10Plan as plan,steps01To10Video as video} from '../director/steps04-10';
import {validateB8Face,actualRayBoundaryResidual} from '../validation/b8-validation';
import * as THREE from 'three';
import {b8ReviewCheckpoints} from '../validation/b8-checkpoints';

describe('B8 closed cabinet-face geometry',()=>{
  it('distinguishes tangent floating-point boundaries from a real gap beyond the existing numerical guard',()=>{
    const ray=new THREE.Ray(new THREE.Vector3(0,.4,-10),new THREE.Vector3(0,0,1));
    const boundary=(x:number)=>new THREE.Triangle(new THREE.Vector3(x,0,0),new THREE.Vector3(x,1,0),new THREE.Vector3(x+1,0,0));
    expect(actualRayBoundaryResidual(ray,[boundary(3e-16)])).toBeLessThan(1e-10);
    // This is an actual triangle-edge separation, with no adjacent-ray
    // substitution. A gap beyond 1e-4 cm must remain a daylight failure.
    expect(actualRayBoundaryResidual(ray,[boundary(1.01e-4)])).toBeGreaterThan(1e-4);
    expect(actualRayBoundaryResidual(ray,[boundary(.01)])).toBeGreaterThan(1e-4);
  });
  it('derives all six widths and origins from one side–panel–center–panel–side span',()=>{
    expect(cabinetInnerWidth).toBe(233);expect(b8PanelWidth).toBeCloseTo(113.85);expect(b8CenterX).toBeCloseTo(59.575);
    expect(2*b8PanelWidth+cabinetFace.centerWidth).toBeCloseTo(cabinetInnerWidth);
    for(const row of rows)for(const side of [-1,1]){
      const panel=product.parts.find(p=>p.id===`B8-${row.step}-${side}`)!;
      if(panel.type!=='mesh'||panel.geometry.type!=='box')throw new Error('Missing B8');
      expect(panel.geometry.size).toEqual([b8PanelWidth,row.top-row.bottom-6,1.2]);
      expect(panel.position).toEqual([side*b8CenterX,(row.bottom+row.top)/2,18]);
      expect(panel.geometry.bevel).toBe(.04);
    }
  });
  it('keeps supporting rail spans, B7 and hardware locations unchanged',()=>{
    for(const id of ['D4-1','D4-2','B5','B6']){
      const rail=product.parts.find(p=>p.id===id)!;
      if(rail.type!=='mesh'||rail.geometry.type!=='bored-panel')throw new Error('Missing rail');
      expect(rail.geometry.size).toEqual([233,6,3]);expect(rail.position[0]).toBe(0);
    }
    for(const row of rows)expect(product.parts.find(p=>p.id===`B7-${row.step}`)!.position[0]).toBe(0);
  });
  it('clears the support easing without changing action speed or playback camera presets',()=>{
    expect(video.scenes.map(s=>s.duration)).toEqual([40.897333333333314,25.646722222222202,31.722222222222204,13.549999999999999,13.549999999999999,19.749999999999996,17.53,19.180000000000007,16.130000000000006,27.970000000000006]);
    for(const row of rows)for(const side of [-1,1]){
      const shot=plan.steps[row.step-1].shots.find(s=>s.id===`S${row.step}-B8-${row.step}-${side}-seat`)!;
      expect(shot.duration).toBe(1.05);expect(shot.camera).toBe(`S${row.step}-context`);
      const a=shot.actions[0];expect(a.duration).toBe(.93);
      if(a.type!=='installPart')throw new Error('Missing insertion');
      expect(a.installation?.stagingOffset).toEqual(b8Staging(side));expect(a.installation?.approachDirection).toEqual([0,1,0]);
      expect(a.installation?.preInstallOffset).toEqual([-side*b8Insertion.clearance,b8Insertion.clearance,3]);
      expect(a.installation?.approachDistance).toBe(b8Insertion.clearance);
    }
    expect(b8ReviewCheckpoints).toHaveLength(6);
    // Inspection camera data is never added to the playback camera dictionary.
    for(const checkpoint of b8ReviewCheckpoints)expect(video.cameraPresets[checkpoint.name]).toBeUndefined();
  });
  it('has no daylight rays, no generated-mesh penetration, clear actual insertion paths and aligned receivers',()=>{
    const result=validateB8Face();
    expect(result.errors).toEqual([]);expect(result.valid).toBe(true);
    expect(result.panelsChecked).toBe(6);expect(result.pathSamples).toBe(549);expect(result.closureRays).toBe(144);expect(result.hardwareJointsChecked).toBe(8);
    expect(result.sweptSegments).toBe(27);
    expect(result.maxActualBoundaryResidualCm).toBeLessThanOrEqual(1e-4);
    // The interior view looks along +Z, so PDF-right (+X) appears screen-left.
    expect(result.upperCornerSurfaceHits).toEqual(['S9-H25-bend','S10-H25-bend']);
    expect(result.nominalOuterSeamCm).toBeCloseTo(0);expect(result.nominalCenterSeamCm).toBeCloseTo(0);expect(result.nominalHorizontalSeamCm).toBe(0);
  },180000);
});
