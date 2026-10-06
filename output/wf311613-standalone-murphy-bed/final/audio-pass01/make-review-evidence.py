from PIL import Image,ImageDraw
import pathlib,json,math
P=pathlib.Path(__file__).resolve().parent;w=json.loads((P/'waveform-summary.json').read_text());plan=json.loads((P/'AudioCuePlan.json').read_text());im=Image.new('RGB',(1500,420),'#f2f0e9');d=ImageDraw.Draw(im);d.text((30,20),'WF311613 Audio Pass 01 | SFX only | deterministic semantic cues',fill='#202520');left=80;right=1460;top=70;bottom=340
for db in [-15,-30,-45,-60,-90]:
 y=bottom-(db+90)/90*(bottom-top);d.line((left,y,right,y),fill='#c3c5bc');d.text((20,y-6),f'{db} dBFS',fill='#52564c')
for row in w['windows']:
 x=left+row['second']/w['duration']*(right-left);y=bottom-(max(-90,row['peakDbfs'])+90)/90*(bottom-top);d.line((x,bottom,x,y),fill='#365f58',width=2)
for t in [0,60,120,180,240,300,360,420,480,524]:
 x=left+t/w['duration']*(right-left);d.text((x-12,355),f'{t//60:02}:{t%60:02}',fill='#303830')
d.text((80,390),'One-second sample peaks; silent gaps are intentional. No music/narration. Cue phases in AudioCuePlan.json.',fill='#303830');im.save(P/'WAVEFORM-OVERVIEW.png')
selected=[next(c for c in plan['cues'] if c['semanticEvent']==typ) for typ in ['PART_SEAT','DOWEL_INSERT','CAM_INSERT','SCREW_TIGHTEN','BEARING_SEAT','PISTON_ATTACH','LEG_ATTACH','WALL_ANCHOR']];im=Image.new('RGB',(1280,4*392),'#f2f0e9');d=ImageDraw.Draw(im)
for i,c in enumerate(selected):
 n=math.ceil(c['renderedTimestamp']*30-1e-7);f=P.parent/f'director-approved-full-720p-20261004/frames/frame-{n:06d}.png';tile=Image.open(f).convert('RGB');tile.thumbnail((640,360));x=i%2*640;y=i//2*392;im.paste(tile,(x,y+30));d.text((x+10,y+6),f'{c["cueId"]} {c["semanticEvent"]} | {c["renderedTimestamp"]:.3f}s | frame {n}',fill='#202520')
im.save(P/'CUE-SYNC-MASTER-FRAMES.png')
