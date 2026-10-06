import {it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {polish02Plan,polish02Assembly,polish02Video,polish02Runtime} from '../director/polish-pass02';
import {polish02bVideo,polish02bRuntime,finishedCameras} from '../director/polish-pass02b';
import {polishRuntime} from '../director/polish-pass01';
import {fullProduct} from '../product/parts-step21-31';
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
it('02B is strictly post-assembly: byte-equivalent scenes, captions, actions and cameras',()=>{
  expect(JSON.stringify(polish02bVideo.scenes.slice(0,31))).toBe(JSON.stringify(polish02Video.scenes.slice(0,31)));
  expect(polish02bVideo.reviewCaptions).toBe(polish02Video.reviewCaptions);
  for(const [id,camera]of Object.entries(polish02Video.cameraPresets))expect(polish02bVideo.cameraPresets[id]).toBe(camera);
  for(let i=31;i<polish02Video.scenes.length;i++){
    expect(polish02bVideo.scenes[i].actions).toBe(polish02Video.scenes[i].actions);
    expect(polish02bVideo.scenes[i].duration).toBe(polish02Video.scenes[i].duration);
    expect(polish02bVideo.scenes[i].phase).toBe('showcase');
  }
  expect(Object.keys(finishedCameras).every(id=>!polish02Video.scenes.slice(0,31).some(s=>s.camera===id))).toBe(true);
  expect(polishRuntime).toBeCloseTo(498.253694,6);expect(polish02bRuntime).toBe(polish02Runtime);
  expect(polish02Plan.steps).toHaveLength(31);expect(polish02Assembly.steps).toHaveLength(31);
});
it('02B preserves approved product/material, mechanism plan and mattress fit',()=>{
  expect(hash(fullProduct)).toBe('29ef4258730c3e3691c84223d98e240d9a25854d079402377f97489ace5f9fb5');
  expect(hash(fullProduct.materials)).toBe('d9a96203382d9d92eaaec1cab45a97f97da01ac13d5fbec739477c9f06514bcc');
  expect(hash(polish02Plan)).toBe('71d51ebb80ef00f1890e29a27490768da8f10382c11a7be4b896c37f58e6c424');
  expect(hash(polish02Video)).toBe('f68a4e76161af883c652191de4afd2a810bf315c68b2c31d1243f7464d496202');
  const a=polish02Video.presentation!,b=polish02bVideo.presentation!;
  expect(b.environment).toBe(a.environment);expect(b.exposure).toBe(a.exposure);expect(b.fog).toBe(a.fog);
  expect(b.finishedBedroom!.mattress).toBe(a.finishedBedroom!.mattress);
  expect(b.finishedBedroom!.start).toBe(polishRuntime);
  expect(b.finishedBedroom!.mattressStart).toBe(a.finishedBedroom!.mattressStart);
  expect(b.finishedBedroom!.beddingStart).toBe(a.finishedBedroom!.beddingStart);
  expect(polish02bVideo.audio).toEqual({music:null,voiceover:null});
});
