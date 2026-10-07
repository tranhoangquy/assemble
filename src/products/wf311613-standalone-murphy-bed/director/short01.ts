import type { VideoDefinition, CameraPreset } from '@/types/video';
import { microVideo, polish02Plan } from './final-micro-pass';

// Source windows point into the approved forward assembly. No product/graph or
// Long shot is copied/rewritten. Durations are per-shot editorial decisions.
const shots = new Map<string, { start: number; end: number; step: number }>();
let sourceCursor = 5;
for (const step of polish02Plan.steps) for (const shot of step.shots) {
  shots.set(shot.id, { start: sourceCursor, end: sourceCursor + shot.duration, step: step.step });
  sourceCursor += shot.duration;
}
const at = (id: string, end = false) => { const s=shots.get(id); if(!s) throw new Error(`Missing approved shot ${id}`); return end?s.end:s.start; };
const show = (id:string) => { let t=0;for(const s of microVideo.scenes){if(s.id===id)return t;t+=s.duration;}throw new Error(id); };
export const short01Cameras: Record<string, CameraPreset> = {
  'vertical-hero': { position: [-280,210,-550], target: [0,110,-38], fov: 48 },
  'vertical-overview': { position: [-390,270,-590], target: [0,126,-70], fov: 52 },
  'vertical-cabinet': { position: [-270,220,-520], target: [0,108,-10], fov: 48 },
  'vertical-face': { position: [-240,420,-730], target: [0,40,-255], fov: 50 },
  'vertical-frame': { position: [460,600,-1360], target: [150,65,-260], fov: 54 },
  'vertical-cap': { position: [-270,260,-650], target: [0,150,25], fov: 50 },
  'vertical-carrier-seat': { position: [-330,500,-950], target: [0,70,-255], fov: 50 },
  'vertical-platform': { position: [-280,410,-800], target: [0,48,-255], fov: 48 },
  'vertical-attach': { position: [-265,205,-505], target: [0,105,-125], fov: 52 },
  'vertical-piston': { position: [-114.3,116,17], target: [-115.3,111,7], fov: 88 },
  'vertical-piston-right': { position: [114.3,116,17], target: [115.3,111,7], fov: 88 },
  'vertical-pivot': { position: [-116.9,37.5,-13], target: [-115.95,36.5,-9.2], fov: 85 },
  'vertical-mechanism': { position: [-285,205,-450], target: [0,102,-58], fov: 48 },
  'vertical-legs': { position: [-350,330,-620], target: [0,42,-120], fov: 50 },
};
interface Shot { id:string; duration:number; sourceIn:number; sourceOut:number; camera:string; caption:string; purpose:string; active:string; validation:string; }
const shot=(id:string,duration:number,first:string,last:string,camera:string,caption:string,purpose:string,active:string):Shot => ({id,duration,sourceIn:at(first),sourceOut:at(last,true),camera,caption,purpose,active,validation:'Original forward source trajectory; editorial cuts omit work, never replace attachment/pivot transforms.'});
export const short01Shots: Shot[] = [
  {id:'hook',duration:2,sourceIn:show('showcase-final-open'),sourceOut:show('showcase-final-open')+2,camera:'vertical-hero',caption:'A Bed That Folds',purpose:'Recognizable finished-product opening in the first two seconds',active:'Completed bed/cabinet with anchored mechanism',validation:'Approved functional opening; source clock moves forward at original speed.'},
  {id:'overview',duration:3,sourceIn:3.8,sourceOut:3.8,camera:'vertical-overview',caption:'From Parts to Product',purpose:'Static major-group overview, explicitly an editorial presentation',active:'Approved grouped structural overview; tiny fasteners hidden',validation:'Hold the existing approved exploded presentation; no reverse assembly, props or hardware cloud.'},
  shot('cabinet-sides',3,'S3-seat-first-side','S3-close-second-side','vertical-cabinet','Build the Cabinet','Join recognizable cabinet uprights','Cabinet sides/lower frame'),
  shot('cabinet-panels',2.5,'S4-B8-4--1-seat','S4-D4-1-seat','vertical-cabinet','Build the Cabinet','Major panel progression','Lower cabinet panels'),
  shot('cabinet-cap-lift',1.2,'S8-cap-lift','S8-cap-above','vertical-cap','Complete the Cabinet','Supported top assembly approach','Complete top cap'),
  shot('cabinet-cap-seat',1.3,'S8-lower-align','S8-cap-seat','vertical-cap','Complete the Cabinet','Seat top on uprights','Top cap/cabinet'),
  shot('bed-face',2,'S11-introduce','S11-C4-seat','vertical-face','Build the Bed Frame','First clear bed-face connection','Face rails'),
  shot('bed-face-grid',2.5,'S12-C4-right-introduce','S12-C3-2-seat','vertical-face','Build the Bed Frame','Editorial progression to coherent grid','Bed face grid'),
  shot('bed-face-close',1,'S15-C1-introduce','S15-C1-seat','vertical-face','Build the Bed Frame','Complete face structure','Outer face rail'),
  shot('bed-carrier-lift',1.1,'S17-lift','S17-above','vertical-frame','Join the Frames','Supported carrier movement','Bed carrier'),
  shot('bed-carrier-seat',1.4,'S17-lower','S17-seat','vertical-carrier-seat','Join the Frames','Carrier joins face on padded stands','Carrier/face'),
  shot('corner-support',1.6,'S18-H20-0-seat','S18-H20-0-seat','vertical-platform','Install the Supports','First reinforcing corner','Corner bracket'),
  shot('first-slat',1.2,'S20-D2-0-seat','S20-D2-0-seat','vertical-platform','Fit the Slats','One clear support-slat seat','First slat'),
  shot('slat-progression',2.8,'S20-D2-1-seat','S20-D2-4-seat','vertical-platform','Fit the Slats','Progress through known repeated supports','Remaining slats'),
  {id:'platform-complete',duration:1,sourceIn:at('S20-complete')+.1,sourceOut:at('S20-complete')+.1,camera:'vertical-platform',caption:'Platform Complete',purpose:'Readable completed-platform milestone',active:'Complete supported bed platform',validation:'Static evaluated completion state.'},
  shot('mechanism-plate',1.4,'S21-seat','S21-seat','vertical-platform','Fit the Mechanism','Show the mechanism interface before docking','First mechanism plate'),
  shot('attach-route',3.5,'S25-route-4','S25-route-5','vertical-attach','Attach the Bed Frame','Supported approach and receiver alignment','Complete bed and cabinet'),
  shot('attach-pivot-seat',1.5,'S25-route-6','S25-route-6','vertical-pivot','Seat the Pivot','Readable bearing lowering close-up','First bearing and receiver'),
  shot('attach-pivot-retain',3.5,'S25--1-connection','S25--1-retainer','vertical-pivot','Secure the Pivot','Show first retainer; second side completed editorially','Pivot retainers'),
  shot('attach-result',1.5,'S25-complete','S25-complete','vertical-attach','Bed Frame Connected','Hold valid connected state','Seated/retained bed frame'),
  shot('piston-first',4.5,'S26-target','S26-verify','vertical-piston','Connect the Gas Pistons','Readable first cabinet eye and retainer','First gas-piston cabinet eye'),
  shot('piston-opposite',2,'S27-target','S27-verify','vertical-piston-right','Connect the Gas Pistons','Omit repetition while retaining opposite attachment','Opposite gas piston'),
  {id:'mechanism-test',duration:1.5,sourceIn:at('S27-small-test-out'),sourceOut:at('S27-small-test-out')+1.5,camera:'vertical-mechanism',caption:'Test the Mechanism',purpose:'Show coupled pivot/piston function',active:'Bed pivots and telescopic links',validation:'Original mechanism solver on forward approved test, original speed.'},
  shot('leg-install',2,'S29--1-leg-approach','S29--1-bolt','vertical-legs','Fit the Legs','Show approach to valid pivot attachment','First folding leg'),
  shot('leg-fold-test',1.8,'S29-fold-test','S29-unfold-test','vertical-legs','Fold the Legs','Readable folding relationship; skipped second installation is a cut','Installed legs'),
  {id:'wall-secured',duration:1.2,sourceIn:at('S31-complete')+.2,sourceOut:at('S31-complete')+.2,camera:'vertical-cabinet',caption:'Secure to the Wall',purpose:'Required anchoring milestone before finished function',active:'All wall anchors secured',validation:'Forward-evaluated complete anchoring state; installation work omitted editorially.'},
  {id:'final-function',duration:6,sourceIn:show('showcase-final-support-lift'),sourceOut:show('showcase-final-support-lift')+6,camera:'vertical-hero',caption:'Ready to Use',purpose:'Controlled supported close and clean closed hero payoff',active:'Complete anchored product, folding legs and linked pistons',validation:'Original speed for support lift, leg folding and bed close. Closed hero at the end.'},
];
export const short01Video: VideoDefinition = {
  id:'wf311613-short01-visual-v1',title:'WF311613 Short Video #01 — Visual Review',width:1080,height:1920,fps:30,
  background:microVideo.background,presentation:microVideo.presentation,cameraPresets:short01Cameras,
  captionLayout:'vertical-safe',audio:{voiceover:null,music:null},
  editorial:{source:microVideo,segments:short01Shots.map(s=>({sceneId:s.id,sourceIn:s.sourceIn,sourceOut:s.sourceOut}))},
  scenes:short01Shots.map(s=>({id:s.id,title:s.caption,duration:s.duration,camera:s.camera,actions:[],phase:s.id==='hook'||s.id==='final-function'?'showcase':'assembly'})),
};
