import fs from 'node:fs';import * as THREE from 'three';
const out='output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit',inv=JSON.parse(fs.readFileSync(`${out}/data-inventory.json`)),m=JSON.parse(fs.readFileSync(`${out}/capture-manifest.json`));const extra=[];
function add(id,state,ids,dir,pad=2){const s=inv.states.find(s=>s.name===state),b=new THREE.Box3();for(const name of ids){const a=s.items.find(x=>x.id===name);if(a)b.union(new THREE.Box3(new THREE.Vector3(...a.bounds[0]),new THREE.Vector3(...a.bounds[1])));}if(b.isEmpty())throw Error(id+' missing '+ids);b.expandByScalar(pad);const target=b.getCenter(new THREE.Vector3()),distance=b.getSize(new THREE.Vector3()).length()*.5/Math.sin(38*Math.PI/360)*1.05;extra.push({id,group:'closeups',time:s.time,title:id,partIds:ids,camera:{position:target.clone().add(new THREE.Vector3(...dir).normalize().multiplyScalar(distance)).toArray(),target:target.toArray(),fov:38}});}
for(const [side,step,panel,posts]of [['left',1,'A5',['A1','A3']],['right',2,'A6',['A2','A4']]]){add(`joint-${side}-early-panel-top`,`step-${step}`,[panel],[0,1,.02]);for(const post of posts)add(`joint-${post}-early-cams`,`step-${step}`,[post],[0,1,.15]);}
for(const side of [-1,1]){
 const hand=side<0?'left':'right',inside=[-side,.35,-.6];
 for(const n of [4,5,6])add(`joint-B8-${n}-${hand}`,'step-10',[`B8-${n}-${side}`],inside,8);
 for(const [label,state,ids,pad]of [['bearing',side<0?'step-23':'step-24',[`S${side<0?23:24}-H19`],8],['pivot25','step-25',[`E1-${side}`],7],['mechanism26','step-26',[`E1-${side}`],7],['piston27','step-27',[`E2-${side}`],5],['piston-open','open',[`E2-${side}`],5],['leg29','step-29',[`leg-${side}`],5],['leg-open','open',[`leg-${side}`],5]])add(`joint-${label}-${hand}`,state,ids,inside,pad);
 for(const i of [0,1])add(`joint-wall-${hand}-${i}`,'step-31',[`S${side<0?30:31}-H15-${i}`],[side,.3,-.8],12);
 const panel=side<0?'A5':'A6';add(`joint-side-${hand}-outer`,'step-31',[panel],[side,.15,-.1]);add(`joint-side-${hand}-inner`,'open',[panel],[-side,.15,-.3]);
}
for(const [label,state,ids,dir]of [['grid-top','step-17',['C1-start','C1-close','C2-left','C2-right'],[0,1,.02]],['carrier-top','step-20',['C8-left','C8-right','C9','D1'],[0,1,.02]],['ties-top','step-19',['C7-0','C7-1','C7-2'],[0,1,.02]]])add('joint-'+label,state,ids,dir);
fs.writeFileSync(`${out}/extra-manifest.json`,JSON.stringify(extra,null,2));fs.writeFileSync(`${out}/capture-manifest.json`,JSON.stringify([...m,...extra],null,2));console.log(extra.length);
