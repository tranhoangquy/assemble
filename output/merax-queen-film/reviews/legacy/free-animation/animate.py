from PIL import Image, ImageDraw, ImageFont
import math, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
W, H, FPS = 1280, 720, 24
DUR = 6
SCENES = 8
FONT_B = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_R = "/System/Library/Fonts/Supplemental/Arial.ttf"

WHITE = (246, 243, 235)
INK = (29, 31, 32)
MUTED = (97, 101, 103)
GOLD = (224, 164, 76)
WALNUT = (105, 61, 38)
WALNUT_L = (139, 84, 49)
GRAY = (78, 86, 88)
GRAY_L = (112, 122, 124)
RED = (198, 66, 52)

def font(size, bold=False):
    return ImageFont.truetype(FONT_B if bold else FONT_R, size)

def ease(t):
    t = max(0, min(1, t))
    return t*t*(3-2*t)

def lerp(a, b, t): return a + (b-a)*ease(t)

def add_shadow(draw, box, radius=14):
    x1,y1,x2,y2=box
    draw.rounded_rectangle((x1+9,y1+11,x2+9,y2+11), radius=radius, fill=(0,0,0,35))

def panel(draw, box, fill, label=None, outline=INK, width=3):
    add_shadow(draw, box)
    draw.rounded_rectangle(box, radius=10, fill=fill, outline=outline, width=width)
    x1,y1,x2,y2=box
    if fill in (WALNUT, WALNUT_L):
        for x in range(int(x1)+12, int(x2), 18):
            draw.line((x,y1+6,x+4,y2-6), fill=(83,46,29), width=1)
    if label:
        draw.ellipse((x1+10,y1+10,x1+42,y1+42), fill=GOLD)
        draw.text((x1+26,y1+26), label, font=font(17,True), fill=INK, anchor="mm")

def screw(draw, x, y):
    draw.ellipse((x-6,y-6,x+6,y+6), fill=(205,207,205), outline=INK, width=2)
    draw.line((x-3,y,x+3,y), fill=INK, width=2)

def arrow(draw, p1, p2, color=GOLD):
    draw.line((*p1,*p2), fill=color, width=5)
    ang=math.atan2(p2[1]-p1[1],p2[0]-p1[0])
    for d in (-0.6,0.6):
        q=(p2[0]-18*math.cos(ang+d),p2[1]-18*math.sin(ang+d))
        draw.line((*p2,*q), fill=color, width=5)

def header(draw, step, title, note=""):
    draw.rounded_rectangle((28,22,1252,98), radius=18, fill=INK)
    draw.text((60,59), f"STEP {step}", font=font(25,True), fill=GOLD, anchor="lm")
    draw.text((190,59), title, font=font(27,True), fill=WHITE, anchor="lm")
    if note:
        draw.rounded_rectangle((42,642,1238,695), radius=12, fill=(255,255,255))
        draw.text((640,668), note, font=font(22,True), fill=RED, anchor="mm")

def cabinet(draw, alpha=1.0, desk=True, bed_panel=False):
    panel(draw,(460,160,515,580),WALNUT,"L")
    panel(draw,(920,160,975,580),WALNUT,"R")
    panel(draw,(460,125,975,180),WALNUT_L,"T")
    panel(draw,(515,190,920,270),GRAY,"C")
    panel(draw,(515,500,920,575),GRAY,"B")
    if bed_panel:
        panel(draw,(535,270,900,500),GRAY_L,"BED")
    if desk:
        panel(draw,(610,470,865,610),WALNUT,"D")
        panel(draw,(585,420,890,475),WALNUT_L,"TOP")

