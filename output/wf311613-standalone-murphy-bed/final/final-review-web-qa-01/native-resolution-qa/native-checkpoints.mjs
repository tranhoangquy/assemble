// Output-only QA specification. Read-only import of the approved candidate.
import {candidateId,loadCandidate,checkpoints} from '../checkpoints.mjs';

export const requestedProfiles = [
  {id:'720p',width:1280,height:720,fps:30},
  {id:'1080p',width:1920,height:1080,fps:30},
  {id:'1440p',width:2560,height:1440,fps:30},
  {id:'2160p',width:3840,height:2160,fps:30},
];

export async function loadNativeQaSpecification() {
  const {entry}=await loadCandidate();
  const {points,duration}=checkpoints(entry);
  const select=(name,label)=>{
    const p=points.find(p=>p.label===name);
    if(!p)throw Error('Missing approved checkpoint '+name);
    return {...p,label,sourceLabel:name};
  };
  let cursor=entry.video.intro.duration,b8;
  for(const step of entry.directorPlan.steps)for(const shot of step.shots){
    if(shot.id==='S6-complete')b8={label:'06-b8-cabinet-face',shot:shot.id,time:cursor+shot.duration*.8,camera:shot.camera,step:step.step};
    cursor+=shot.duration;
  }
  if(!b8)throw Error('Missing approved S6-complete B8 checkpoint');
  const selected=[
    select('01-intro-finished-product','01-intro-finished-hero'),
    select('03-intro-fully-exploded','02-intro-fully-exploded'),
    select('06-step1-exact-reset','03-step1-exact-reset'),
    select('08-first-hardware-closeup','04-early-hardware-macro'),
    select('09-cabinet-construction','05-cabinet-medium'),
    b8,
    select('10-bed-face-construction','07-bed-face'),
    select('14-step25-bearing-seating','08-step25-connection'),
    select('17-step26-active-connection','09-step26-corrected-active-connection'),
    select('21-folding-leg-construction','10-folding-legs'),
    select('22-wall-anchoring','11-wall-anchoring'),
    select('29-final-hero','12-final-bedroom-hero'),
  ];
  // Same deterministic timestamp at all four native dimensions. A 2-second
  // proof begins at the first hardware close-up, not an old rendered sequence.
  const proofStart=selected[3].time;
  return {candidateId,duration,profiles:requestedProfiles,checkpoints:selected,proof:{start:proofStart,duration:2,fps:30,frameCount:60}};
}

export function canonical(value) {
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  return JSON.stringify(value);
}
