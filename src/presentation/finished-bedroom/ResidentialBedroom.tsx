'use client';
import {RoundedBox} from '@react-three/drei';
import {useCallback,useEffect,useLayoutEffect,useMemo,useRef} from 'react';
import * as THREE from 'three';
import type {FinishedBedroomDefinition,PresentationTimeSync} from '@/types/presentation';

/** Native, fixed-seed textile maps. No asset downloads, logos or cloth physics. */
function textile(quilt=false,rug=false){
  const n=256,p=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const weave=((x*17+y*31)%13)-6+(x%2?2:-2)+(y%2?2:-2);
    const cell=64,edge=Math.min(x%cell,cell-x%cell,y%cell,cell-y%cell);
    const soft=quilt?Math.min(edge,8)*1.1-5:0;
    const border=rug&&(x<10||x>245||y<10||y>245)?-10:0;
    const v=220+weave*.55+soft+border,i=(y*n+x)*4;
    p[i]=p[i+1]=p[i+2]=v;p[i+3]=255;
  }
  const t=new THREE.DataTexture(p,n,n,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.repeat.set(rug?1:quilt?2:20,rug?1:quilt?2:16);t.needsUpdate=true;return t;
}
/** Rounded rectangular seam, not an opaque slab across the mattress. */
export function mattressPiping(w:number,d:number,y:number,r=1.6){
  const points:THREE.Vector3[]=[];
  for(const [cx,cz,start]of [[w/2-r,d/2-r,0],[-w/2+r,d/2-r,90],[-w/2+r,-d/2+r,180],[w/2-r,-d/2+r,270]]){
    for(let i=0;i<=12;i++){const a=(start+i*90/12)*Math.PI/180;points.push(new THREE.Vector3(cx+r*Math.cos(a),y,cz+r*Math.sin(a)));}
  }
  // Piecewise circular samples avoid Catmull-Rom overshoot along long sides;
  // the complete seam must stay inside the already validated +0.06 envelope.
  const path=new THREE.CurvePath<THREE.Vector3>();
  for(let i=0;i<points.length;i++)path.add(new THREE.LineCurve3(points[i],points[(i+1)%points.length]));
  return new THREE.TubeGeometry(path,320,.05,6,true);
}
/** Softly filled duvet. Edges slope down onto the fitted sheet rather
 * than hiding the rails. Horizontal footprint stays inside the mattress. */
