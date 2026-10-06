import * as THREE from 'three';
import {describe,it,expect} from 'vitest';
import {GeometryFactory} from '@/engine/geometry/GeometryFactory';
import {findActualMeshPenetration,validateFoldingLegFunction} from '../validation/folding-leg-validation';

function mesh(g:THREE.BufferGeometry,position:[number,number,number]=[0,0,0]){
  const m=new THREE.Mesh(g);m.position.set(...position);m.updateMatrixWorld(true);return m;
}

describe('Actual-solid folding-leg collision gate',()=>{
  it('accepts exact seating contact but rejects physical overlap and containment',()=>{
    const a=mesh(new THREE.BoxGeometry(2,2,2)),touching=mesh(new THREE.BoxGeometry(2,2,2),[2,0,0]);
    const overlapping=mesh(new THREE.BoxGeometry(2,2,2),[1.96,0,0]),contained=mesh(new THREE.BoxGeometry(.2,.2,.2));
    try{
      expect(findActualMeshPenetration(a,touching)).toBeUndefined();
      expect(findActualMeshPenetration(a,overlapping)).toBeDefined();
      expect(findActualMeshPenetration(a,contained)?.source).toBe('contained-vertex');
    }finally{for(const m of[a,touching,overlapping,contained])m.geometry.dispose();}
  });

  it('detects a crossing where neither beam contains a vertex of the other',()=>{
    const a=mesh(new THREE.BoxGeometry(6,.3,.4)),b=mesh(new THREE.BoxGeometry(.3,6,.4));
    try{expect(findActualMeshPenetration(a,b)).toBeDefined();}
    finally{a.geometry.dispose();b.geometry.dispose();}
  });

  it('requires an actual generated through-bore rather than accepting a metadata mate',()=>{
    const wood=mesh(GeometryFactory.create({type:'bored-panel',size:[4,8,8],bevel:0,holes:[],faceBores:[{axis:'x',position:[0,0,0],radius:.45}]}));
    const unbored=mesh(new THREE.BoxGeometry(4,8,8)),shaft=mesh(new THREE.CylinderGeometry(.3,.3,6,32));
    shaft.rotation.z=Math.PI/2;shaft.updateMatrixWorld(true);
    try{
      expect(findActualMeshPenetration(wood,shaft)).toBeUndefined();
      expect(findActualMeshPenetration(unbored,shaft)).toBeDefined();
    }finally{wood.geometry.dispose();unbored.geometry.dispose();shaft.geometry.dispose();}
  });

  it('rejects a coarse sampling request and validates the complete connected function at quarter-degree resolution',()=>{
    expect(()=>validateFoldingLegFunction(1)).toThrow(/0.25/);
    const result=validateFoldingLegFunction(.25);
    expect(result.errors).toEqual([]);expect(result.valid).toBe(true);
    expect(result.sampledPoses).toBe(1446);
    expect(result.checkpoints.map(p=>p.progress)).toEqual(Array.from({length:11},(_,i)=>i/10));
    expect(Object.values(result.gates).every(Boolean)).toBe(true);
    expect(result.minFloorClearance).toBeGreaterThanOrEqual(-result.contactTolerance);
  },600000);
});
