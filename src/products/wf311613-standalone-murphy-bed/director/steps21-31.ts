/** Full Option 1 directing data. Register/export only after the current
 * mechanical, regression, code and visual-QA gates have all passed. */
import * as THREE from 'three';
import type {AnimationAction,InstallationDefinition,TelescopicLinkAction,PivotPoseAction} from '@/types/assembly';
import type {DirectorPlan,DirectorShot,DirectorShotType,DirectorStep} from '@/types/director';
import type {Vector3Tuple} from '@/types/product';
import type {VideoDefinition} from '@/types/video';
import {DirectorPlanCompiler} from '@/engine/director/DirectorPlanCompiler';
import {fitInstructionalBox} from '@/engine/camera/InstructionalFraming';
import {steps01To20Plan,steps01To20Video} from './steps11-20';
import {compressOpening} from './final-opening-pacing';
import {mechanism,sideIds,hardware31,pos31,bedAnchor,cabAnchor,worldBedPoint,legAnchor,legPark,legHardware} from '../product/parts-step21-31';
import {legReconstruction} from '../product/foot-corner-reconstruction';

const cameras={...steps01To20Video.cameraPresets};
function view(id:string,min:Vector3Tuple,max:Vector3Tuple,direction:Vector3Tuple,fov=35,coverage=.72){
  const p=fitInstructionalBox(min,max,direction,coverage,fov),v=new THREE.Vector3(...direction).normalize(),right=new THREE.Vector3(0,1,0).cross(v).normalize(),up=v.clone().cross(right).normalize();
  const d=new THREE.Vector3(...p.position).distanceTo(new THREE.Vector3(...p.target)),shift=right.multiplyScalar(-d*Math.tan(fov*Math.PI/360)*16/9*.14).add(up.multiplyScalar(-d*Math.tan(fov*Math.PI/360)*.20));
  p.position=new THREE.Vector3(...p.position).add(shift).toArray() as Vector3Tuple;p.target=new THREE.Vector3(...p.target).add(shift).toArray() as Vector3Tuple;cameras[id]=p;return id;
}
function around(id:string,p:Vector3Tuple,r:Vector3Tuple,dir:Vector3Tuple){return view(id,p.map((v,i)=>v-r[i]) as Vector3Tuple,p.map((v,i)=>v+r[i]) as Vector3Tuple,dir);}
function shot(id:string,type:DirectorShotType,duration:number,camera:string,note:string,actions:AnimationAction[]=[]):DirectorShot{return{id,type,duration,camera,transition:'cut',note,actions};}
const stage=(id:string,d:Vector3Tuple):AnimationAction[]=>[{type:'move',target:id,to:pos31(id).map((v,i)=>v+d[i]) as Vector3Tuple,duration:0},{type:'show',target:id}];
function install(id:string,host:string,d:Vector3Tuple,duration:number,extra:InstallationDefinition={}):AnimationAction{return{type:'installPart',target:id,connection:{part:host,point:'mount'},duration,installation:{stagingOffset:d,preInstallOffset:d.map(v=>v*.25) as Vector3Tuple,approachDirection:d,approachDistance:.45,collisionTolerance:.025,estimated:true,...extra}};}
function hardware(id:string,duration:number,at=0,extra:InstallationDefinition={}):AnimationAction{
  const h=hardware31.get(id)!;const axis=h.normal[0]?'x':'z';
  return{type:h.kind,target:id,connection:{part:h.host,point:'mount'},at,duration,spinAxis:axis,turns:h.kind==='installDowel'||h.kind==='installWasher'?0:duration>1?4:2,
    installation:{approachDirection:h.normal,approachDistance:h.length+2,contactDistance:h.kind==='installNut'?.6:h.kind==='installWasher'?.45:h.length,
      mechanicalPhases:true,motionTiming:{approach:.24,contact:.04,feed:.68,seat:.04},allowedContacts:h.mates,collisionTolerance:.03,estimated:true,...extra}} as AnimationAction;
}
function link(side:number,attached:boolean,duration=0):TelescopicLinkAction{const s=sideIds(side);return{type:'telescopicLink',target:s.piston,rod:`${s.piston}-rod`,end:`${s.piston}-eyeB`,bodyLength:mechanism.bodyLength,anchorA:{part:'bed-motion-root',point:bedAnchor(side)},...(attached?{anchorB:{part:s.cab,point:[-side*.95,30,9.5] as Vector3Tuple}}:{}),freeOffset:[0,mechanism.freeLength,0],duration};}
export function bedPose(from:PivotPoseAction['from'],to:PivotPoseAction['to'],duration:number):PivotPoseAction{return{type:'pivotPose',target:'bed-motion-root',axis:'x',localPivot:mechanism.sourcePivot,from,to,duration,ease:'power2.inOut'};}
export function legPose(side:number,fromAngle:number,toAngle:number,duration:number):PivotPoseAction{return{type:'pivotPose',target:sideIds(side).leg,axis:'x',localPivot:legAnchor(side),from:{pivot:legAnchor(side),angle:fromAngle},to:{pivot:legAnchor(side),angle:toAngle},duration};}
const flat=view('S21-bed-context',[-123,30,150],[123,135,374],[.7,1.4,1.3]);
// The open functional pose must keep the feet and bed/cabinet relationship
// readable within the existing fog range; no material/lighting change.
const open=view('S29-open-context',[-123,0,-178],[123,232,25],[.65,1.0,-1.8],55,.78);
const upright=view('S27-raised-context',[-124,0,-50],[124,235,24],[.6,.5,-1.8]);
// Cut between local transport envelopes instead of fitting the union of all
// travel into one distant, fog-obscured view. Rear cuts see the staged bed
// directly; the outside cut proves the route around the closed cabinet.
// These are camera-only refinements: mechanics, timing, lighting and macros
// stay identical. Empty staging space is not an instructional framing target.
const transport=view('S25-supported-route',[-128,25,135],[128,190,385],[-.65,1.1,1.6],55,.78);
const outboard=view('S25-outbound',[-128,65,135],[430,190,385],[.3,1,1.7],55,.78);
const aroundCabinet=view('S25-outside-route',[175,65,-280],[430,190,385],[1,1.4,0],55,.78);
const frontStage=view('S25-front-stage',[-128,0,-280],[430,235,25],[.2,1,-1.7],55,.78);
const frontLift=view('S25-supported-lift',[-128,0,-275],[128,275,25],[.65,.7,-1.8],55,.78);
const frontSeat=view('S25-supported-seat',[-128,0,-165],[128,260,25],[.5,.3,-1],55,.78);
const routeCameras=[transport,outboard,aroundCabinet,frontStage,frontLift,frontLift,frontSeat];
// Keep both deployed feet above the larger completion caption in the last
// result hold. Same open viewpoint/direction; composition shift only.
const finalOpenResult='S31-open-result';
cameras[finalOpenResult]={...cameras[open],position:cameras[open].position.map((v,i)=>v-(i===1?40:0)) as Vector3Tuple,
  target:cameras[open].target.map((v,i)=>v-(i===1?40:0)) as Vector3Tuple};
