import * as T from 'three';
import type {createRuntime} from './runtime';
let label:HTMLDivElement|undefined;
/** Screen annotation only. No additional mesh, pad placement, or connection. */
export function updatePadCallout(r:ReturnType<typeof createRuntime>,camera:T.PerspectiveCamera,time:number,portrait=false){
 if(!label){label=document.createElement('div');label.style.cssText=`position:fixed;pointer-events:none;background:#6d553df2;color:white;padding:8px 10px;border-left:3px solid #dbc4a2;font:600 ${portrait?25:15}px/1.3 Arial;max-width:${portrait?330:260}px`;document.body.append(label);}
 const visible=Array.from({length:4},(_,i)=>r.r.registry.require(`hardware-N-${i+1}`)).filter(o=>o.visible);
 label.style.display=visible.length?'block':'none';if(!visible.length)return;
 const point=visible.reduce((v,o)=>v.add(o.getWorldPosition(new T.Vector3())),new T.Vector3()).multiplyScalar(1/visible.length).project(camera),x=(point.x+1)*innerWidth/2,y=(1-point.y)*innerHeight/2;
 label.textContent=`N ×${visible.length}/4 · EVA pads\nHELD · NOT INSTALLED`;
 label.style.whiteSpace='pre-line';
 label.style.left=`${Math.max(portrait?72:28,Math.min(innerWidth-(portrait?480:300),x+22))}px`;
 label.style.top=`${Math.max(portrait?240:90,Math.min(portrait?1180:510,y-58))}px`;
}