def scene(frame, scene_idx, t):
    img=Image.new("RGB",(W,H),(235,232,225))
    draw=ImageDraw.Draw(img,"RGBA")
    # subtle technical grid
    for x in range(0,W,40): draw.line((x,110,x,H),fill=(210,208,201,90),width=1)
    for y in range(110,H,40): draw.line((0,y,W,y),fill=(210,208,201,90),width=1)

    p=ease(min(1,t/0.72))
    if scene_idx==0:
        header(draw,"01","LAY OUT AND IDENTIFY ALL PARTS","Use a protected, level floor. Four adults required.")
        parts=[((130,185,235,560),WALNUT,"L"),((1045,185,1150,560),WALNUT,"R"),((420,135,860,195),WALNUT_L,"T"),((430,270,850,340),GRAY,"C"),((470,410,810,475),GRAY_L,"BED"),((505,520,775,580),WALNUT_L,"DESK")]
        for i,(b,c,l) in enumerate(parts):
            dy=(1-p)*(90 if i%2 else -90)
            panel(draw,(b[0],b[1]+dy,b[2],b[3]+dy),c,l)
        draw.text((640,232),"PARTS + HARDWARE",font=font(42,True),fill=INK,anchor="mm")
        for i,x in enumerate(range(430,850,70)):
            screw(draw,x,375); draw.text((x,400),chr(65+i),font=font(18,True),fill=MUTED,anchor="mm")

    elif scene_idx==1:
        header(draw,"02","BUILD THE MAIN CABINET","Leave fasteners slightly loose until the cabinet is square.")
        lx=lerp(100,460,p); rx=lerp(1130,920,p); ty=lerp(35,125,p); by=lerp(650,500,p)
        panel(draw,(lx,160,lx+55,580),WALNUT,"L")
        panel(draw,(rx,160,rx+55,580),WALNUT,"R")
        panel(draw,(460,ty,975,ty+55),WALNUT_L,"T")
        panel(draw,(515,by,920,by+75),GRAY,"B")
        arrow(draw,(280,365),(445,365)); arrow(draw,(1090,365),(990,365))

    elif scene_idx==2:
        header(draw,"03","INSTALL CROSS RAILS AND BACK SUPPORTS","Measure both diagonals before final tightening.")
        panel(draw,(460,160,515,580),WALNUT,"L"); panel(draw,(920,160,975,580),WALNUT,"R"); panel(draw,(460,125,975,180),WALNUT_L,"T"); panel(draw,(515,500,920,575),GRAY,"B")
        for i,y in enumerate((215,315,415)):
            x=lerp(90,515,p if t>i*.12 else 0)
            panel(draw,(x,y,x+405,y+52),GRAY_L,str(i+1))
            if p>.8:
                screw(draw,530,y+26); screw(draw,905,y+26)

    elif scene_idx==3:
        header(draw,"04","ASSEMBLE AND ATTACH THE FOLDING DESK","Keep fingers clear of the hinge line.")
        cabinet(draw,desk=False)
        dx=lerp(1060,610,p); dy=lerp(530,470,p)
        panel(draw,(dx,dy,dx+255,dy+140),WALNUT,"D")
        topy=lerp(650,420,p)
        panel(draw,(585,topy,890,topy+55),WALNUT_L,"TOP")
        if p>.75:
            draw.line((585,470,890,470),fill=INK,width=8)
            for x in range(605,880,38): screw(draw,x,470)

    elif scene_idx==4:
        header(draw,"05","ASSEMBLE THE BED FRAME AND SLATS","Build the frame flat on the floor.")
        # frame corners close inward
        x1=lerp(110,360,p); x2=lerp(1170,920,p); y1=lerp(170,250,p); y2=lerp(610,590,p)
        panel(draw,(x1,y1,x1+40,y2),WALNUT,"A")
        panel(draw,(x2-40,y1,x2,y2),WALNUT,"B")
        panel(draw,(x1,y1,x2,y1+42),WALNUT_L,"H")
        panel(draw,(x1,y2-42,x2,y2),WALNUT_L,"F")
        if p>.35:
            q=ease((p-.35)/.65)
            for i in range(8):
                y=lerp(690,310+i*31,q)
                draw.rounded_rectangle((x1+48,y,x2-48,y+14),radius=5,fill=(211,190,151),outline=INK,width=1)

    elif scene_idx==5:
        header(draw,"06","CONNECT THE BED FRAME AND GAS PISTONS","Helpers must hold both sides during this step.")
        cabinet(draw,desk=True,bed_panel=False)
        # rotating bed frame simplified
        angle=math.radians(lerp(68,8,p)); cx,cy=718,500; length=360
        ex=cx+math.cos(angle)*length; ey=cy+math.sin(angle)*length
        draw.line((cx,cy,ex,ey),fill=WALNUT_L,width=28)
        draw.line((cx+180,cy,ex+180,ey),fill=WALNUT_L,width=28)
        for k in range(7):
            u=k/6; x=cx+180*u; y=cy
            draw.line((x,y,x+math.cos(angle)*length,y+math.sin(angle)*length),fill=(206,185,148),width=9)
        # pistons
        if p>.55:
            q=ease((p-.55)/.45)
            for sx in (545,890):
                draw.line((sx,470,sx+lerp(-100,-20,q),lerp(600,390,q)),fill=INK,width=11)
                draw.ellipse((sx-7,463,sx+7,477),fill=GOLD)

    elif scene_idx==6:
        header(draw,"07","LEVEL AND ANCHOR THE CABINET TO THE WALL","Anchor only to solid concrete or structural wood studs.")
        # wall studs
        for x in (390,520,650,780,910): draw.rectangle((x,125,x+24,610),fill=(202,179,137),outline=MUTED,width=2)
        cabinet(draw,desk=False,bed_panel=True)
        # anchor bolts travel in
        for x in (485,950):
            yy=145
            bx=lerp(x-170,x,p)
            draw.line((bx,yy,bx+45,yy),fill=INK,width=9)
            draw.polygon([(bx+45,yy),(bx+28,yy-10),(bx+28,yy+10)],fill=GOLD)
        draw.line((430,610,1010,610),fill=INK,width=4)
        draw.text((1050,610),"LEVEL",font=font(22,True),fill=RED,anchor="lm")

    else:
        header(draw,"08","FINAL SAFETY CHECK AND OPERATION","Do not use the bed until every wall anchor is inspected.")
        # Show cabinet and animate bed from vertical to open
        cabinet(draw,desk=False,bed_panel=False)
        ang=math.radians(lerp(-88,-8,p)); cx,cy=718,500; length=330
        corners=[]
        for side in (0,170):
            sx=cx+side; sy=cy
            ex=sx+math.cos(ang)*length; ey=sy+math.sin(ang)*length
            draw.line((sx,sy,ex,ey),fill=WALNUT_L,width=30)
        for k in range(7):
            u=k/6; sx=cx+170*u; sy=cy
            draw.line((sx,sy,sx+math.cos(ang)*length,sy+math.sin(ang)*length),fill=(207,188,151),width=9)
        if p>.85:
            draw.rounded_rectangle((1010,535,1205,600),radius=14,fill=(44,132,84))
            draw.text((1107,568),"READY TO USE",font=font(24,True),fill=WHITE,anchor="mm")

    draw.text((34,710),"MERAX MURPHY BED · ANIMATED ASSEMBLY GUIDE",font=font(15,True),fill=MUTED,anchor="ls")
    return img

def main():
    out=ROOT/"assembly-animation-silent.mp4"
    cmd=["ffmpeg","-y","-loglevel","error","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-","-an","-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p","-movflags","+faststart",str(out)]
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
    try:
        for s in range(SCENES):
            for f in range(DUR*FPS):
                t=f/(DUR*FPS-1)
                proc.stdin.write(scene(f,s,t).tobytes())
    finally:
        proc.stdin.close(); code=proc.wait()
    if code: raise SystemExit(code)

if __name__=="__main__": main()

