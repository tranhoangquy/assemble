import pathlib,json,subprocess
P=pathlib.Path(__file__).resolve().parent;V=P/'WF311613-audio-pass01-720p.mp4'
def packets(f,stream):return json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams',stream,'-show_packets','-show_data_hash','sha256','-show_entries','packet=pts_time,data_hash','-of','json',str(f)]))['packets']
v=packets(V,'v:0');a=packets(V,'a:0');results=[]
for c in json.loads((P/'review-clips.json').read_text()):
 cv=packets(c['file'],'v:0');ca=packets(c['file'],'a:0');lo=c['sourceKeyframeRange'][0]
 orig=min((p for p in v if p['data_hash']==cv[0]['data_hash']),key=lambda p:abs(float(p['pts_time'])-lo));shift=float(cv[0]['pts_time'])-float(orig['pts_time'])
 errors=[]
 for stream,original in [(cv,v),(ca,a)]:
  for p in stream[:10]:
   target=float(p['pts_time'])-shift;delta=min(abs(float(x['pts_time'])-target) for x in original if x['data_hash']==p['data_hash']);errors.append(delta);assert delta<1/48000+1/15360+.000002,(c['id'],target,delta)
 r=subprocess.run(['ffmpeg','-v','error','-i',c['file'],'-f','null','-'],capture_output=True,text=True);assert r.returncode==0 and not r.stderr.strip();results.append({'clip':c['id'],'audioAndVideoTimestampShiftIdentical':True,'commonShiftSeconds':shift,'sampledVideoPackets':10,'sampledAudioPackets':10,'maximumTimestampRoundingSeconds':max(errors),'timebaseRoundingBudgetSeconds':1/48000+1/15360+.000002,'fullClipDecode':'PASS'})
(P/'review-clips-sync-QA.json').write_text(json.dumps({'valid':True,'clips':results},indent=2));print(f'{len(results)} review clips: same A/V shift and full decode PASS.')
