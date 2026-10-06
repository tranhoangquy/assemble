import {it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {fullProduct} from '../product/parts-step21-31';
import {polishPlan,polishRuntime} from '../director/polish-pass01';
import {polish02Plan,polish02Video,polish02Runtime,polish02Showcase} from '../director/polish-pass02';
import {presentationNameRows} from '../presentation/labels';
it('retains product/material hashes, all PDF steps and every locked shot duration',()=>{
  expect(createHash('sha256').update(JSON.stringify(fullProduct)).digest('hex')).toBe('29ef4258730c3e3691c84223d98e240d9a25854d079402377f97489ace5f9fb5');
  expect(polish02Plan.steps).toHaveLength(31);
  expect(polish02Plan.steps.map(s=>s.shots.map(shot=>[shot.id,shot.duration]))).toEqual(polishPlan.steps.map(s=>s.shots.map(shot=>[shot.id,shot.duration])));
  expect(polish02Video.presentation?.exposure).toBe(.97);
});
it('labels every physical instance without renaming or leaking raw IDs into captions',()=>{
  expect(presentationNameRows).toHaveLength(fullProduct.parts.length);
  for(const row of presentationNameRows)expect(row.presentationName).not.toMatch(/\b[A-E]\d+\b|#|PDF|rigid|transform|validator/);
  for(const c of polish02Video.reviewCaptions!)expect(c.title+c.note).not.toMatch(/\b[A-E]\d+\b|receiver|reconstruct|collision|Option/);
  expect(polish02Video.reviewCaptions!.filter(c=>c.hidden).length).toBeGreaterThan(200);
});
it('keeps props and extra scenes strictly after completed PDF assembly',()=>{
  const props=polish02Video.presentation!.finishedBedroom!;
  expect(props.start).toBe(polishRuntime);expect(props.mattressStart).toBeGreaterThan(polishRuntime);
  expect(polish02Video.scenes.slice(31).every(s=>s.phase==='showcase'&&!s.step&&!s.assemblyStep)).toBe(true);
  expect(polish02Runtime).toBeCloseTo(polishRuntime+polish02Showcase.reduce((n,s)=>n+s.duration,0));
  expect(polish02Video.audio).toEqual({voiceover:null,music:null});
});
