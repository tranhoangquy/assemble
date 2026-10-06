/** No default asset and no network fetching. The visual timeline is authoritative. */
export interface ApprovedMusicAsset {
  file:string;
  sha256:string;
  approvedByUser:boolean;
  rightsDescription:string;
  rightsEvidence:string;
}
export function validateMusicApproval(asset:ApprovedMusicAsset,actualSha:string){
  if(!asset.approvedByUser||!asset.file||!asset.rightsDescription.trim()||!asset.rightsEvidence.trim()||asset.sha256!==actualSha)throw new Error('A specific user-approved asset with known usage rights and matching SHA-256 is required.');
}
export function musicFilter(videoDuration:number,trackDuration:number){
  if(videoDuration<=0||trackDuration<=3)throw new Error('Invalid duration for clean music looping');
  const overlap=Math.min(2,trackDuration*.2);
  const loops=Math.max(1,Math.ceil((videoDuration-overlap)/(trackDuration-overlap)));
  const split=loops===1?'[1:a]aresample=48000[m0]':`[1:a]aresample=48000,asplit=${loops}${Array.from({length:loops},(_,i)=>`[m${i}]`).join('')}`;
  const chain=[split];let last='m0';
  for(let i=1;i<loops;i++){chain.push(`[${last}][m${i}]acrossfade=d=${overlap}:c1=tri:c2=tri[mix${i}]`);last=`mix${i}`;}
  chain.push(`[${last}]atrim=duration=${videoDuration},asetpts=PTS-STARTPTS,volume=0.18,alimiter=limit=0.8:level=false,afade=t=in:d=1.8,afade=t=out:st=${Math.max(0,videoDuration-2.5)}:d=2.5[music]`);
  return chain.join(';');
}
