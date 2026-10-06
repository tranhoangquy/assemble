from PIL import Image,ImageDraw,ImageFont
import pathlib,json,math
p=pathlib.Path('output/wf311613-standalone-murphy-bed/final/whole-product-visual-audit');m=json.loads((p/'capture-manifest.json').read_text());font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',19);titlefont=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',28)
def sheet(name,rows,cols=3,w=560):
 h=int(w*720/1280);ch=h+50;out=Image.new('RGB',(cols*w,80+math.ceil(len(rows)/cols)*ch),'#f1eee7');d=ImageDraw.Draw(out);d.text((20,20),name.replace('-',' ').upper(),font=titlefont,fill='#202820')
 for i,r in enumerate(rows):
  x=i%cols*w;y=80+i//cols*ch;im=Image.open(p/'stills'/f"{r['id']}.png").convert('RGB').resize((w,h));out.paste(im,(x,y));d.text((x+10,y+h+5),f"{r['id']} | {r['time']:.3f}s",font=font,fill='#202820')
 out.save(p/f'{name}.png')
sheet('A-hole-hardware-inspection',[r for r in m if r['group']=='closeups' and not r['id'].startswith(('joint-pivot25','joint-mechanism26','joint-piston27'))])
sheet('B-panel-fit-inspection',[r for r in m if r['id'] in ['step-03','step-06','step-10','step-17','step-20','step-25','step-26','step-28','step-31','closed-front','open-front','open-upper']])
sheet('C-open-state-multi-angle',[r for r in m if r['group']=='open'])
sheet('D-closed-state-multi-angle',[r for r in m if r['group']=='closed'])
sheet('E-assembly-state-inspection',[r for r in m if r['group']=='assembly'],4,480)
sheet('A1-cabinet-holes-closeups',[r for r in m if r['id'].startswith(('joint-A','joint-left-early','joint-right-early','joint-B8'))],3,640)
sheet('A2-mechanism-closeups',[r for r in m if 'interior' in r['id'] or 'bearing' in r['id'] or 'piston-open' in r['id']],3,640)
sheet('A3-leg-wall-closeups',[r for r in m if r['id'].startswith(('joint-leg','joint-wall'))],3,640)
sheet('B2-underside-closeups',[r for r in m if r['id'].startswith(('joint-underside','joint-grid','joint-carrier','joint-ties'))],3,640)
if all((p/'stills'/f"{r['id']}.png").exists() for r in m if r['group']=='finished'):
 sheet('C2-finished-open-state',[r for r in m if r['group']=='finished'],2,800)
