import {expect,it} from 'vitest';
import {musicFilter,validateMusicApproval} from './approved-music';
it('rejects unapproved, unknown-rights and different-hash assets',()=>{
  const a={file:'music.wav',sha256:'abc',approvedByUser:true,rightsDescription:'Explicit licensed use',rightsEvidence:'User provided license'};
  expect(()=>validateMusicApproval(a,'abc')).not.toThrow();
  expect(()=>validateMusicApproval({...a,approvedByUser:false},'abc')).toThrow();
  expect(()=>validateMusicApproval({...a,rightsEvidence:''},'abc')).toThrow();
  expect(()=>validateMusicApproval(a,'def')).toThrow();
});
it('loops with overlap/fades/headroom without changing visual time',()=>{
  const f=musicFilter(520,80);expect(f).toContain('acrossfade');expect(f).toContain('atrim=duration=520');expect(f).toContain('volume=0.18');expect(f).not.toMatch(/setpts=.*1\.5|atempo/);
});
