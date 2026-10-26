import segments from './option-n-segments.json';
export {segments};
/** One source clock for ALL actors. Only source-static intervals change duration.
 * Every moving phase has slope1. No independent hardware/host freeze. */
export function toV2(time:number){
 const t=Math.max(0,Math.min(278,time));
 const s=segments.find(s=>t<s.proposedEnd)??segments.at(-1)!;
 return s.baselineStart+(t-s.proposedStart)/(s.proposedEnd-s.proposedStart)*(s.baselineEnd-s.baselineStart);
}
export function fromV2(time:number){
 const t=Math.max(0,Math.min(278,time));
 const s=segments.find(s=>t<s.baselineEnd)??segments.at(-1)!;
 return s.proposedStart+(t-s.baselineStart)/(s.baselineEnd-s.baselineStart)*(s.proposedEnd-s.proposedStart);
}
