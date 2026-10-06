'use client';
import {RoundedBox} from '@react-three/drei';
import {useCallback,useLayoutEffect,useMemo,useRef,useEffect} from 'react';
import * as THREE from 'three';
import type {FinishedBedroomDefinition,PresentationTimeSync} from '@/types/presentation';
import {ResidentialBedroom} from './ResidentialBedroom';

/** Absolute-time visibility, also used during synchronous deterministic export. */
export function finishedVisibility(config:FinishedBedroomDefinition,time:number){
  return {room:time>=config.start,mattress:time>=config.mattressStart,bedding:time>=config.beddingStart};
}
function fabricTexture(){
  const size=128,pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const tone=210+((x*17+y*31)%11)+(x%2===0?5:0)+(y%2===0?4:0),i=(y*size+x)*4;
    pixels[i]=pixels[i+1]=pixels[i+2]=tone;pixels[i+3]=255;
  }
  const t=new THREE.DataTexture(pixels,size,size,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(18,16);t.needsUpdate=true;return t;
}
/** Reusable procedural room props. Fixed transforms, no product IDs/registry,
 * no random placements, no extra lights or alteration of product materials. */
export function FinishedBedroom(props:{config:FinishedBedroomDefinition;time:number;onSyncReady?:(sync:PresentationTimeSync|null)=>void}){
  return props.config.style==='residential'?<ResidentialBedroom {...props}/>:<SimpleFinishedBedroom {...props}/>;
}
function SimpleFinishedBedroom({config,time,onSyncReady}:{config:FinishedBedroomDefinition;time:number;onSyncReady?:(sync:PresentationTimeSync|null)=>void}){
  const room=useRef<THREE.Group>(null),mattress=useRef<THREE.Group>(null),bedding=useRef<THREE.Group>(null);
  const fabric=useMemo(()=>fabricTexture(),[]);useEffect(()=>()=>fabric.dispose(),[fabric]);
  const sync=useCallback((t:number)=>{const state=finishedVisibility(config,t);if(room.current)room.current.visible=state.room;if(mattress.current)mattress.current.visible=state.mattress;if(bedding.current)bedding.current.visible=state.bedding;},[config]);
  useLayoutEffect(()=>{onSyncReady?.(sync);return()=>onSyncReady?.(null);},[sync,onSyncReady]);useLayoutEffect(()=>sync(time),[sync,time]);
  const [w,h,d]=config.mattress.size,[mx,my,mz]=config.mattress.center;
  const [tx,tz]=config.bedsideTable.center,[tw,th,td]=config.bedsideTable.size;
  const [px,pz]=config.plant.center;
  return <group name="presentation-finished-bedroom" userData={{presentationOnly:true,dimensionAuthority:'PRESENTATION ESTIMATE'}}>
    <group name="finished-room-props" ref={room} visible={false}>
      <mesh position={[config.rug.center[0],-.008,config.rug.center[1]]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={config.rug.size}/><meshStandardMaterial color="#cdc4b5" bumpMap={fabric} bumpScale={.015} roughness={1}/></mesh>
      <group name="context-bedside-table" position={[tx,0,tz]}>
        <RoundedBox args={[tw,2.4,td]} radius={.5} position={[0,th-1.2,0]} castShadow receiveShadow><meshStandardMaterial color="#b09a7c" roughness={.8}/></RoundedBox>
        <RoundedBox args={[tw-3,th-14,td-3]} radius={.4} position={[0,(th+8)/2,0]} castShadow receiveShadow><meshStandardMaterial color="#bca68a" roughness={.85}/></RoundedBox>
        {[-1,1].flatMap(x=>[-1,1].map(z=><mesh key={`${x}-${z}`} position={[x*(tw/2-3),5,z*(td/2-3)]} castShadow><boxGeometry args={[3,10,3]}/><meshStandardMaterial color="#a78f71" roughness={.85}/></mesh>))}
        <mesh position={[0,th+.8,0]}><cylinderGeometry args={[7,8,1.6,32]}/><meshStandardMaterial color="#726b5e" roughness={.7}/></mesh>
        <mesh position={[0,th+11,0]}><cylinderGeometry args={[1,1,20,16]}/><meshStandardMaterial color="#827b6c" roughness={.55} metalness={.35}/></mesh>
        <mesh position={[0,th+26,0]} castShadow><cylinderGeometry args={[8,12,18,48,1,true]}/><meshStandardMaterial color="#e8dfce" side={THREE.DoubleSide} roughness={1}/></mesh>
      </group>
      <group name="context-plant" position={[px,0,pz]}>
        <mesh position={[0,11,0]} castShadow><cylinderGeometry args={[12,9,22,40]}/><meshStandardMaterial color="#b9b2a3" roughness={1}/></mesh>
        <mesh position={[0,config.plant.height/2+12,0]} castShadow><cylinderGeometry args={[.7,1.4,config.plant.height-22,10]}/><meshStandardMaterial color="#736b52" roughness={1}/></mesh>
        {Array.from({length:20},(_,i)=>{const a=i*2.399963,p: [number,number,number]=[Math.cos(a)*(8+i%4*3),31+i*3.6,Math.sin(a)*(8+i%4*3)];return <mesh key={i} position={p} rotation={[.2,a,.45]} scale={[1,.25,1]} castShadow><sphereGeometry args={[9,12,8]}/><meshStandardMaterial color={i%2?'#666f4e':'#77825b'} roughness={.95}/></mesh>;})}
      </group>
    </group>
    <group name="context-mattress" ref={mattress} position={config.mattress.center} visible={false}>
      <RoundedBox args={config.mattress.size} radius={config.mattress.radius} smoothness={5} castShadow receiveShadow><meshStandardMaterial color="#f2eee5" roughness={.97} bumpMap={fabric} bumpScale={.018}/></RoundedBox>
      {[-1,1].map(s=><RoundedBox key={s} args={[w+.12,.20,d+.12]} radius={.09} position={[0,s*(h/2-2),0]}><meshStandardMaterial color="#d5d0c6" roughness={1}/></RoundedBox>)}
    </group>
    <group name="context-bedding" ref={bedding} visible={false}>
      <RoundedBox args={[w-3,3.2,d*.74]} radius={1.5} smoothness={5} position={[mx,my+h/2+1.6,mz-d*.10]} castShadow receiveShadow><meshStandardMaterial color="#d6cdbb" roughness={1} bumpMap={fabric} bumpScale={.02}/></RoundedBox>
      {[-1,1].map(s=><RoundedBox key={s} args={[70,12,38]} radius={5} smoothness={5} position={[mx+s*49,my+h/2+6,mz+d*.32]} rotation={[0,s*.05,0]} castShadow><meshStandardMaterial color="#ede8dd" roughness={1} bumpMap={fabric} bumpScale={.02}/></RoundedBox>)}
    </group>
  </group>;
}
