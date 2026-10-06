import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {GeometryFactory} from './GeometryFactory';
import type {FaceBore,GeometryDefinition} from '@/types/product';

function rayHits(geometry:THREE.BufferGeometry,origin:THREE.Vector3,direction:THREE.Vector3){
  const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
  mesh.updateMatrixWorld(true);
  const ray=new THREE.Raycaster(origin,direction.normalize());
  return ray.intersectObject(mesh,false);
}
const panel=(bores:FaceBore[]):GeometryDefinition=>({type:'bored-panel',size:[4,4,6],bevel:0,holes:[],faceBores:bores});
const xBore:FaceBore={axis:'x',position:[0,0,0],radius:.45};

describe('physical crossing and bounded bore meshes',()=>{
  it('unions perpendicular through bores without leaving internal walls',()=>{
    const g=GeometryFactory.create(panel([xBore,{axis:'z',position:[0,0,0],radius:.55}]));
    for(const offset of [0,.25,-.25]){
      expect(rayHits(g,new THREE.Vector3(10,offset,0),new THREE.Vector3(-1,0,0))).toHaveLength(0);
      expect(rayHits(g,new THREE.Vector3(0,offset,10),new THREE.Vector3(0,0,-1))).toHaveLength(0);
    }
    expect(rayHits(g,new THREE.Vector3(10,1,0),new THREE.Vector3(-1,0,0))[0].point.x).toBeCloseTo(2,5);
    g.dispose();
  });
  it('keeps a blind floor but opens it where a co-axial through bore crosses',()=>{
    const g=GeometryFactory.create(panel([xBore,{axis:'x',position:[0,0,0],radius:.8,face:'positive',depth:1.2}]));
    expect(rayHits(g,new THREE.Vector3(10,.25,0),new THREE.Vector3(-1,0,0))).toHaveLength(0);
    const hits=rayHits(g,new THREE.Vector3(10,.65,0),new THREE.Vector3(-1,0,0));
    expect(hits[0].point.x).toBeCloseTo(.8,4);
    expect(hits.at(-1)!.point.x).toBeCloseTo(-2,4);
    expect(rayHits(g,new THREE.Vector3(10,.85,0),new THREE.Vector3(-1,0,0))[0].point.x).toBeCloseTo(2,4);
    g.dispose();
  });
  it('clips a blind floor and walls against a crossing longitudinal bore',()=>{
    const g=GeometryFactory.create(panel([{axis:'z',position:[0,0,0],radius:.4},{axis:'x',position:[0,0,1],radius:.65,face:'positive',depth:2.6}]));
    const hits=rayHits(g,new THREE.Vector3(10,0,1),new THREE.Vector3(-1,0,0));
    expect(hits[0].point.x).toBeCloseTo(-.6,4);
    expect(rayHits(g,new THREE.Vector3(0,0,10),new THREE.Vector3(0,0,-1))).toHaveLength(0);
    g.dispose();
  });
  it('does not refill a non-rectangular profile when a bore misses its solid',()=>{
    const g=GeometryFactory.create({type:'profile-prism',axis:'x',depth:2,points:[[-2,-3],[2,-3],[2,3],[0,3],[0,0],[-2,0]],size:[2,4,6],preserveEndProfile:true,
      faceBores:[{axis:'x',position:[0,-1,1.5],radius:.3},{axis:'x',position:[0,1,1.5],radius:.3}]});
    expect(rayHits(g,new THREE.Vector3(10,-1,1.5),new THREE.Vector3(-1,0,0))).toHaveLength(0);
    expect(rayHits(g,new THREE.Vector3(10,1,1.5),new THREE.Vector3(-1,0,0))).toHaveLength(0);
    expect(rayHits(g,new THREE.Vector3(10,1,2.5),new THREE.Vector3(-1,0,0))[0].point.x).toBeCloseTo(1,4);
    g.dispose();
  });
  it('clips an existing extrusion hole wall against a face bore',()=>{
    const g=GeometryFactory.create({type:'bored-panel',size:[4,4,6],bevel:0,holes:[{x:0,z:0,radius:.5}],faceBores:[xBore]});
    expect(rayHits(g,new THREE.Vector3(10,.25,0),new THREE.Vector3(-1,0,0))).toHaveLength(0);
    expect(rayHits(g,new THREE.Vector3(0,10,0),new THREE.Vector3(0,-1,0))).toHaveLength(0);
    expect(g.boundingBox!.getSize(new THREE.Vector3()).toArray()).toEqual([4,4,6]);
    expect(Array.from(g.getAttribute('normal').array).every(Number.isFinite)).toBe(true);
    g.dispose();
  });
  it('opens a bounded counterbore around a pre-existing co-axial profile hole',()=>{
    const g=GeometryFactory.create({type:'profile-prism',axis:'x',depth:1,points:[[-2,-5],[2,-5],[2,5],[-2,5]],holes:[{x:0,y:-3,radius:.38}],size:[1,4,10],
      faceBores:[{axis:'x',position:[0,0,-3],radius:.70,face:'positive',depth:.8}]});
    expect(rayHits(g,new THREE.Vector3(10,0,-3),new THREE.Vector3(-1,0,0))).toHaveLength(0);
    expect(rayHits(g,new THREE.Vector3(10,.55,-3),new THREE.Vector3(-1,0,0))[0].point.x).toBeCloseTo(-.3,4);
    g.dispose();
  });
  it('normalizes clockwise profile hole walls before solid subtraction',()=>{
    const g=GeometryFactory.create({type:'profile-prism',axis:'x',depth:1,points:[[-2,3],[2,3],[2,-10],...Array.from({length:17},(_,i)=>[2*Math.cos(i*Math.PI/16),-10-2*Math.sin(i*Math.PI/16)] as [number,number])],holes:[{x:0,y:-10,radius:.38}],size:[1,4,15],
      faceBores:[{axis:'x',position:[0,0,-10],radius:.70,face:'negative',depth:.8}]});
    expect(rayHits(g,new THREE.Vector3(10,0,-10),new THREE.Vector3(-1,0,0))).toHaveLength(0);
    expect(rayHits(g,new THREE.Vector3(-10,.55,-10),new THREE.Vector3(1,0,0))[0].point.x).toBeCloseTo(.3,4);
    g.dispose();
  });
  it('keeps the finished beveled panel within its declared bounds, while opening the bore',()=>{
    const g=GeometryFactory.create({type:'bored-panel',size:[2,4,6],bevel:.04,holes:[],faceBores:[xBore]});
    expect(rayHits(g,new THREE.Vector3(10,.2,0),new THREE.Vector3(-1,0,0))).toHaveLength(0);
    expect(rayHits(g,new THREE.Vector3(10,.5,0),new THREE.Vector3(-1,0,0))[0].point.x).toBeCloseTo(1,4);
    expect(g.boundingBox!.getSize(new THREE.Vector3()).toArray()).toEqual([2,4,6]);
    g.dispose();
  });
});