const steps:DirectorStep[]=[];
function finish(n:number,title:string,parts:string[],hardwareLabel:string,shots:DirectorShot[]){steps.push({step:n,id:`step-${n}`,title,subtitle:`PDF page ${n<=24?Math.floor((n-21)/2)+22:n===25?24:n===26?25:n===27?26:n<=29?27:n===30?29:30}`,pdfPage:n<=24?Math.floor((n-21)/2)+22:n===25?24:n===26?25:n===27?26:n<=29?27:n===30?29:30,parts,hardwareLabel,shots});}
for(const side of [-1,1]){
  const n=side<0?21:22,s=sideIds(side),p=pos31(s.e1),macro=around(`S${n}-plate`,p,[10,9,20],[side*1.8,.7,-.6]),detail=around(`S${n}-screw`,pos31(`S${n}-H21-0`),[7,4,6],[side*1.8,.6,-.5]);
  finish(n,`${side<0?'First':'Mirrored'} E1 mechanism plate`,[s.e1],'E1 ×1 · #21 ×8',[
    shot(`S${n}-context`,'ESTABLISHING',side<0?1.8:.9,flat,'Complete bed stays supported flat. E1 belongs on the OUTSIDE of this C8 carrier side.'),
    shot(`S${n}-introduce`,'INTRODUCE_PART',side<0?1.5:.8,macro,'E1 orientation: large bearing spindle toward the cabinet pivot; small threaded stud toward the piston end.',[
      {type:'geometryVariant',target:side<0?'C8-left':'C8-right',variant:'mechanismReceivers'},...stage(s.e1,[side*8,0,0])]),
    shot(`S${n}-target`,'SHOW_TARGET',side<0?1.3:.65,macro,'Match all EIGHT pilot holes. Keep the studs facing outward.'),
    shot(`S${n}-seat`,'INSERT_PART',side<0?1.6:1.1,macro,'Axial approach, controlled final contact: E1 seats flush against the C8 outer face.',[install(s.e1,side<0?'C8-left':'C8-right',[side*8,0,0],side<0?1.45:.98)]),
    shot(`S${n}-first-screw`,'INSTALL_HARDWARE',side<0?1.4:.65,detail,'#21 screw: contact pilot, engage, visibly rotate/feed, then seat.',[hardware(`S${n}-H21-0`,side<0?1.25:.53)]),
    shot(`S${n}-remaining-screws`,'INSTALL_HARDWARE',3.5,macro,'Seven repeated #21 screws — rapid sequential installation, every approach and seat visible.',Array.from({length:7},(_,i)=>hardware(`S${n}-H21-${i+1}`,.42,i*.46))),
    shot(`S${n}-complete`,'STEP_COMPLETE',1.0,macro,'Eight screws seated. E1 plate secure; both integral studs remain accessible.'),
  ]);
}
for(const side of [-1,1]){
  const n=side<0?23:24,s=sideIds(side),p=pos31(s.e1),macro=around(`S${n}-mechanism`,p,[9,12,20],[side*1.8,.6,-.6]),piston=around(`S${n}-piston`,bedAnchor(side),[15,85,20],[side*1.7,.3,-.7]);
  finish(n,`${side<0?'First':'Mirrored'} bearing and piston bed-end`,[s.bearing,s.piston],'#19 ×1 · E2 750 N ×1 · #17 ×1',[
    shot(`S${n}-target`,'SHOW_TARGET',side<0?1.8:1,macro,'Identify TWO different axes: radial bearing onto the large hollow spindle; E2 eye onto the small threaded stud.'),
    shot(`S${n}-bearing-intro`,'INTRODUCE_PART',side<0?1.25:.75,macro,'#19 radial bearing — its central bore aligns with the E1 spindle.',stage(s.bearing,[side*6,0,0])),
    shot(`S${n}-bearing-seat`,'INSERT_PART',side<0?1.6:1.05,macro,'Slide #19 along X onto the spindle until its inner race seats; no bearing appears inside solid wood.',[install(s.bearing,s.e1,[side*6,0,0],side<0?1.45:.93)]),
    shot(`S${n}-piston-intro`,'INTRODUCE_PART',side<0?1.8:1.0,piston,'E2 gas piston, rated 750 N in the PDF. The cabinet-side end remains free and controlled upright.',[
      ...stage(s.piston,[side*6,0,0]),
      ...['body','rod','neck','eyeA','eyeB'].map(component=>({type:'show' as const,target:`${s.piston}-${component}`})),
    ]),
    shot(`S${n}-eye-seat`,'INSERT_PART',side<0?1.7:1.1,macro,'The lower E2 eye approaches the SMALL stud axially. Keep the other end supported; do not articulate the bed.',[install(s.piston,s.e1,[side*6,0,0],side<0?1.5:.95)]),
    shot(`S${n}-retain`,'INSTALL_HARDWARE',side<0?1.8:1.1,macro,'#17 nut aligns with the stud, visibly threads, and retains the E2 eye.',[link(side,false),hardware(s.bedNut,side<0?1.6:.95)]),
    shot(`S${n}-complete`,'VERIFY_CONNECTION',side<0?1.7:1.1,macro,'Bearing seated and piston BED end retained. The opposite end is still free; no large test yet.'),
  ]);
}
const P=mechanism.cabinetPivot,S=mechanism.sourcePivot;
const route=[{pivot:S,angle:0},{pivot:[0,95,S[2]] as Vector3Tuple,angle:0},{pivot:[300,95,S[2]] as Vector3Tuple,angle:0},
  {pivot:[300,95,-75] as Vector3Tuple,angle:0},{pivot:[0,95,-75] as Vector3Tuple,angle:0},{pivot:[0,85,-75] as Vector3Tuple,angle:70},
  {pivot:[0,47,-9.2] as Vector3Tuple,angle:70},{pivot:P,angle:70}];
