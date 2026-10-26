import {evaluateEdit as prior} from '../native-portrait-short-v1/edit';
export function evaluateEdit(t:number){
 const time=Math.max(0,Math.min(59-1e-9,t));let legacyTime=time,extendedTime:number,shotId:string;
 if(time<44.6){const e=prior(time);return{time,legacy:e,extendedTime:e.sourceTime+(e.sourceTime>=228?16:0),shotId:e.shot.id};}
 if(time<46.6){legacyTime=time;extendedTime=208.5+(time-44.6);shotId='door1';}
 else if(time<54.4){legacyTime=46.6;const u=time-46.6;extendedTime=210.75+Math.min(u,7.6751)+ (u>=7.6751?1e-7:0);shotId='four-screw-hinge';}
 else if(time<56.4){legacyTime=50.8+(time-54.4);extendedTime=226.1952+(time-54.4);shotId='door2';}
 else if(time<57.13333333333333){legacyTime=54.266666666666666;extendedTime=282;shotId='pads-hold';}
 else{legacyTime=55;extendedTime=288;shotId='hero';}
 return{time,legacy:prior(legacyTime),extendedTime,shotId};
}
