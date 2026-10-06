import type {DirectorPlan,DirectorShot} from '@/types/director';

export const openingPacing={repeatHardware:.66,mirroredHardware:.62,boltStart:.68,tighten:.80,
  firstContext:1.4,mirroredContext:.8,repeatTarget:.12,firstTarget:1.05,repeatStage:.32,
  firstIntro:1.3,mirroredIntro:.7,verification:1.05,result:.8} as const;
/** Copy only the opening shots. The locked Steps 4–20 retain exact object data. */
export function compressOpening(plan:DirectorPlan):DirectorPlan{
  function shot(s:DirectorShot,n:number):DirectorShot{
    const r=structuredClone(s);let factor=1;
    if(s.type==='INSTALL_HARDWARE'){
      const first=n===1&&['dowel-macro','cam-install-0','bolt-macro'].includes(s.id);
      factor=first?1:n===2?openingPacing.mirroredHardware:n===3?openingPacing.boltStart:openingPacing.repeatHardware;
      r.actions=r.actions.map(a=>({...a,at:(a.at??0)*factor,duration:(a.duration??0)*factor}));
      r.duration=Math.max(...r.actions.map(a=>(a.at??0)+(a.duration??0)))+.035;
    }else if(s.type==='TIGHTEN_HARDWARE'){
      factor=openingPacing.tighten;r.actions=r.actions.map(a=>({...a,at:(a.at??0)*factor,duration:(a.duration??0)*factor}));r.duration=Math.max(...r.actions.map(a=>(a.at??0)+(a.duration??0)))+.025;
    }else if(s.type==='ESTABLISHING')r.duration=n===1?1.4:n===2?.8:1.15;
    else if(s.type==='INTRODUCE_PART')r.duration=n===1?1.3:n===2?.7:1.05;
    else if(s.type==='SHOW_TARGET')r.duration=n===1?1.05:n===2?.4:Math.min(s.duration,.85);
    else if(s.type==='CONNECTION_MACRO')r.duration=s.duration>1?1.05:.12;
    else if(s.type==='STAGE_PART')r.duration=.32;
    else if(s.type==='VERIFY_CONNECTION')r.duration=n===2?.65:1.05;
    else if(s.type==='STEP_COMPLETE')r.duration=.8;
    else if(['INSERT_PART','ALIGN_CONNECTION'].includes(s.type)){
      factor=n===3?.83:.85;r.actions=r.actions.map(a=>({...a,at:(a.at??0)*factor,duration:(a.duration??0)*factor}));
      r.duration=r.actions.some(a=>(a.duration??0)>0)?Math.max(...r.actions.map(a=>(a.at??0)+(a.duration??0)))+.10:Math.min(s.duration,.85);
    }
    return r;
  }
  return{...plan,steps:plan.steps.map(s=>s.step<=3?{...s,shots:s.shots.map(x=>shot(x,s.step))}:s)};
}