// Look through the existing real front gap. Hold on the receiving lip so
// the FIRST bearing visibly enters the frame and seats against it.
const loweringEnd='S25-bearing-lowering-end';
// Sensor remains in the proven void BETWEEN the C2 lip and A3's inner
// surface. The farther trial was REJECTED because its sensor entered A3.
// Wider connection-only framing keeps the seating lip above the caption.
const bearingLoweringCamera=(y:number)=>({position:[-116.9,y+.4,-13] as Vector3Tuple,target:[-115.95,y-.6,-9.2] as Vector3Tuple,fov:75});
cameras[loweringEnd]=bearingLoweringCamera(P[1]);
const hero:DirectorShot[]=[shot('S25-context','ESTABLISHING',2.2,transport,'4 people required — controlled supported handling; cabinet stays fixed. Keep both free piston ends supported.'),
  shot('S25-receivers','SHOW_TARGET',1.5,loweringEnd,'PDF-left D8 open cradle: #19 lowers here. PDF-right D9 is mirrored on the SAME axis. Fit #18 only AFTER both bearings seat.',[-1,1].flatMap(side=>[
    {type:'geometryVariant' as const,target:sideIds(side).cab,variant:'mechanismStud'},
    {type:'geometryVariant' as const,target:side<0?'A9':'A9-R',variant:'pivotReceiver'},
  ]))];