export function duvetGeometry(w:number,d:number){
  const nx=64,nz=48,positions:number[]=[],indices:number[]=[];
  for(let layer=0;layer<2;layer++)for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
    const u=i/nx,v=j/nz,x=(u-.5)*w,z=(v-.5)*d;
    const edge=Math.min(u,1-u,v,1-v),lift=Math.min(1,edge*10);
    const wave=.38*Math.sin(x*.075+z*.025)+.24*Math.sin(z*.12-x*.032);
    const y=layer===0?.05:(.18+4.0*lift+wave*lift);
    positions.push(x,y,z);
  }
  const count=(nx+1)*(nz+1);
  for(let layer=0;layer<2;layer++)for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
    const a=layer*count+j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;
    if(layer===0)indices.push(a,b,c,b,d,c);else indices.push(a,c,b,b,c,d);
  }
  const join=(a:number,b:number)=>indices.push(a,a+count,b,b,a+count,b+count);
  for(let i=0;i<nx;i++){join(i+1,i);join(nz*(nx+1)+i,nz*(nx+1)+i+1);}
  for(let j=0;j<nz;j++){join(j*(nx+1),(j+1)*(nx+1));join((j+1)*(nx+1)+nx,j*(nx+1)+nx);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const uv:number[]=[];for(let layer=0;layer<2;layer++)for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++)uv.push(i/nx,j/nz);
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function curtainGeometry(w:number,h:number){
  const nx=64,ny=12,p:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
    const u=i/nx,v=j/ny;p.push((u-.5)*w,(v-.5)*h,Math.sin(u*Math.PI*14)*1.35-.15*Math.cos(v*Math.PI));uv.push(u,v);
  }
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;indices.push(a,a+1,a+nx+1,a+1,a+nx+2,a+nx+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function artTexture(){
  const n=256,p=new Uint8Array(n*n*4);
  const colors=[[232,225,212],[201,189,165],[169,163,141],[118,128,120]];
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const horizon=140+20*Math.sin(x*.018)+8*Math.sin(x*.04),row=y>horizon+40?3:y>horizon?2:y>horizon-26?1:0;
    const noise=((x*13+y*7)%11-5)*.35,i=(y*n+x)*4;for(let c=0;c<3;c++)p[i+c]=colors[row][c]+noise;p[i+3]=255;
  }
  const t=new THREE.DataTexture(p,n,n,THREE.RGBAFormat);t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t;
}
export function ResidentialBedroom({config,time,onSyncReady}:{config:FinishedBedroomDefinition;time:number;onSyncReady?:(sync:PresentationTimeSync|null)=>void}){
  const room=useRef<THREE.Group>(null),mattress=useRef<THREE.Group>(null),bedding=useRef<THREE.Group>(null);
  const [w,h,d]=config.mattress.size,[mx,my,mz]=config.mattress.center;
  const [tx,tz]=config.bedsideTable.center,[tw,th,td]=config.bedsideTable.size,[px,pz]=config.plant.center;
  const maps=useMemo(()=>({fabric:textile(),quilt:textile(true),rug:textile(false,true),art:artTexture()}),[]);
  const meshes=useMemo(()=>({upper:mattressPiping(w,d,h/2-2),lower:mattressPiping(w,d,-h/2+2),
    duvet:duvetGeometry(w-3,d*.74),curtain:curtainGeometry(27,232)}),[w,h,d]);
  useEffect(()=>()=>{Object.values(maps).forEach(t=>t.dispose());Object.values(meshes).forEach(g=>g.dispose());},[maps,meshes]);
  const sync=useCallback((t:number)=>{if(room.current)room.current.visible=t>=config.start;if(mattress.current)mattress.current.visible=t>=config.mattressStart;if(bedding.current)bedding.current.visible=t>=config.beddingStart;},[config]);
  useLayoutEffect(()=>{onSyncReady?.(sync);return()=>onSyncReady?.(null);},[sync,onSyncReady]);useLayoutEffect(()=>sync(time),[sync,time]);
  const decor=config.decor!;
  return <group name="presentation-residential-bedroom" userData={{presentationOnly:true,dimensionAuthority:'PRESENTATION ESTIMATE'}}>
    <group ref={room} visible={false} name="finished-room-props">
      {/* Small warm fill is parented to post-assembly visibility. Exposure and
          all pre-completion lights are untouched. No depth of field. */}
      <ambientLight intensity={.075} color="#fff1dc"/>
      <directionalLight position={[-210,230,-140]} intensity={.14} color="#fff0d9"/>
      <mesh position={[config.rug.center[0],-.008,config.rug.center[1]]} rotation={[-Math.PI/2,0,0]} receiveShadow>
        <planeGeometry args={config.rug.size}/><meshStandardMaterial color="#c9bc9f" map={maps.rug} bumpMap={maps.fabric} bumpScale={.025} roughness={1}/>
      </mesh>
      <group position={[tx,0,tz]} name="context-bedside-table">
        <RoundedBox args={[tw,2.4,td]} radius={.65} position={[0,th-1.2,0]} castShadow receiveShadow><meshStandardMaterial color="#987b5a" roughness={.82}/></RoundedBox>
        <RoundedBox args={[tw-2,th-14,td-2]} radius={.6} position={[0,(th+8)/2,0]} castShadow receiveShadow><meshStandardMaterial color="#b49a78" roughness={.85}/></RoundedBox>
        {[22,39].map(y=><group key={y} position={[0,y,-td/2-.1]}>
          <RoundedBox args={[tw-5,14,.6]} radius={.25}><meshStandardMaterial color="#ab906f" roughness={.86}/></RoundedBox>
          <mesh position={[0,1,-.9]} rotation={[Math.PI/2,0,Math.PI/2]}><cylinderGeometry args={[.38,.38,8,12]}/><meshStandardMaterial color="#716452" metalness={.6} roughness={.45}/></mesh>
        </group>)}
        {[-1,1].flatMap(x=>[-1,1].map(z=><mesh key={`${x}-${z}`} position={[x*(tw/2-4),5,z*(td/2-4)]} castShadow><boxGeometry args={[3,10,3]}/><meshStandardMaterial color="#8c7356" roughness={.85}/></mesh>))}
        <mesh position={[0,th+6,2]} castShadow><sphereGeometry args={[6,32,20]}/><meshStandardMaterial color="#a9a396" roughness={.65}/></mesh>
        <mesh position={[0,th+14,2]}><cylinderGeometry args={[.7,1,14,16]}/><meshStandardMaterial color="#857762" metalness={.55} roughness={.5}/></mesh>
        <mesh position={[0,th+26,2]} castShadow><cylinderGeometry args={[10,13,19,48,1,true]}/><meshStandardMaterial color="#e2d7c2" bumpMap={maps.fabric} bumpScale={.025} side={THREE.DoubleSide} roughness={1}/></mesh>
        <mesh position={[0,th+16.5,2]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.9,12.8,48]}/><meshStandardMaterial color="#ddd0b8" side={THREE.DoubleSide} roughness={1}/></mesh>
        <RoundedBox args={[13,1.2,17]} radius={.3} position={[14,th+1,-7]} rotation={[0,.12,0]}><meshStandardMaterial color="#c4bdad" roughness={1}/></RoundedBox>
      </group>
      <group name="context-plant" position={[px,0,pz]}>
        <mesh position={[0,13,0]} castShadow><cylinderGeometry args={[13,10,26,48]}/><meshStandardMaterial color="#b4ab98" bumpMap={maps.fabric} bumpScale={.07} roughness={1}/></mesh>
        <mesh position={[0,26,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[12.5,40]}/><meshStandardMaterial color="#635844" side={THREE.DoubleSide} roughness={1}/></mesh>
        <mesh position={[0,config.plant.height/2+12,0]} castShadow><cylinderGeometry args={[.6,1.3,config.plant.height-24,12]}/><meshStandardMaterial color="#655b45" roughness={1}/></mesh>
        {Array.from({length:32},(_,i)=>{const a=i*2.399963,y=35+i*2.42,r=11+4*Math.sin(i*.7);return <group key={i} position={[Math.cos(a)*r,y,Math.sin(a)*r]} rotation={[.18,a,.35]}>
          <mesh scale={[1,.22,.7]} castShadow><sphereGeometry args={[8,16,10]}/><meshStandardMaterial color={i%3?'#657353':'#78825f'} roughness={.98}/></mesh>
        </group>;})}
      </group>
      <group name="finished-window-curtains" position={[decor.window.center[0],decor.window.center[1],decor.wallZ-1]}>
        <RoundedBox args={[decor.window.size[0]+7,decor.window.size[1]+7,2]} radius={.4} castShadow><meshStandardMaterial color="#c4beb1" roughness={.9}/></RoundedBox>
        <mesh position={[0,0,-1.1]}><boxGeometry args={[decor.window.size[0],decor.window.size[1],.1]}/><meshStandardMaterial color="#a7b9b5" emissive="#d8e0d9" emissiveIntensity={.09} roughness={.72}/></mesh>
        <mesh position={[0,0,-1.3]}><boxGeometry args={[2.1,decor.window.size[1],.5]}/><meshStandardMaterial color="#ded8cb" roughness={.9}/></mesh>
        <mesh position={[0,0,-1.3]}><boxGeometry args={[decor.window.size[0],2.1,.5]}/><meshStandardMaterial color="#ded8cb" roughness={.9}/></mesh>
        <mesh position={[0,-decor.window.size[1]/2-2,-3]} castShadow><boxGeometry args={[decor.window.size[0]+9,3,7]}/><meshStandardMaterial color="#d2cbbd" roughness={.9}/></mesh>
        <mesh position={[0,decor.window.size[1]/2+12,-5]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.8,.8,decor.window.size[0]+53,20]}/><meshStandardMaterial color="#8c816c" metalness={.4} roughness={.6}/></mesh>
        {[-1,1].map(s=><group key={s}>
          <mesh geometry={meshes.curtain} position={[s*(decor.window.size[0]/2+11),-31,-5]} castShadow receiveShadow><meshStandardMaterial color="#bfb09a" bumpMap={maps.fabric} bumpScale={.025} roughness={1} side={THREE.DoubleSide}/></mesh>
          {[-9,-3,3,9].map(x=><mesh key={x} position={[s*(decor.window.size[0]/2+11)+x,decor.window.size[1]/2+12,-5]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[1.8,.18,8,16]}/><meshStandardMaterial color="#998c77" metalness={.4} roughness={.7}/></mesh>)}
        </group>)}
      </group>
      <group name="context-wall-art" position={[decor.art.center[0],decor.art.center[1],decor.wallZ-1]}>
        <RoundedBox args={[decor.art.size[0],decor.art.size[1],1.6]} radius={.25} castShadow><meshStandardMaterial color="#82745e" roughness={.78}/></RoundedBox>
        <mesh position={[0,0,-.9]}><boxGeometry args={[decor.art.size[0]-3,decor.art.size[1]-3,.05]}/><meshStandardMaterial color="#e4ddcf" roughness={1}/></mesh>
        <mesh position={[0,0,-1]} rotation={[0,Math.PI,0]}><planeGeometry args={[decor.art.size[0]-13,decor.art.size[1]-13]}/><meshStandardMaterial map={maps.art} roughness={1}/></mesh>
      </group>
      {[-1,1].map(s=><mesh key={s} position={[s*220,4,decor.wallZ-.2]}><boxGeometry args={[185,8,.3]}/><meshStandardMaterial color="#ddd5c5" roughness={.9}/></mesh>)}
    </group>
    <group ref={mattress} visible={false} name="context-mattress" position={config.mattress.center}>
      <RoundedBox args={config.mattress.size} radius={config.mattress.radius} smoothness={6} castShadow receiveShadow><meshStandardMaterial color="#d8cdb9" roughness={.97} bumpMap={maps.quilt} bumpScale={.09}/></RoundedBox>
      {[meshes.upper,meshes.lower].map((g,i)=><mesh key={i} geometry={g}><meshStandardMaterial color="#b1a792" roughness={1}/></mesh>)}
      {/* Subtle inset stitch grid, entirely inside the unchanged horizontal fit. */}
      {Array.from({length:7},(_,i)=><mesh key={`z${i}`} position={[0,h/2+.018,-d/2+18+i*24]}><boxGeometry args={[w-18,.022,.065]}/><meshStandardMaterial color="#b7ab95" roughness={1}/></mesh>)}
      {Array.from({length:7},(_,i)=><mesh key={`x${i}`} position={[-w/2+18+i*29,h/2+.018,0]}><boxGeometry args={[.065,.022,d-18]}/><meshStandardMaterial color="#b7ab95" roughness={1}/></mesh>)}
    </group>
    <group ref={bedding} visible={false} name="context-bedding">
      {/* Fitted cover top, bounded by the mattress plan; no oversized skirt. */}
      <RoundedBox args={[w-.7,.35,d-.7]} radius={.17} position={[mx,my+h/2+.19,mz]} receiveShadow><meshStandardMaterial color="#e9e3d5" bumpMap={maps.fabric} bumpScale={.012} roughness={1}/></RoundedBox>
      <mesh geometry={meshes.duvet} position={[mx,my+h/2+.38,mz-d*.10]} castShadow receiveShadow><meshStandardMaterial color="#bbb09a" bumpMap={maps.fabric} bumpScale={.035} roughness={1}/></mesh>
      {/* A soft turned-back top edge gives the blanket a readable fold. */}
      <RoundedBox args={[w-7,1.0,11]} radius={.48} position={[mx,my+h/2+3.9,mz-d*.10+d*.74/2-6]} rotation={[0,0,.002]} castShadow><meshStandardMaterial color="#c7bca6" bumpMap={maps.fabric} bumpScale={.025} roughness={1}/></RoundedBox>
      {[-1,1].map(s=><group key={s} position={[mx+s*48,my+h/2+6.4,mz+d*.32]} rotation={[-.055,s*.06,s*.018]}>
        <RoundedBox args={[70,12,38]} radius={5.7} smoothness={7} castShadow><meshStandardMaterial color="#ded7c7" bumpMap={maps.fabric} bumpScale={.024} roughness={1}/></RoundedBox>
      </group>)}
    </group>
  </group>;
}
