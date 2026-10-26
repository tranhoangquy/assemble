#!/usr/bin/env python3
"""Verify retained media; optional lossless container remux to a NEW output.
No render, audio mixing, network or overwrite. Verification is the default.
"""
from pathlib import Path
import argparse,hashlib,json,subprocess,shutil
ROOT=Path(__file__).resolve().parents[1]
def digest(p):
 h=hashlib.sha256()
 with p.open('rb')as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('product',choices=['01','03']);p.add_argument('film',choices=['long','short']);p.add_argument('--output',type=Path,help='Optional NEW output MP4; stream-copy approved video+audio, never re-encode');a=p.parse_args();row=json.loads((ROOT/'docs/publishing/release-catalog.json').read_text())['products'][a.product]['films'][a.film];v=ROOT/row['path'];w=ROOT/row['audioMaster'];assert digest(v)==row['sha256'],'Final media identity mismatch';assert digest(w)==row['audioSHA256'],'Archive audio identity mismatch'
 if a.output:
  out=a.output.resolve();assert out.suffix.lower()=='.mp4'and not out.exists(),'A new MP4 path is required';assert out!=v.resolve();out.parent.mkdir(parents=True,exist_ok=True);ffmpeg=shutil.which('ffmpeg');assert ffmpeg,'Existing FFmpeg required';subprocess.run([ffmpeg,'-v','error','-i',str(v),'-map','0:v:0','-map','0:a:0','-c','copy','-map_metadata','0','-movflags','+faststart','-n',str(out)],check=True);print(json.dumps({'status':'NEW LOSSLESS REMUX CREATED','output':str(out),'sha256':digest(out),'note':'Container hash may differ; approved encoded streams copied without processing.'}))
 else:print(json.dumps({'status':'INPUT IDENTITY PASS','video':row['path'],'audio':row['audioMaster'],'renderOrMuxStarted':False}))
if __name__=='__main__':main()