const routeDurations=[1.9,2.3,2.8,2.2,2.3,1.8,1.65];
for(let i=0;i<route.length-1;i++)hero.push(shot(`S25-route-${i}`,'STAGE_PART',routeDurations[i]+.10,i===6?loweringEnd:routeCameras[i],
  ['4 people required — lift the ENTIRE secured bed, including hardware, with controlled support.','Carry outboard around the cabinet; keep the complete bed clear of the closed B8 back face.','Move around the outside to the OPEN front; no part passes through the cabinet.','Stage the complete bed in FRONT of the cabinet. Both free E2 ends remain supported.','Controlled supported orientation toward the two pivot receivers.','Enter from the open front BELOW the retained mounting web, aligning both bearings above the lower cradles.','Lower BOTH bearing centers together onto the shared pivot axis. Continue support until all retainers are fitted.'][i],
  [bedPose(route[i],route[i+1],routeDurations[i])]));
for(const side of [-1,1]){
  // Look through the REAL front gap, not through the installed cabinet or
  // carrier timber. The outside retainer is taught from its accessible side.
  const camera=`S25-${side}-pivot`;
  // The head-end C2 lip occludes the inner gap. Look just OUTSIDE its
  // 116.2-cm edge, through the real front opening into the bearing cradle.
  // Actual scene ray tests reach #19 first, not timber; nothing is hidden.
  cameras[camera]={position:[side*116.9,37.5,-13],target:[side*115.95,P[1],P[2]],fov:55};
  const retainer=around(`S25-${side}-outside-retainer`,pos31(`S25-H18-${side}`),[7,8,8],[side*1.8,.45,-.75]);
  hero.push(shot(`S25-${side}-connection`,'CONNECTION_MACRO',side<0?1.7:1.0,camera,'Bearing outer race seats in the open cradle; E1 spindle and cabinet retention bore are coaxial.'));
  hero.push(shot(`S25-${side}-retainer`,'INSTALL_HARDWARE',side<0?1.8:1.15,retainer,'PDF #18 only — visible axial approach, thread engagement and seating through the outside cabinet bore.',[hardware(`S25-H18-${side}`,side<0?1.6:1.0)]));
}
hero.push(shot('S25-complete','VERIFY_CONNECTION',1.5,frontSeat,'Both #18 retainers installed; bearings stay on the cabinet axis. CONTINUE four-person support for piston completion.'));
finish(25,'Mate the complete bed to the cabinet',[],'#18 ×2 · 4 people required',hero);
for(const side of [-1,1]){
  const n=side<0?26:27,s=sideIds(side),macro=around(`S${n}-cabinet-eye`,cabAnchor(side),[12,18,17],[-side*1.8,.3,-1.3]);
  const shots:DirectorShot[]=[];
  if(n===26)shots.push(shot('S26-supported-raise','STAGE_PART',2.3,upright,'4 people required — hold the cabinet and raise the bed only to the supported piston-installation pose.',[bedPose({pivot:P,angle:70},{pivot:P,angle:90},2.15)]));
  shots.push(shot(`S${n}-target`,'SHOW_TARGET',side<0?1.7:1.0,macro,'Cabinet threaded stud and free E2 eye — approach from the INTERIOR, not through the cabinet side.'),
    shot(`S${n}-eye-align`,'ALIGN_CONNECTION',side<0?2.2:1.5,macro,'Keep the bed supported; guide the free piston eye onto the cabinet stud. Both piston ends follow their real pivots.',[link(side,true,side<0?2.05:1.35)]),
    shot(`S${n}-retain`,'INSTALL_HARDWARE',side<0?1.9:1.3,macro,'#17 nut approaches from inside, engages the cabinet stud, visibly threads and seats against the eye.',[hardware(s.cabNut,side<0?1.7:1.15)]),
    shot(`S${n}-verify`,'VERIFY_CONNECTION',1.2,macro,'Cabinet-side E2 eye retained. Keep support until BOTH sides are complete.'));
  if(n===27)shots.push(shot('S27-small-test-out','VERIFY_CONNECTION',2.0,upright,'Both pistons and pivot retainers are secured: small supported 15° articulation test.',[bedPose({pivot:P,angle:90},{pivot:P,angle:75},1.85)]),
    shot('S27-small-test-return','VERIFY_CONNECTION',1.9,upright,'Return to the installation pose. Both bearing axes and all four E2 eyes remain connected.',[bedPose({pivot:P,angle:75},{pivot:P,angle:90},1.75)]),
    shot('S27-complete','STEP_COMPLETE',1.4,upright,'Dual-piston mechanism verified. No unanchored final demonstration.'));
  finish(n,`${side<0?'First':'Second'} cabinet-side piston retainer`,[],'#17 ×1 · 4 people required',shots);
}

