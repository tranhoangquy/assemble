import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {GeometryFactory} from '@/engine/geometry/GeometryFactory';
import {MaterialFactory} from '@/engine/materials/MaterialFactory';
import {ObjectRegistry} from '@/engine/product/ObjectRegistry';
import {ProductEngine} from '@/engine/product/ProductEngine';
import type {ProductDefinition,Vector3Tuple} from '@/types/product';

export const status='VISUAL_APPROXIMATION' as const;
// Display coordinates ONLY. None of these dimensions is a measured OEM size.
export const displayEnvelope={width:1200,height:1000,depth:620,unit:'display units, not a dimension claim'};
export const counts:Record<string,number>={'1':1,'2':1,'3':1,'4':1,'5':1,'6':4,'7':1,'8':1,'9':1,'10':2,'11':2,'12':1,'13':1,'14':1,'15':1};
export const hardwareCounts:Record<string,number>={A:5,B:4,C:18,D:39,E:8,F:8,G:4,H:4,I:2,J:2,K:2,L:1,M:1,N:4,O:1};
export const finishes={crafted:{wood:'#77533b',metal:'#292c2f',steel:'#a3a9ac',label:'Crafted Frame / smoked brown + charcoal'},linen:{wood:'#b19a76',metal:'#484a45',steel:'#b4b7b4',label:'Quiet Oak / pale oak + warm graphite'}};
export type Finish=keyof typeof finishes;
const V=(v:Vector3Tuple)=>new T.Vector3(...v);
const product:ProductDefinition={id:'product03-offline-visual-prototype-v1',name:'Pet crate / preliminary visual study',unit:'mm',sourceNote:'Unit field is an engine adapter only. All product coordinates are unmeasured visual display units.',materials:{},parts:Object.entries(counts).flatMap(([code,n])=>Array.from({length:n},(_,i)=>({id:`part-${code}-${i+1}`,name:`Source part ${code} / ${i+1}`,type:'group' as const,position:[0,0,0] as Vector3Tuple,evidence:{source:'image_visible' as const,confidence:'low' as const,note:status}})))};

function box(size:Vector3Tuple,material:T.Material,position:Vector3Tuple=[0,0,0],bevel=.5){const m=new T.Mesh(GeometryFactory.create({type:'box',size,bevel}),material);m.position.set(...position);m.castShadow=m.receiveShadow=true;return m;}
function beam(a:Vector3Tuple,b:Vector3Tuple,width:number,depth:number,material:T.Material){const av=V(a),bv=V(b),m=box([width,av.distanceTo(bv),depth],material);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),V(b).sub(V(a)).normalize());return m;}
function cylinder(r:number,h:number,material:T.Material,y=0,segments=32){const m=new T.Mesh(new T.CylinderGeometry(r,r,h,segments),material);m.position.y=y;m.castShadow=m.receiveShadow=true;return m;}
function mergeCategory(g:T.Group,material:T.Material){g.updateMatrixWorld(true);const geos:T.BufferGeometry[]=[];g.traverse(o=>{if(o instanceof T.Mesh){const c=o.geometry.clone();c.applyMatrix4(o.matrixWorld);geos.push(c.index?c.toNonIndexed():c);}});const out=mergeGeometries(geos);if(!out)throw Error('Cannot merge visual component');g.clear();const mesh=new T.Mesh(out,material);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);return g;}

function wood(seed:number){
 const w=512,h=256,color=new Uint8Array(w*h*4),relief=new Uint8Array(w*h*4);
 const hash=(x:number,y:number)=>{const a=Math.sin(x*127.1+y*311.7+seed)*43758.5453;return a-Math.floor(a);};
 const noise=(x:number,y:number)=>{const ix=Math.floor(x),iy=Math.floor(y);let a=x-ix,b=y-iy;a=a*a*(3-2*a);b=b*b*(3-2*b);return T.MathUtils.lerp(T.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),a),T.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),a),b);};
 const periodic=(u:number,v:number,sx:number,sy:number)=>{const a=u*u*(3-2*u),b=v*v*(3-2*v);return T.MathUtils.lerp(T.MathUtils.lerp(noise(u*sx,v*sy),noise((u-1)*sx,v*sy),a),T.MathUtils.lerp(noise(u*sx,(v-1)*sy),noise((u-1)*sx,(v-1)*sy),a),b);};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/w,v=y/h,flow=(periodic(u,v,3,4)-.5)*.12+(periodic(u,v,9,8)-.5)*.025;
  const ring=Math.sin(((v+flow)*17+periodic(u,v,2,7)*1.3)*Math.PI*2);
  const fiber=Math.pow(.5+.5*Math.sin((v+flow)*Math.PI*2*101+periodic(u,v,7,21)*4),16);
  const fine=hash(x,y)-.5;
  const value=.96+ring*.022+(periodic(u,v,4,12)-.5)*.10-fiber*.045+fine*.016,idx=(y*w+x)*4;
  color[idx]=color[idx+1]=color[idx+2]=Math.max(0,Math.min(255,Math.round(255*value)));color[idx+3]=255;
  relief[idx]=relief[idx+1]=relief[idx+2]=Math.round(140+ring*4-fiber*16);relief[idx+3]=255;
 }
 const tex=(data:Uint8Array,srgb=false)=>{const t=new T.DataTexture(data,w,h);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;if(srgb)t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t;};
 const m=MaterialFactory.create({type:'standard',color:'#77533b',roughness:.62});m.transparent=false;m.map=tex(color,true);m.bumpMap=tex(relief);m.bumpScale=.025;return m;
}

