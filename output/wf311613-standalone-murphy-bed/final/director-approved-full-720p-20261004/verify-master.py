import pathlib,json,subprocess,hashlib,struct
p=pathlib.Path(__file__).resolve().parent
v=p/'WF311613-director-approved-full-720p.mp4'
m=json.loads((p/'frames/render-manifest.json').read_text())
g=json.loads((p/'pre-render-gate.json').read_text())
frames=sorted((p/'frames').glob('frame-*.png'))
assert len(frames)==15722,len(frames)
for i,f in enumerate(frames):
 assert f.name==f'frame-{i:06d}.png'
 with f.open('rb') as h: header=h.read(24)
 assert header[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',header[16:24])==(1280,720)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(v)]))
(p/'ffprobe.json').write_text(json.dumps(probe,indent=2))
s=[s for s in probe['streams'] if s['codec_type']=='video'][0]
assert (s['width'],s['height'])==(1280,720)
assert s['codec_name']=='h264' and s['pix_fmt']=='yuv420p' and s['avg_frame_rate']=='30/1'
assert int(s['nb_read_frames'])==15722
assert abs(float(s['duration'])-15722/30)<.001
r=subprocess.run(['ffmpeg','-v','error','-i',str(v),'-f','null','-'],capture_output=True,text=True)
(p/'full-decode.log').write_text(r.stderr)
assert r.returncode==0 and not r.stderr.strip(),r.stderr
selected=[0,2400,6000,9000,13125,14010,15090,15300,15510,15700]
spots=p/'decoded-spots';spots.mkdir(exist_ok=True)
expr='+'.join(f'eq(n\\,{i})' for i in selected)
subprocess.run(['ffmpeg','-v','error','-i',str(v),'-vf',f'select={expr}','-fps_mode','vfr',str(spots/'spot-%02d.png')],check=True)
freeze=json.loads((p.parent/'whole-product-visual-audit/approved-source-freeze.json').read_text())
repo=p.parents[3]
assert all(hashlib.sha256((repo/k).read_bytes()).hexdigest()==x['approvedSHA256'] for k,x in freeze['files'].items())
h=hashlib.sha256()
with v.open('rb') as f:
 for chunk in iter(lambda:f.read(8*1024*1024),b''):h.update(chunk)
result={'valid':True,'productSha256':g['productSha256'],'videoSha256':h.hexdigest(),'bytes':v.stat().st_size,'profile':'720p','width':1280,'height':720,'fps':30,'frames':15722,'encodedDuration':float(s['duration']),'timelineDuration':g['duration'],'fullDecode':'PASS','freshSequenceFromFrameZero':True,'audioStreams':sum(s['codec_type']=='audio' for s in probe['streams']),'sourcesUnchanged':True,'decodedSpotFrameIndices':selected,'manifest':m}
(p/'MASTER-VERIFICATION.json').write_text(json.dumps(result,indent=2));print(json.dumps({k:x for k,x in result.items() if k!='manifest'},indent=2))