const L=legReconstruction.supportedBedAngle;
const legBuild:DirectorShot[]=[shot('S28-supported-work-pose','STAGE_PART',2.8,open,
  'Keep four-person support. Lower the secured bed to a lightly raised work pose before building the separate legs. The 3° support angle is estimated staging, not a PDF measurement.',
  [bedPose({pivot:P,angle:90},{pivot:P,angle:L},2.65)])];
for(const side of [-1,1]){
  const s=sideIds(side),park:Vector3Tuple=[...legPark];
  const workPoint=(p:Vector3Tuple)=>worldBedPoint(p.map((v,i)=>v+park[i]) as Vector3Tuple,L);
  const center=workPoint([side*mechanism.legX+side*4,(legReconstruction.upperY+legReconstruction.lowerY)/2,legReconstruction.joinZ+6]);
  const wide=around(`S28-${side}-leg`,center,[12,23,15],[side*1,.4,-1.6]);
  legBuild.push(shot(`S28-${side}-intro`,'INTRODUCE_PART',side<0?1.6:.9,wide,'Separate leg subassembly: stepped D3 upright, rounded D7 pivot arm and D6 foot. Mirror the second side.',[
    {type:'move',target:s.leg,to:park,duration:0},...stage(`D3-${side}`,[0,0,0]),...stage(`D7-${side}`,[side*8,0,0]),...stage(`D6-${side}`,[side*8,0,0]),
  ]));
  for(const label of ['D7','D6']){
    const p=workPoint(pos31(`${label}-${side}`)),macro=around(`S28-${side}-${label}`,p,[14,6,13],[side*1.8,.5,-.5]);
    const outsideInsert=around(`S28-${side}-${label}-insert-face`,workPoint(pos31(`${label}-${side}`).map((v,i)=>v+(i===0?side*8:0)) as Vector3Tuple),[8,6,9],[side*1.8,.5,-.5]);
    const opposite=around(`S28-${side}-${label}-opposite-bolts`,p,[8,6,9],[-side*1.8,.5,-.5]);
    const ids=legHardware.filter(id=>id.startsWith(`S28-${side}-${label}`));
    legBuild.push(shot(`S28-${side}-${label}-inserts`,'INSTALL_HARDWARE',1.6,outsideInsert,'#9 canopy inserts enter the two bores from the OUTER face of the separate arm.',ids.filter(id=>id.includes('H9')).map((id,i)=>hardware(id,.65,i*.72,{allowStagedTarget:true}))),
      shot(`S28-${side}-${label}-dowels`,'INSTALL_HARDWARE',1.4,macro,'Two #7 Ø8 ×20 mm dowels seat half-depth in the stepped D3 receiver; exposed halves point toward the arm.',ids.filter(id=>id.includes('H7')).map((id,i)=>({...hardware(id,.55,i*.62),connection:{part:`D3-${side}`,point:'mount'}}))),
      shot(`S28-${side}-${label}-join`,'INSERT_PART',side<0?1.2:.85,macro,'Slide the arm axially onto both dowels. The complementary half-laps close face-to-face, not through solid wood. Both installed inserts move rigidly with the arm.',[install(`${label}-${side}`,`D3-${side}`,[side*8,0,0],side<0?1.05:.75,{allowedContacts:ids.filter(id=>id.includes('H7'))})]),
      shot(`S28-${side}-${label}-bolts`,'INSTALL_HARDWARE',1.4,opposite,'Two #1 bolts enter from the OPPOSITE face of D3 into the seated #9 inserts. Visible rotation and seating.',ids.filter(id=>id.includes('H1')).map((id,i)=>hardware(id,.6,i*.68))));
  }
  legBuild.push(shot(`S28-${side}-complete`,'STEP_COMPLETE',.9,wide,'D3 + D6 + D7 secured into one folding-leg subassembly; all four dowels, inserts and #1 bolts installed.'));
}
finish(28,'Build the two folding-leg subassemblies',['D3--1','D3-1','D6--1','D6-1','D7--1','D7-1'],'#7 ×8 · #9 ×8 · #1 ×8',legBuild);

