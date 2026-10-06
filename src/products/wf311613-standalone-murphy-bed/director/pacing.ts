import type { DirectorPlan, DirectorShot } from '@/types/director';

/** Semantic timing, never a playback-rate multiplier. First contacts remain fully taught. */
export const instructionalPacing = Object.freeze({
  targetFullSeconds: [480,540] as const, preferredMaximumSeconds:600,
  first: { dowel:3.3, cam:2.2, bolt:4, screw:2.8 },
  second: { dowel:1.3, cam:1.1, bolt:2.15, screw:1.35 },
  repeat: { dowel:0.9, cam:0.95, bolt:1.85, screw:0.85 },
  context:1.2, introduction:1.4, target:1.1, verify:1.4, result:1.2,
});

export function retimeStepOne(plan:DirectorPlan):DirectorPlan {
  function timing(s:DirectorShot):[number,number|undefined] {
    if(s.id==='context')return [2.4,undefined];
    if(s.id==='part-introduction')return [2.3,undefined];
    if(s.id==='result')return [1.5,undefined];
    if(s.id==='verify')return [2,undefined];
    if(s.id.startsWith('rail-stage'))return [1,undefined];
    if(s.id.startsWith('rail-seat'))return [3.15,2.65];
    if(s.id==='dowel-macro'||s.id==='bolt-macro'||s.id==='dowel-target'||s.id==='panel-alignment')return [s.duration,undefined];
    if(s.id.startsWith('dowel-')){const n=Number(s.id.split('-').at(-1));return n===1?[1.7,1.3]:[1.25,0.9];}
    const n=Number(s.id.split('-').at(-1));
    if(s.id.startsWith('joint-target'))return n===0?[s.duration,undefined]:[n===1?0.7:0.6,undefined];
    if(s.id.startsWith('cam-install'))return n===0?[s.duration,undefined]:[n===1?1.5:1.35,n===1?1.1:0.95];
    if(s.id.startsWith('bolt-install'))return [n===1?2.6:2.3,n===1?2.15:1.85];
    if(s.id.startsWith('cam-lock'))return [n===0?s.duration:n===1?1:0.85,n===0?0.8:n===1?0.7:0.6];
    return [s.duration,undefined];
  }
  return {...plan,id:'wf311613-step01-semantic-pacing',steps:plan.steps.map(step=>({...step,shots:step.shots.map(s=>{
    const [duration,actionDuration]=timing(s);
    return {...s,duration,transition:'cut',actions:s.actions.map(a=>actionDuration!==undefined && (a.duration??0)>0?{...a,duration:actionDuration}:a)};
  })}))};
}
