/** Usage: node --import tsx scripts/mux-approved-music.ts
 * --video <visual-master.mp4> --approval <approved-asset.json> --output <new.mp4>
 * Does not overwrite input, download assets, or retime product animation. */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {musicFilter,validateMusicApproval,type ApprovedMusicAsset} from '../src/presentation/audio/approved-music';
const arg=(name:string)=>{const i=process.argv.indexOf(name);if(i<0||!process.argv[i+1])throw new Error(`Required ${name}`);return path.resolve(process.argv[i+1]);};
async function main(){
  const video=arg('--video'),approval=arg('--approval'),output=arg('--output');
  if(output===video)throw new Error('Output must be a NEW file');
  const asset=JSON.parse(await readFile(approval,'utf8')) as ApprovedMusicAsset;
  const music=path.resolve(path.dirname(approval),asset.file),sha=createHash('sha256').update(await readFile(music)).digest('hex');
  validateMusicApproval(asset,sha);
  const duration=(file:string)=>Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',file],{encoding:'utf8'}).trim());
  const length=duration(video),filter=musicFilter(length,duration(music));
  execFileSync('ffmpeg',['-n','-i',video,'-i',music,'-filter_complex',filter,'-map','0:v:0','-map','[music]','-c:v','copy','-c:a','aac','-b:a','192k','-t',String(length),'-movflags','+faststart',output],{stdio:'inherit'});
  console.log(output);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
