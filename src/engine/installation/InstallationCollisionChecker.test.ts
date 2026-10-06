import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {InstallationCollisionChecker} from './InstallationCollisionChecker';
import type {ProductDefinition} from '@/types/product';
import type {ConnectedInstallAction} from './InstallationPathResolver';
import type {InstallationPath} from './InstallationPath';

const product:ProductDefinition={id:'rigid-transport-fixture',name:'Rigid transport fixture',unit:'cm',materials:{m:{type:'standard',color:'#888'}},parts:[
  {id:'moving',name:'Moving plate',type:'mesh',geometry:{type:'box',size:[2,2,2]},material:'m',position:[0,0,0]},
  {id:'secured',name:'Secured physical child',type:'mesh',geometry:{type:'box',size:[1,1,1]},material:'m',parent:'moving',position:[4,0,3]},
  {id:'nested',name:'Secured nested part',type:'mesh',geometry:{type:'box',size:[.5,.5,.5]},material:'m',parent:'secured',position:[0,0,1]},
  {id:'target',name:'Target',type:'mesh',geometry:{type:'box',size:[1,1,1]},material:'m',position:[0,0,0]},
  {id:'foreign',name:'Unrelated fixed part',type:'mesh',geometry:{type:'box',size:[1,1,1]},material:'m',position:[4,0,7]},
]};
const path:InstallationPath={operationId:'install',part:'moving',targetPart:'target',connectionPoint:'mount',approachDirection:new THREE.Vector3(0,0,1),waypoints:[
  {stage:'START',position:new THREE.Vector3(0,0,10)},
  {stage:'FINAL',position:new THREE.Vector3(0,0,0)},
]};
const action:ConnectedInstallAction={type:'installPart',target:'moving',connection:{part:'target',point:'mount'},installation:{collisionTolerance:.001,sampleCount:40}};

describe('rigid installation hierarchy collisions',()=>{
  it('does not collide with its own secured descendants at their old/final bounds',()=>{
    const ownOverlap=structuredClone(product);
    ownOverlap.parts.find(p=>p.id==='secured')!.position=[0,0,3];
    const result=new InstallationCollisionChecker(ownOverlap).check(path,action,new Set(['secured','nested']));
    expect(result).toHaveLength(0);
  });
  it('still detects a secured child crossing an unrelated blocker',()=>{
    const result=new InstallationCollisionChecker(product).check(path,action,new Set(['secured','nested','foreign']));
    expect(result.some(c=>c.movingPart==='secured'&&c.blockedBy==='foreign'&&!c.expected)).toBe(true);
  });
  it('sweeps nested secured children even when the parent itself clears',()=>{
    const fixture=structuredClone(product);
    fixture.parts.find(p=>p.id==='nested')!.position=[2,0,1];
    fixture.parts.find(p=>p.id==='foreign')!.position=[6,0,8];
    const result=new InstallationCollisionChecker(fixture).check(path,action,new Set(['secured','nested','foreign']));
    expect(result.some(c=>c.movingPart==='nested'&&c.blockedBy==='foreign')).toBe(true);
  });
});