/** Clipped diagonal lattice inside the source frame, not separate OEM slat IDs. */
function lattice(width:number,height:number,material:T.Material){const g=new T.Group();const lo=-width/2,hi=width/2,bot=-height/2,top=height/2;
 for(const slope of [-1.55,1.55])for(let c=-height/2-1.55*width/2;c<=height/2+1.55*width/2;c+=54){
  const hits:[number,number][]=[];
  for(const x of [lo,hi]){const y=slope*x+c;if(y>=bot&&y<=top)hits.push([x,y]);}
  for(const y of [bot,top]){const x=(y-c)/slope;if(x>lo&&x<hi)hits.push([x,y]);}
  if(hits.length>=2)g.add(beam([hits[0][0],hits[0][1],0],[hits[1][0],hits[1][1],0],1.9,1.9,material));
 }return mergeCategory(g,material);}

function panelFrame(width:number,height:number,metal:T.Material,cross=true){const g=new T.Group();
 for(const x of [-width/2,width/2])g.add(box([18,height+18,18],metal,[x,0,0],.8));
 for(const y of [-height/2,height/2])g.add(box([width,18,18],metal,[0,y,0],.8));
 const wires=lattice(width-30,height-30,metal);wires.position.z=-2;g.add(wires);
 if(cross){g.add(beam([-width/2+12,-height/2+12,5],[width/2-12,height/2-12,5],14,4,metal));g.add(beam([width/2-12,-height/2+12,7],[-width/2+12,height/2-12,7],14,4,metal));}
 return mergeCategory(g,metal);
}
function plateWithVisibleHoles(w:number,h:number,depth:number,holes:[number,number,number][],material:T.Material){const shape=new T.Shape();shape.moveTo(-w/2,-h/2);shape.lineTo(w/2,-h/2);shape.lineTo(w/2,h/2);shape.lineTo(-w/2,h/2);shape.closePath();for(const [x,y,r]of holes){const p=new T.Path();p.absarc(x,y,r,0,Math.PI*2,true);shape.holes.push(p);}const geo=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:24});geo.translate(0,0,-depth/2);return new T.Mesh(geo,material);}
function hinge(material:T.Material){const g=new T.Group();for(const x of [-7,7]){const leaf=plateWithVisibleHoles(12,30,1.5,[[0,-8,2],[0,8,2]],material);leaf.position.x=x;g.add(leaf);}for(const y of [-10,0,10])g.add(cylinder(3.3,9,material,y));return g;}
function handle(material:T.Material){const g=new T.Group();g.add(beam([0,-45,0],[0,45,0],7,7,material));for(const y of [-45,45])g.add(box([7,7,16],material,[0,y,-7]));return g;}
function squareArc(material:T.Material){const shape=new T.Shape();shape.moveTo(-9,-9);shape.lineTo(9,-9);shape.lineTo(9,9);shape.lineTo(-9,9);shape.closePath();const curve=new T.CatmullRomCurve3([new T.Vector3(0,0,-286),new T.Vector3(0,0,220),new T.Vector3(0,-4,255),new T.Vector3(0,-15,276),new T.Vector3(0,-40,286)]);const m=new T.Mesh(new T.ExtrudeGeometry(shape,{extrudePath:curve,steps:48,bevelEnabled:false}),material);m.position.y=980;m.castShadow=true;return m;}

function shapeHead(radius:number,depth:number,drive:'hex'|'cross',material:T.Material){const s=new T.Shape();s.absarc(0,0,radius,0,Math.PI*2,false);const h=new T.Path();if(drive==='hex'){for(let i=0;i<6;i++){const a=-i/6*Math.PI*2;const x=Math.cos(a)*radius*.48,y=Math.sin(a)*radius*.48;if(i)h.lineTo(x,y);else h.moveTo(x,y);}h.closePath();}else{const w=radius*.18,l=radius*.62;const xy=[[-w,-l],[w,-l],[w,-w],[l,-w],[l,w],[w,w],[w,l],[-w,l],[-w,w],[-l,w],[-l,-w],[-w,-w]];xy.forEach(([x,y],i)=>i?h.lineTo(x,y):h.moveTo(x,y));h.closePath();}s.holes.push(h);const mesh=new T.Mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:32}),material);mesh.rotation.x=-Math.PI/2;const g=new T.Group();g.add(mesh,cylinder(radius,.35,material,-.175));return g;}

