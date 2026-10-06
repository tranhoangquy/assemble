// Verification artifact only. Loads the frozen product without editing it.
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export const candidateId = 'wf311613-final-micro-pass';
export const baselineId = 'wf311613-director-polish-02b';
export async function loadCandidate() {
  const {getProductPackage} = await import(pathToFileURL(path.resolve('src/products/registry.ts')).href);
  return {entry:getProductPackage(candidateId),baseline:getProductPackage(baselineId)};
}
export function checkpoints(entry) {
  if (!entry.video.intro || entry.video.intro.duration !== 5 || !entry.directorPlan) throw Error('Approved intro/DirectorPlan unavailable');
  const prefix=entry.video.intro.duration,shots=new Map();let cursor=0;
  for(const step of entry.directorPlan.steps)for(const shot of step.shots){shots.set(shot.id,{...shot,start:cursor,step:step.step});cursor+=shot.duration;}
  const point=(label,id,p=.8)=>{const shot=shots.get(id);if(!shot)throw Error('Missing approved shot '+id);return {label,shot:id,time:prefix+shot.start+shot.duration*p,camera:shot.camera,step:shot.step};};
  const points=[
    {label:'01-intro-finished-product',time:0,shot:'micro-intro-finished',camera:entry.video.intro.heroCamera},
    {label:'02-intro-mid-explosion',time:2.5,shot:'micro-intro-explode',camera:entry.video.intro.explodedCamera},
    {label:'03-intro-fully-exploded',time:3.75,shot:'micro-intro-hold',camera:entry.video.intro.explodedCamera},
    {label:'04-intro-last-exploded-before-cut',time:4.6,shot:'micro-intro-hold',camera:entry.video.intro.explodedCamera},
    {label:'05-editorial-cut-step1-state',time:4.633333333333333,shot:'micro-intro-cut'},
    {label:'06-step1-exact-reset',time:5,shot:'assembly-step1-zero'},
    point('07-early-assembly','rail-seat-0',.9),
    point('08-first-hardware-closeup','bolt-macro',.7),
    point('09-cabinet-construction','S4-D4-1-seat',.85),
    point('09b-B8-complete-cabinet-face','S6-complete',.8),
    point('10-bed-face-construction','S15-complete'),
    point('11-carrier-construction','S16-complete'),
    point('12-step25-front-staging','S25-context'),
    point('13-step25-supported-approach','S25-route-4',.6),
    point('14-step25-bearing-seating','S25--1-connection'),
    point('15-step25-connected-pullback','S25-complete',.75),
    point('16-step26-corrected-alignment','S26-target',.7),
    point('17-step26-active-connection','S26-eye-align',.9),
    point('18-step26-retainer-installation','S26-retain',.7),
    point('19-step26-secured','S26-verify',.8),
    point('20-piston-mechanism-verification','S27-small-test-out',.8),
    point('21-folding-leg-construction','S28--1-D7-join',.78),
    point('22-wall-anchoring','S30-0-wall-screw',.75),
    point('23-assembly-complete','final-result'),
  ];
  const scenes=new Map();cursor=0;for(const s of entry.video.scenes){scenes.set(s.id,{...s,start:cursor});cursor+=s.duration;}
  for(const [label,id,p] of [
    ['24-finished-closed-bedroom','showcase-final-closed',.8],
    ['25-finished-opening','showcase-final-open',.55],
    ['26-finished-open-bare','showcase-final-result',.8],
    ['27-mattress','showcase-mattress',.8],
    ['28-bedding','showcase-bedding',.8],
    ['29-final-hero','showcase-hero',.8],
  ]){const s=scenes.get(id);if(!s)throw Error('Missing approved showcase '+id);points.push({label,shot:id,time:s.start+s.duration*p,camera:s.camera});}
  return {points,duration:cursor,assemblyDuration:entry.directorPlan.steps.reduce((n,s)=>n+s.shots.reduce((a,b)=>a+b.duration,0),0)};
}
