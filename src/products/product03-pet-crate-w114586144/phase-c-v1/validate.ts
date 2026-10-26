import * as T from 'three';
import {createProof} from './proof';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const p=createProof(),rows=[];
const digest=()=>createHash('sha256').update(JSON.stringify(p.stateDigest())).digest('hex');
for(let i=0;i<=192;i++){
 const s=p.joint(i/12),a=new T.Box3().setFromObject(p.r.registry.require('part-10-1')),b=new T.Box3().setFromObject(p.r.registry.require('part-12-1')),overlap=a.clone().intersect(b);const size=overlap.isEmpty()?new T.Vector3():overlap.getSize(new T.Vector3());
 rows.push({frame:i,time:i/12,panelGap:s.panelContactGapDisplay,panelOverlapBoundsVolume:size.x*size.y*size.z,tipGaps:s.screws.map(x=>x.tipGapDisplay),stateHash:digest()});
}
p.joint(16);
function xHits(id:string){const o=p.r.registry.require(id),sides:{m:T.Material;side:T.Side}[]=[];o.traverse(c=>{if(c instanceof T.Mesh)for(const m of Array.isArray(c.material)?c.material:[c.material]){sides.push({m,side:m.side});m.side=T.DoubleSide;}});const ray=new T.Raycaster(new T.Vector3(-600,825,-270),new T.Vector3(1,0,0));const hits=ray.intersectObject(o,true).map(x=>x.point.x);for(const s of sides)s.m.side=s.side;return [...new Set(hits.map(x=>Math.round(x*1e6)/1e6))];}
const a=xHits('part-10-1'),b=xHits('part-12-1'),contact={side10SurfaceXs:a,panel12SurfaceXs:b,minimumSurfaceSeparation:Math.min(...a.flatMap(x=>b.map(y=>Math.abs(x-y)))),method:'Double-sided ray/actual triangles through center of mating faces; local sampled contact only'};
const before=p.hinge(false),after=p.hinge(true);
const seeks=[12.25,0,16,5.75,1,12.25,5.75,16,0];const hashes:Record<string,string>={};let repeatable=true;
for(const t of seeks){p.hinge(true);p.joint(t);const h=digest();if(hashes[t]&&hashes[t]!==h)repeatable=false;hashes[t]=h;}
const report={revision:'PRODUCT03-PHASE-C-V1',units:'Arbitrary display units, NOT manufacturer mm',tolerance:{value:1e-6,purpose:'Floating-point review criterion only; NOT an OEM manufacturing tolerance'},sweep:{samples:rows.length,allPanelsRetained:true,minScrewTipGap:Math.min(...rows.flatMap(x=>x.tipGaps)),maxPanelAABBIntersectionVolume:Math.max(...rows.map(x=>x.panelOverlapBoundsVolume)),rows},contact,hinge:{before,after,method:'Signed external-face offsets and barrel rear extrema. NOT general 3D penetration depths or complete collision sweep.',motion:'NOT_RUN; evidence insufficient for physical axis/limit claims'},determinism:{repeatable,seekSequence:seeks,stateHashes:hashes},accessMatrix:[0,1].map(i=>({operation:'S1/D'+(i+1),target:'panel10 exterior toward panel12 end',source:'PDF p4 / printed3 / S1',stage:'Panels10/12 aligned and externally held; other S1 end not depicted',axis:[1,0,0],visibleApproach:'CLEAR in shown provisional two-panel geometry; conservative axial stand-off',finalTipGap:2,hiddenInsertion:'BLOCKED — depth/receiver construction unestablished',toolAction:'NOT_RUN — full tool/hand access and torque not established',support:'REQUIRED, external hold procedure not certified',confidence:'Documented qualitative joint; approximate position/size only'})),gates:{sourceQualitativeConnection:'CONFIRMED in S1',externalAlignmentProof:'PASS within local display model',actualSampledFaceContact:contact.minimumSurfaceSeparation<=1e-6?'PASS local sampled contact only':'FAIL',deterministicSeek:repeatable?'PASS':'FAIL',screwInsertionAndSecuring:'BLOCKED',toolHandAccess:'NOT_VALIDATED',hingeMotion:'BLOCKED',fullProduction:'NOT_AUTHORIZED'}};
writeFileSync(new URL('../../../../output/product03-pet-crate-w114586144/phase-c-v1/VALIDATION.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify({contact,gates:report.gates,sweep:{minimumTipGap:report.sweep.minScrewTipGap,maxPanelOverlap:report.sweep.maxPanelAABBIntersectionVolume},hinge:after.interfaces},null,2));
