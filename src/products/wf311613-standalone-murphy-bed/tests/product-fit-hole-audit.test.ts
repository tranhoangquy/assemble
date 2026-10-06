import type {PartDefinition} from '@/types/product';
import {it,expect} from 'vitest';
import {auditProductFit} from '../validation/product-fit-audit';
import {auditProductHoles} from '../validation/product-hole-audit';
import {fullProduct} from '../product/parts-step21-31';
import {correctProductFitAndHoles} from '../product/fit-hole-correction';
it('seats the screenshot side-board and all side mating surfaces in assembled, closed and open states',()=>{
 const r=auditProductFit();expect(r.errors).toEqual([]);expect(r.valid).toBe(true);expect(r.contacts).toHaveLength(32);
},180000);
it('classifies every explicit bore and driver recess, retaining matched hardware axes',()=>{
 const r=auditProductHoles();expect(r.errors).toEqual([]);expect(r.rows.length).toBeGreaterThan(1000);expect(r.rows.every(row=>row.category!=='UNJUSTIFIED')).toBe(true);
 const axes=r.rows.filter(r=>r.category!=='ASSEMBLY_ACCESS'&&r.category!=='REQUIRED_CONNECTION');expect(axes.every(r=>r.match&&r.match.distance<1e-4)).toBe(true);
});
it('rejects an independently generated decorative hole',()=>{
 const p=fullProduct.parts.find(p=>p.id==='B8-4--1')!;if(p.type!=='mesh')throw Error('Missing panel');const original=p.geometry;
 try{p.geometry={type:'bored-panel',size:[100,49,1.2],boreAxis:'z',holes:[{x:13.123,z:17.456,radius:.5}]};expect(auditProductHoles().errors.some(e=>e.startsWith(p.id))).toBe(true);}finally{p.geometry=original;}
 const rail=fullProduct.parts.find(p=>p.id==='E3')!;if(rail.type!=='mesh'||rail.geometry.type!=='bored-panel')throw Error('Missing cam receiver');
 const bore=rail.geometry.faceBores!.find(b=>b.radius===.8)!,face=bore.face;
 try{bore.face='both';expect(auditProductHoles().errors.some(e=>e.includes('unoccupied opposite'))).toBe(true);}finally{bore.face=face;}
});
it('keeps corrected receiver axes at their original coordinates while moving only the solid envelope',()=>{
 const parts:PartDefinition[]=structuredClone([{id:'A5',name:'panel',type:'mesh' as const,position:[25.5,1.55,0] as [number,number,number],material:'oak-x',geometry:{type:'bored-panel' as const,size:[165,3,28] as [number,number,number],holes:[{x:66.5,z:12,radius:.8}]}}]);
 correctProductFitAndHoles(parts);const part=parts[0];if(part.type!=='mesh')throw Error('Missing mesh');const g=part.geometry;if(g.type!=='compound')throw Error('Missing corrected solid');const p=g.pieces[0];if(p.geometry.type!=='bored-panel')throw Error('Missing receiver');expect(p.geometry.faceBores![0].position[0]+p.position![0]).toBe(66.5);expect(p.geometry.faceBores![0].face).toBe('positive');expect(parts[0].position).toEqual([25.5,1.55,0]);
});
