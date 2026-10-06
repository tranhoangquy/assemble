/** ONLY post-assembly presentation differs. Approved plan/assembly are reused,
 * not copied, retimed, renamed or rebuilt. */
import type {VideoDefinition,CameraPreset} from '@/types/video';
import type {RenderCheckpoint} from '@/types/product-package';
import {polish02Plan,polish02Assembly,polish02Video,polish02Runtime} from './polish-pass02';
export {polish02Plan,polish02Assembly};
export const polish02bId='wf311613-director-polish-02b';
export const polish02bRuntime=polish02Runtime;
export const finishedCameras:Record<string,CameraPreset>={
  'residential-hero':{position:[-320,215,-413],target:[0,90,-66],fov:46},
  'residential-closed':{position:[-265,181,-405],target:[0,110,-5],fov:35},
  'residential-mattress':{position:[-176,162,-260],target:[0,48,-85],fov:46},
};
export const polish02bVideo:VideoDefinition={...polish02Video,id:polish02bId,title:'Standalone Murphy Bed · Finished bedroom micro-pass',
  cameraPresets:{...polish02Video.cameraPresets,...finishedCameras},
  presentation:{...polish02Video.presentation,finishedBedroom:{...polish02Video.presentation!.finishedBedroom!,
    style:'residential',rug:{center:[0,-107],size:[395,320]},
    bedsideTable:{center:[-170,-10],size:[49,54,42]},plant:{center:[173,-10],height:118},
    decor:{wallZ:21.8,window:{center:[225,149],size:[96,150]},art:{center:[-188,161],size:[64,84]}},
  }},
  scenes:polish02Video.scenes.map(s=>s.phase!=='showcase'?s:{...s,camera:s.id==='showcase-final-closed'?'residential-closed':s.id==='showcase-mattress'?'residential-mattress':'residential-hero'}),
};
const showTime=(id:string,p=.8)=>{let t=0;for(const s of polish02bVideo.scenes){if(s.id===id)return t+s.duration*p;t+=s.duration;}throw new Error(id);};
export const polish02bCheckpoints:RenderCheckpoint[]=[
  {name:'01-finished-closed.png',time:showTime('showcase-final-closed')},
  {name:'02-finished-open-bare.png',time:showTime('showcase-final-result')},
  {name:'03-mattress-fit-medium.png',time:showTime('showcase-mattress')},
  {name:'04-mattress-bedding.png',time:showTime('showcase-bedding')},
  {name:'05-final-hero.png',time:showTime('showcase-hero')},
];