/** Source-supported external silhouettes only. No helix, concealed bore, or thread. */
export function hardwarePrototype(code:string,steel:T.Material,dark:T.Material){const g=new T.Group();
 if('BCDEF'.includes(code)){
  const dims:Record<string,[number,number,number]>={B:[3,10,5],C:[3,25,5],D:[2.5,44,4.5],E:[2,11,3.6],F:[2,25,3.6]};const [r,l,head]=dims[code];
  g.add(shapeHead(head,code==='E'||code==='F'?1.8:2.8,code==='E'||code==='F'?'cross':'hex',steel));const pointed='DEF'.includes(code),shaftLength=l-(pointed?4:0);g.add(cylinder(r,shaftLength,steel,-shaftLength/2));if(pointed){const tip=new T.Mesh(new T.ConeGeometry(r,4,24),steel);tip.rotation.z=Math.PI;tip.position.y=-l+2;g.add(tip);}
 }else if(code==='A'){g.add(cylinder(8,5,dark),cylinder(2.7,17,steel,10));}
 else if(code==='G'){const s=new T.Shape();for(let i=0;i<6;i++){const a=i*Math.PI/3;i?s.lineTo(Math.cos(a)*5.2,Math.sin(a)*5.2):s.moveTo(Math.cos(a)*5.2,Math.sin(a)*5.2);}s.closePath();const hole=new T.Path();hole.absarc(0,0,2.7,0,Math.PI*2,true);s.holes.push(hole);const m=new T.Mesh(new T.ExtrudeGeometry(s,{depth:4,bevelEnabled:false}),steel);m.rotation.x=-Math.PI/2;g.add(m);}
 else if(code==='H'){const m=new T.Mesh(new T.TorusGeometry(4.2,.8,8,48,Math.PI*1.86),steel);m.rotation.x=-Math.PI/2;g.add(m);}
 else if(code==='I'||code==='J'){const s=new T.Shape();s.moveTo(-6,-10);s.lineTo(-6,9);s.absarc(0,9,6,Math.PI,0,true);s.lineTo(6,-10);s.closePath();const h=new T.Path();h.absarc(0,8,2.4,0,Math.PI*2,true);s.holes.push(h);g.add(new T.Mesh(new T.ExtrudeGeometry(s,{depth:1.5,bevelEnabled:false}),steel));const toe=box([12,9,1.5],steel,[0,-14,2.7]);toe.rotation.x=-.55;g.add(toe);}
 else if(code==='K'){const a=plateWithVisibleHoles(18,18,2,[[0,0,3]],steel);a.rotation.x=-Math.PI/2;const b=plateWithVisibleHoles(18,18,2,[[0,0,3]],steel);b.position.set(0,8,-8);g.add(a,b);}
 else if(code==='L'){g.add(beam([0,0,0],[0,65,0],4,4,steel),beam([0,0,0],[24,0,0],4,4,steel));}
 else if(code==='M'){g.add(cylinder(7,45,dark,15),cylinder(2.4,64,steel,-38));g.add(beam([-2,-72,0],[2,-72,0],1.8,1.8,steel),beam([0,-72,-2],[0,-72,2],1.8,1.8,steel));}
 else if(code==='N'){g.add(cylinder(9.5,3,dark));}
 else if(code==='O'){g.add(box([8,62,3],steel));for(const x of [-8,8])g.add(box([5,18,3],steel,[x,34,0]));g.add(box([19,5,3],steel,[0,23,0]));}
 else throw Error('Unknown source hardware '+code);
 g.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=o.receiveShadow=true;});g.userData={code,status,hiddenThread:false};return g;
}

