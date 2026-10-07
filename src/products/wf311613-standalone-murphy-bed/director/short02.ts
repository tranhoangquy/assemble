import type { VideoDefinition } from '@/types/video';
import { microVideo, polish02Plan } from './final-micro-pass';
import { short01Cameras, short01Shots } from './short01';

// A new editorial identity. All mechanical windows still evaluate the frozen
// forward source; holds/cuts restore canonical state without graph mutation.
const sourceShots = new Map<string, {start:number; end:number}>();
let sourceCursor=5;
for(const step of polish02Plan.steps) for(const shot of step.shots) {
  sourceShots.set(shot.id,{start:sourceCursor,end:sourceCursor+shot.duration});
  sourceCursor+=shot.duration;
}
const at=(id:string,end=false)=>{const s=sourceShots.get(id);if(!s)throw new Error(id);return end?s.end:s.start;};
const show=(id:string,end=false)=>{let t=0;for(const s of microVideo.scenes){if(s.id===id)return t+(end?s.duration:0);t+=s.duration;}throw new Error(id);};
export const short02Cameras={...short01Cameras,'vertical-hero':{position:[-420,310,-820] as [number,number,number],target:[0,110,-70] as [number,number,number],fov:48}};
const retained=(id:string,duration:number)=>({...short01Shots.find(s=>s.id===id)!,duration});
type Shot=typeof short01Shots[number];
const directed=(id:string,duration:number,sourceIn:number,sourceOut:number,camera:string,caption:string,purpose:string,active:string):Shot=>({id,duration,sourceIn,sourceOut,camera,caption,purpose,active,validation:'Frozen forward source mechanics, authored local duration. Exact source evaluation restores canonical state at cuts; no graph or geometry changes.'});
const closed=show('showcase-final-closed',true);
const opening=show('showcase-final-open');
const open=show('showcase-final-result');
export const short02Shots:Shot[]=[
  directed('hook-closed',.6,closed,closed,'vertical-hero','A Bed That Folds','Immediately recognizable completed cabinet','Finished anchored product'),
  directed('hook-opening',.9,opening,open,'vertical-hero','A Bed That Folds','Full cabinet-to-bed opening including leg deployment within the first 1.5 seconds','Linked pivots/pistons and folding legs'),
  directed('hook-open',.5,open,open,'vertical-hero','A Bed That Folds','Clean open-bed glimpse before exact reset to overview','Finished open bed'),
  retained('overview',3),
  retained('cabinet-sides',2.8),retained('cabinet-panels',2.2),
  retained('cabinet-cap-lift',1.1),retained('cabinet-cap-seat',1.3),
  retained('bed-face',1.8),retained('bed-face-grid',2.1),retained('bed-face-close',.9),
  retained('bed-carrier-lift',.9),retained('bed-carrier-seat',1.4),
  retained('corner-support',1.5),retained('first-slat',1.3),retained('slat-progression',2.3),
  retained('platform-complete',.8),retained('mechanism-plate',1.6),
  directed('attach-context',.6,at('S25-route-4'),at('S25-route-4'),'vertical-attach','Attach the Bed Frame','Establish bed, cabinet and receiver before macro','Supported bed/cabinet receiver relationship'),
  retained('attach-route',2.4),retained('attach-pivot-seat',2),retained('attach-pivot-retain',4),retained('attach-result',2),
  retained('piston-first',3.5),retained('piston-opposite',2),
  directed('mechanism-secured',.5,at('S27-small-test-out'),at('S27-small-test-out'),'vertical-piston-right','Mechanism Secured','Hold completed hardware before contextual cut','Secured opposite piston eye'),
  directed('mechanism-pullback',.5,at('S27-small-test-out'),at('S27-small-test-out'),'vertical-mechanism','Test the Mechanism','Contextual pullback from completed macro before movement','Both pistons and bed pivot'),
  directed('mechanism-test',1.5,at('S27-small-test-out'),at('S27-small-test-out',true),'vertical-mechanism','Test the Mechanism','Complete approved 15-degree articulation, 90 to 75 degrees; following cut restores canonical leg-install state','Bed and continuously attached telescopic pistons'),
  retained('leg-install',2),retained('leg-fold-test',1.8),retained('wall-secured',2.2),
  directed('final-finished',1,open,open,'vertical-hero','Ready to Use','Completed open assembled product before functional payoff','Finished anchored open bed'),
  directed('final-close',2,show('showcase-final-support-lift'),show('showcase-final-close',true),'vertical-hero','Ready to Use','Supported lift, legs fold, then complete close','Finished bed with linked pistons and retained pivots'),
  directed('final-open',2,opening,open,'vertical-hero','Ready to Use','Full reopening, deploy legs, lower onto feet','Finished mechanism and folding legs'),
  directed('final-hero',1,open,open,'vertical-hero','Ready to Use','Open-bed hero hold as the final visual reward','Complete open usable support state'),
];
export const short02Video:VideoDefinition={
 id:'wf311613-short02-visual-v1',title:'WF311613 Short Video #02 — Silent Visual Review',width:1080,height:1920,fps:30,
 background:microVideo.background,presentation:microVideo.presentation,cameraPresets:short02Cameras,
 captionLayout:'vertical-safe',audio:{voiceover:null,music:null},
 editorial:{source:microVideo,segments:short02Shots.map(s=>({sceneId:s.id,sourceIn:s.sourceIn,sourceOut:s.sourceOut}))},
 scenes:short02Shots.map(s=>({id:s.id,title:s.caption,duration:s.duration,camera:s.camera,actions:[],phase:s.id.startsWith('hook-')||s.id.startsWith('final-')?'showcase':'assembly'})),
};
