import * as T from 'three';
import {GeometryFactory} from '@/engine/geometry/GeometryFactory';
import {createModel as previousModel,placements as previousPlacements} from '../p0-connections-v1/model';

export const representation='HUMAN B: NONLITERAL F RECONSTRUCTION — NOT OEM-CONFIRMED';
export const placements=previousPlacements.map(p=>({...p,position:[...p.position] as [number,number,number],outward:p.outward?[...p.outward] as [number,number,number]:undefined}));
function at(id:string,pos:[number,number,number],out?:[number,number,number]){const p=placements.find(p=>p.id===id)!;p.position=pos;if(out)p.outward=out;p.note='Human-authorized nonliteral F reconstruction/contact propagation. NOT OEM coordinates.';}
at('part-9-1',[0,914,18]);at('part-12-1',[0,829,-60]);at('part-13-1',[0,859.5,-268]);at('part-15-1',[0,744,104]);
for(let i=1;i<=2;i++){at(`part-10-${i}`,[i===1?-567:567,829,13.5]);at(`part-11-${i}`,[i===1?-189:189,829,113]);}
// Preserve all seven13 screws and ten15 screws; propagate their exterior faces.
for(const p of placements.filter(p=>p.step===5&&p.id.startsWith('hardware-D-')))p.position[2]=-277;
for(const p of placements.filter(p=>p.step===6&&p.id.startsWith('hardware-D-')))p.position[1]=735;
// Updated S8 backing ownership: three existing depth-rail axes into9, two front-post axes into10.
const sideD=placements.filter(p=>p.step===8&&p.id.startsWith('hardware-D-'));
sideD.forEach((p,i)=>{const sign=i<5?-1:1,j=i%5;at(p.id,[sign*594,j<3?914:j===3?800:876,j<3?[-230,0,230][j]:282],[sign,0,0]);});
for(let i=1;i<=8;i++){const rear=i<=4,sign=rear?-1:1;at(`hardware-F-${i}`,[-450+((i-1)%4)*300,744,sign*295],[0,0,sign]);}

export const boardSizes:Record<string,[number,number,number]>={
 'part-9-1':[1152,18,554],'part-12-1':[1116,152,18],'part-13-1':[1152,249,18],'part-15-1':[1152,18,346],
 'part-10-1':[18,152,545],'part-10-2':[18,152,545],'part-11-1':[18,152,328],'part-11-2':[18,152,328],
};
/** A new isolated revision. Previously accepted source/meshes are never overwritten. */
export function createModel(){
 const old=previousModel(true),r=old.r,rig=old.rig;
 for(const [id,size]of Object.entries(boardSizes)){
  const mesh=r.registry.require(id).children[0] as T.Mesh;
  mesh.geometry=GeometryFactory.create({type:'box',size,bevel:.8});
  const geo=mesh.geometry,pos=geo.getAttribute('position'),n=geo.getAttribute('normal'),uv=new Float32Array(pos.count*2),code=Number(id.split('-')[1]),longZ=code===10||code===11;
  for(let i=0;i<pos.count;i++){uv[i*2]=(longZ?pos.getZ(i):pos.getX(i))/620+code*.31;uv[i*2+1]=(Math.abs(n.getY(i))>.5?(longZ?pos.getX(i):pos.getZ(i)):pos.getY(i))/210+.27;}
  geo.setAttribute('uv',new T.BufferAttribute(uv,2));
 }
 for(const p of placements){if(p.id==='part-7-1'||p.id==='part-8-1')continue;const o=r.registry.require(p.id);o.position.set(...p.position);if(p.outward){if(p.orientation)o.rotation.set(...p.orientation);else o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...p.outward));}}
 // Fit the visible illustrative driver blade to the EXISTING visible cross recess.
 // No new receiver, slot or thread is added. These are display-tool proportions only.
 const tool=r.registry.require('hardware-M-1');
 for(const blade of tool.children.slice(2,4))(blade as T.Mesh).geometry=new T.BoxGeometry(1,4,1);
 rig.updateMatrixWorld(true);const baseline=r.registry.captureState();
 const reset=()=>{r.registry.restoreState(baseline);rig.position.set(0,0,0);rig.rotation.set(0,0,0);rig.updateMatrixWorld(true);};
 return{r,rig,reset,baseline};
}
