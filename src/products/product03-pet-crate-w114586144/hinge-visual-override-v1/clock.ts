import {hardware} from '../continuous-production-v1/option-n-runtime';
export const blocks=[2,4,6,8].map((n,index)=>({index,source:hardware.find(h=>h.id===`hardware-E-${n}`)!.end,duration:4,door:index<2?'7':'8',upper:index%2===1}));
export const cycle=1.8,proofStart=208.5,proofDuration=35.5;
/** Evidence clock only. Four additional illustrative pauses; no OEM motion is accelerated. */
export function extendedClock(time:number){let shift=0;for(const b of blocks){const start=b.source+shift;if(time<start)return{time,source:time-shift,block:null,elapsed:0};if(time<start+b.duration)return{time,source:b.source,block:b,elapsed:time-start};shift+=b.duration;}return{time,source:time-shift,block:null,elapsed:0};}
/** PROPOSED 278-second fit, not full-render authority: 16s new hinge work,
 * alignment still15→5s, final static study10→4s. S17/S18/N motions unaccelerated. */
export function proposedLongClock(time:number){if(time<263)return extendedClock(time);if(time<268)return{time,source:247+(time-263)*3,block:null,elapsed:0};if(time<274)return{time,source:262+(time-268),block:null,elapsed:0};return{time,source:268+(time-274)*2.5,block:null,elapsed:0};}
export function blockStart(index:number){return blocks[index].source+index*4;}
