/** Human continuous authority + actual LongV2 Director decision.
 * All shown motion is source-speed; only explicit editorial cuts/holds. */
export const shots=[
 {id:'preview',start:0,end:2,source:272,hold:272,title:'Wood & steel',action:'Appearance preview · door operation on hold',chapter:'APPEARANCE PREVIEW',omit:false},
 {id:'first-joint',start:2,end:11.9,source:0,sourceEnd:9.76,hold:9.759999999,title:'Place first. Then fasten.',action:'D1 + L · exterior connection',chapter:'01 / UPPER MODULE',omit:false},
 {id:'dividers',start:11.9,end:15.9,source:18,title:'Add the dividers',action:'Repeated screws omitted · see Long',chapter:'02 / FORWARD CUT',omit:true},
 {id:'top',start:15.9,end:18.4,source:31,title:'Align the top',action:'Contact before the fasteners',chapter:'03 / FORWARD CUT',omit:true},
 {id:'two-bolts',start:18.4,end:31.7,source:41,title:'One bracket. Both bolts.',action:'K + B ×2 · K22/10 unmeasured',chapter:'04 / CONNECTION CLOSE-UP',omit:true},
 {id:'feet',start:31.7,end:34.1,source:108.5,title:'Prepare A4 + A5',action:'A5 stays with its host frame 5',chapter:'07 / FORWARD CUT',omit:true},
 {id:'sides',start:34.1,end:39.6,source:112,title:'Join the side frames',action:'Retain the first frame on the second side',chapter:'08 / FRAME ASSEMBLY',omit:true},
 {id:'frame5',start:39.6,end:42.6,source:189.25,title:'Bring in prepared frame 5',action:'Repeated frame / rail work omitted',chapter:'14 / FORWARD CUT',omit:true},
 {id:'floor',start:42.6,end:44.6,source:205.15,title:'Place the floor',action:'No fasteners added',chapter:'15 / FORWARD CUT',omit:true},
 {id:'door1',start:44.6,end:46.6,source:208.5,title:'Place door 7',action:'Align before the exterior screws',chapter:'16 / DOOR PLACEMENT',omit:false},
 {id:'hinge-pair',start:46.6,end:50.8,source:210.75,sourceEnd:214.8251,hold:214.825099999,title:'Show the exterior hinge screws',action:'E1 + E2 · tool M withdraws',chapter:'16 / HARDWARE CLOSE-UP',omit:false},
 {id:'door2',start:50.8,end:52.8,source:218.1952,title:'Place door 8',action:'Door 7 retained · repeated screws omitted',chapter:'16 / FORWARD CUT',omit:true},
 {id:'upper-pose',start:52.8,end:53.53333333333333,source:231,hold:231,title:'Pose only',action:'Retention unverified',chapter:'17 / EXTERIOR STUDY',omit:true},
 {id:'lower-pose',start:53.53333333333333,end:54.266666666666666,source:241,hold:241,title:'I / J unresolved',action:'Pose only · no fastening claim',chapter:'18 / EXTERIOR STUDY',omit:true},
 {id:'pads-hold',start:54.266666666666666,end:55,source:266,hold:266,title:'Four pads remain on hold',action:'No door operation demonstrated',chapter:'19 / HOLD',omit:true},
 {id:'hero',start:55,end:59,source:272,hold:272,title:'An illustrative assembly study',action:'F nonliteral · C / I-J open · pads / door HOLD',chapter:'APPEARANCE / NOT READY-TO-USE PROOF',omit:true},
] as const;
export function evaluateEdit(time:number){const t=Math.max(0,Math.min(59-1e-9,time)),shot=shots.find(s=>t>=s.start&&t<s.end)!;let sourceTime:number;if('sourceEnd'in shot)sourceTime=t-shot.start<shot.sourceEnd-shot.source?shot.source+(t-shot.start):shot.hold;else sourceTime='hold'in shot?shot.hold:shot.source+(t-shot.start);return{time:t,shot,sourceTime};}
export const duration=59,fps=30,totalFrames=1770;