const attachLegs:DirectorShot[]=[shot('S29-supported-open','STAGE_PART',2.8,open,'4 people required — hold the secured bed and lower the final supported angle to the leg-installation pose.',[bedPose({pivot:P,angle:L},{pivot:P,angle:0},2.65)])];
for(const side of [-1,1]){
  const s=sideIds(side),p=worldBedPoint(legAnchor(side),0),camera=around(`S29-${side}-joint`,p,[7,5,7],[side*1.8,.65,-.8]);
  const boltMacro=around(`S29-${side}-pivot-bolt`,p,[3,3.5,3.5],[side*1.8,.65,-.8]);
  const inside=around(`S29-${side}-inside-canopy`,worldBedPoint(pos31(`S29-${side}-H9`),0),[8,9,10],[-side*1.8,.65,-.8]);
  attachLegs.push(shot(`S29-${side}-insert`,'INSTALL_HARDWARE',.8,inside,'#9 canopy insert enters from the carrier INNER face; its axis matches D7 and the pivot bolt.',[hardware(`S29-${side}-H9`,.65)]),
    shot(`S29-${side}-washer`,'INSTALL_HARDWARE',1.1,camera,'WHITE PLASTIC #10 washer sits BETWEEN the C8 carrier and the D7 pivot arm.',[hardware(`S29-${side}-H10`,.9)]),
    shot(`S29-${side}-leg-approach`,'STAGE_PART',2.0,open,'Carry the entire completed leg toward the exposed outside pivot — every installed fastener moves with it.',[
      {type:'move',target:s.leg,from:legPark,to:[side*8,0,0],duration:1.85}]),
    shot(`S29-${side}-seat`,'INSERT_PART',1.25,camera,'Controlled axial leg seating onto the plastic washer; D7 bore and inner #9 insert stay coaxial.',[{type:'move',target:s.leg,from:[side*8,0,0],to:[0,0,0],duration:1.1}]),
    shot(`S29-${side}-bolt`,'INSTALL_HARDWARE',side<0?1.8:1.1,boltMacro,'#2 passes through D7 → white #10 washer → C8 → #9 insert. Fast visible thread feed; seat without clamping the leg rigid.',[hardware(`S29-${side}-H2`,side<0?1.6:.95)]),
  );
}
attachLegs.push(shot('S29-support-lift','STAGE_PART',.9,open,'Support and lift the foot end slightly before folding, so the heel clears the floor. The support angle is reconstructed, not manufacturer-specified.',[bedPose({pivot:P,angle:0},{pivot:P,angle:L},.8)]),
  shot('S29-fold-test','VERIFY_CONNECTION',2.0,open,'With the bed supported slightly above the floor, fold BOTH legs headward BELOW the bed face along their actual pivot axes.',[-1,1].map(side=>legPose(side,0,-90,1.85))),
  shot('S29-unfold-test','VERIFY_CONNECTION',1.9,open,'Unfold to the usable support position. Both plastic washers and pivot bolts remain fixed.',[-1,1].map(side=>legPose(side,-90,0,1.75))),
  shot('S29-lower-support','VERIFY_CONNECTION',.9,open,'Both legs deployed: lower the supported foot end until the feet meet the floor.',[bedPose({pivot:P,angle:L},{pivot:P,angle:0},.8)]),
  shot('S29-complete','STEP_COMPLETE',1.4,open,'Both folding legs attached and functionally checked. Support feet contact the floor.'));