export function createPrototype(){
 const tree=ProductEngine.build(product),root=new T.Group(),hardwareRoot=new T.Group(),registry=new ObjectRegistry();
 const metal=MaterialFactory.create({type:'standard',color:finishes.crafted.metal,roughness:.45,metalness:.5});metal.transparent=false;
 const steel=MaterialFactory.create({type:'standard',color:finishes.crafted.steel,roughness:.28,metalness:.76});steel.transparent=false;
 const dark=MaterialFactory.create({type:'standard',color:'#27282a',roughness:.63});dark.transparent=false;
 const woodMaterials:T.MeshStandardMaterial[]=[];
 function component(code:string,i:number,position:Vector3Tuple){const g=new T.Group();g.name=`part-${code}-${i}`;g.position.set(...position);g.userData={code,status,source:'local manual PDF p3 and numbered diagrams',dimensionsConfirmed:false};root.add(g);registry.register(g.name,g);return g;}
 function board(code:string,i:number,size:Vector3Tuple,position:Vector3Tuple){const g=component(code,i,position),m=wood(Number(code)*3+i);woodMaterials.push(m);const mesh=box(size,m,[0,0,0],.8);const geo=mesh.geometry,p=geo.getAttribute('position'),n=geo.getAttribute('normal'),uv=new Float32Array(p.count*2);for(let k=0;k<p.count;k++){uv[k*2]=p.getX(k)/620+(Number(code)*.31+i*.13);uv[k*2+1]=(Math.abs(n.getY(k))>.5?p.getZ(k):p.getY(k))/210+i*.27;}geo.setAttribute('uv',new T.BufferAttribute(uv,2));g.add(mesh);return g;}
 for(let i=1;i<=2;i++){const g=component(String(i),1,[i===1?-585:585,0,0]);const face=panelFrame(570,590,metal);face.rotation.y=Math.PI/2;face.position.y=408;g.add(face);g.add(beam([0,15,-286],[0,980,-286],18,18,metal),beam([0,15,286],[0,940,286],18,18,metal),squareArc(metal));for(const y of [60,744,914])g.add(beam([0,y,-286],[0,y,286],18,18,metal));}
 const rear=component('4',1,[0,408,-286]);rear.add(panelFrame(1152,590,metal,false));
 for(const [code,y] of [['3',712],['5',62]] as const){const g=component(code,1,[0,y,286]);g.add(box([1152,18,18],metal));if(code==='5')g.add(box([18,29,18],metal,[0,-21,0]));for(const x of [-16,16])g.add(box([8,11,3],metal,[x,12,9]));}
 for(let i=1;i<=4;i++){const x=-350+(i-1)*700/3;const g=component('6',i,[x,60,0]);g.add(box([18,18,560],metal));}
 for(const [code,x] of [['7',-289],['8',289]] as const){const g=component(code,1,[x,408,302]);g.add(panelFrame(548,584,metal));const handleObject=handle(metal);handleObject.position.set(code==='7'?245:-245,0,20);g.add(handleObject);for(const y of [-223,223]){const h=hinge(steel);h.position.set(code==='7'?-280:280,y,-7.5);g.add(h);} }
 board('9',1,[1152,18,572],[0,914,0]);
 for(let i=1;i<=2;i++){board('10',i,[18,160,558],[i===1?-567:567,825,0]);board('11',i,[18,160,558],[i===1?-189:189,825,0]);}
 board('12',1,[1116,160,18],[0,825,-270]);board('13',1,[1152,60,18],[0,954,-270]);board('15',1,[1152,18,558],[0,736,0]);board('14',1,[1146,18,550],[0,88,0]);
 // Loose hardware trays are the canonical registry state; they are NOT claimed
 // installed at unverified receiving locations. Representative samples are separate views.
 for(const [j,[code,count]]of Object.entries(hardwareCounts).entries())for(let i=1;i<=count;i++){const h=hardwarePrototype(code,steel,dark);h.name=`hardware-${code}-${i}`;h.position.set((j%5-2)*150+(i-1)%6*13,40+Math.floor((i-1)/6)*18,-Math.floor(j/5)*160);hardwareRoot.add(h);registry.register(h.name,h);}
 registry.captureBaseline();
 const setFinish=(finish:Finish)=>{const f=finishes[finish];metal.color.set(f.metal);steel.color.set(f.steel);woodMaterials.forEach(m=>m.color.set(f.wood));};
 setFinish('crafted');
 const explode=()=>{for(const [id,g]of registry.entries()){if(!id.startsWith('part-'))continue;const code=g.userData.code as string;if(code==='1')g.position.x-=260;else if(code==='2')g.position.x+=260;else if(code==='4')g.position.z-=260;else if(code==='7'||code==='8'||code==='3'||code==='5')g.position.z+=260;else if(code==='9')g.position.y+=240;else if(code==='13')g.position.z-=200;else if(code==='14')g.position.z+=400;else if(code==='15')g.position.y+=100;else if(code==='6')g.position.y-=25;else if(code==='10')g.position.x*=1.25;else if(code==='11')g.position.y+=130;else if(code==='12')g.position.z-=180;}root.updateMatrixWorld(true);};
 return{root,hardwareRoot,registry,tree,metal,steel,dark,woodMaterials,setFinish,explode,reset:()=>{registry.reset();root.updateMatrixWorld(true);hardwareRoot.updateMatrixWorld(true);}};
}
