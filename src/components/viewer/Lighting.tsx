'use client';
import { Environment, Lightformer } from '@react-three/drei';

export function Lighting({ review = false }: { review?: boolean }) {
  if (review) return <>
    <ambientLight intensity={0.32} />
    <hemisphereLight args={['#ffffff','#bbb9b5',0.65]} />
    <directionalLight castShadow position={[-70,160,-110]} intensity={2.2} color="#fffaf2" shadow-mapSize={[2048,2048]} shadow-camera-left={-150} shadow-camera-right={150} shadow-camera-top={100} shadow-camera-bottom={-100} shadow-camera-near={0.1} shadow-camera-far={450} shadow-normalBias={0.025} />
    <directionalLight position={[80,100,120]} intensity={0.9} color="#edf3ff" />
    <directionalLight position={[10,55,-130]} intensity={0.7} color="#ffffff" />
    <Environment resolution={128}>
      <Lightformer form="rect" intensity={3} position={[-50,100,0]} rotation={[Math.PI/2,0,0]} scale={[130,60,1]} />
      <Lightformer form="rect" intensity={1.5} position={[0,30,80]} scale={[180,50,1]} />
      <Lightformer form="rect" intensity={2} position={[0,25,-80]} rotation={[0,Math.PI,0]} scale={[180,20,1]} />
    </Environment>
  </>;
  return (
    <>
      <ambientLight intensity={0.95} />
      <hemisphereLight args={['#fff8eb', '#59626b', 1.25]} />
      <directionalLight
        castShadow
        position={[-180, 360, 260]}
        intensity={2.4}
        color="#fff4dd"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-300}
        shadow-camera-right={300}
        shadow-camera-top={350}
        shadow-camera-bottom={-100}
        shadow-bias={-0.00015}
      />
    </>
  );
}