finish(29,'Attach and verify both folding legs',[],'#2 ×2 · #10 WHITE PLASTIC ×2 · #9 ×2',attachLegs);

for(const side of [-1,1]){
  const n=side<0?30:31,shots:DirectorShot[]=[];
  if(n===30)shots.push(shot('wall-position','ESTABLISHING',2.3,open,'Positioning transition — assembled product at its installation wall. Wall is neutral context, not a specified substrate.',[{type:'show',target:'installation-wall'}]));
  for(const [i,y]of [208,32].entries()){
    const id=`S${n}-H15-${i}`,macro=around(`S${n}-${i}-anchor`,[side*123.2,y,18],[13,10,10],[side*1.8,.55,.9]);
    shots.push(shot(`S${n}-${i}-target`,'SHOW_TARGET',side<0&&i===0?1.6:.75,macro,'Secure cabinet to wall. #15 bent angle bridges the cabinet outside face and wall — TWO locations on this side.'),
      shot(`S${n}-${i}-bracket`,'INSERT_PART',1.35,macro,'Seat the separate #15 wall angle against both mounting faces; keep all holes visible.',[...stage(id,[side*5,0,-5]),install(id,side<0?'A5':'A6',[side*5,0,-5],1.2)]),
      shot(`S${n}-${i}-cabinet-screws`,'INSTALL_HARDWARE',side<0&&i===0?2.0:1.3,macro,'Two #14 M4 ×15 mm screws visibly drive through the bracket into the cabinet side.',[hardware(`${id}-H14-0`,side<0&&i===0?.9:.55),hardware(`${id}-H14-1`,side<0&&i===0?.9:.55,side<0&&i===0?.97:.62)]),
      shot(`S${n}-${i}-wall-screw`,'INSTALL_HARDWARE',side<0&&i===0?1.65:1.15,macro,'#23 M4 ×40 mm wall screw: align, contact, rotate/feed and seat. No additional anchor hardware is invented.',[hardware(`${id}-H23`,side<0&&i===0?1.5:1.0)]),
      shot(`S${n}-${i}-secured`,'VERIFY_CONNECTION',.9,macro,'Cabinet attachment and wall attachment secured at this location.'));
  }
  shots.push(shot(`S${n}-complete`,'STEP_COMPLETE',1.2,open,n===30?'First TWO wall angles secured; continue on the opposite side.':'All FOUR #15 brackets secured: #14 ×8 and #23 ×4 total. Option 1 assembly complete.'));
  if(n===31)shots.push(shot('final-support-lift','STAGE_PART',.9,open,'After all four wall anchors: support and lift the foot end slightly to clear the folding heels.',[bedPose({pivot:P,angle:0},{pivot:P,angle:L},.8)]),
    shot('final-fold-legs','VERIFY_CONNECTION',1.4,open,'Functional verification AFTER all four wall anchors: keep the bed supported and fold both legs headward beneath the face.',[-1,1].map(side=>legPose(side,0,-90,1.25))),
    shot('final-close','VERIFY_CONNECTION',3.0,upright,'Close under control. Bed rotates around both retained bearings; both connected pistons extend along their real endpoint axes.',[bedPose({pivot:P,angle:L},{pivot:P,angle:90},2.85)]),
    shot('final-closed','STEP_COMPLETE',1.2,upright,'Closed state — standalone Murphy Bed, no side storage and no Option 2.'),
    shot('final-open','VERIFY_CONNECTION',3.0,open,'Reopen under control to the slightly raised leg-deployment pose. Both pistons remain attached.',[bedPose({pivot:P,angle:90},{pivot:P,angle:L},2.85)]),
    shot('final-deploy-legs','VERIFY_CONNECTION',1.6,open,'Deploy both folding legs to the support position.',[-1,1].map(side=>legPose(side,-90,0,1.45))),
    shot('final-lower-support','VERIFY_CONNECTION',.9,open,'Legs fully deployed: lower the last supported angle until both feet meet the floor.',[bedPose({pivot:P,angle:L},{pivot:P,angle:0},.8)]),
    shot('final-result','STEP_COMPLETE',2.0,finalOpenResult,'Option 1 complete — open usable support state. Director review; reconstructed dimensions remain estimated.'));
  finish(n,`${side<0?'First':'Opposite'} two wall anchors`,[], '#15 ×2 · #14 ×4 · #23 ×2',shots);
}
const compressed=compressOpening(steps01To20Plan);
// Authorized receiver-view corrections belong only to this full package.
// Historical approved checkpoint cameras and all Step 4–20 durations remain.
const interior=(side:number)=>around(`full-D${side<0?8:9}-interior`,[side*116.35,73.5,0],[13,83,28],[-side*1.8,.5,-1.1]);
const interiorLeft=interior(-1),interiorRight=interior(1);
const opening={...compressed,steps:compressed.steps.map(step=>{
  if(step.step!==9&&step.step!==10)return step;
  const side=step.step===9?1:-1;
  return{...step,shots:step.shots.map(s=>{
    const hardware=s.actions.find(a=>'target'in a&&a.target.startsWith(`S${step.step}-H21-`));
    if(hardware&&'target'in hardware)return{...s,camera:around(`full-${s.id}-receiver`,pos31(hardware.target),[8,7,8],[-side*1.8,.55,-.85])};
    if(s.camera===`S${step.step}-interior`)return{...s,camera:side<0?interiorLeft:interiorRight};
    if(s.id==='S10-verify-right')return{...s,camera:interiorRight};
    return s;
  })};
})};
export const fullPlan:DirectorPlan={...opening,id:'wf311613-full-assembly',steps:[...opening.steps,...steps]};
export const fullAssembly=DirectorPlanCompiler.assembly(fullPlan);
let cursor=0;
export const fullVideo:VideoDefinition={...steps01To20Video,id:fullPlan.id,title:'WF311613 · Complete Option 1 director review',cameraPresets:cameras,
  scenes:DirectorPlanCompiler.scenes(fullPlan).map(s=>({...s,partIntro:undefined})),
  reviewCaptions:fullPlan.steps.flatMap(step=>step.shots.map(s=>{const start=cursor;cursor+=s.duration;return{start,end:cursor,title:s.type.replaceAll('_',' ').toLowerCase().replace(/^./,c=>c.toUpperCase()),note:(s.note??'').replace('STOP before Step 11.','Cabinet complete; continue with separate bed assembly.').replace('STOP before Step 21.','Bed complete; continue with E1 mechanism plates.')};}))};
export const fullRuntimes=fullPlan.steps.map(s=>({step:s.step,duration:s.shots.reduce((sum,s)=>sum+s.duration,0)}));
