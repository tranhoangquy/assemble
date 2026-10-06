#!/bin/zsh
set -euo pipefail

BASE="${0:A:h}"
ASSETS="$BASE/assets"
FONT="/System/Library/Fonts/Supplemental/Arial Bold.ttf"
export CLANG_MODULE_CACHE_PATH="$BASE/.module-cache"
mkdir -p "$CLANG_MODULE_CACHE_PATH"

swift "$BASE/render_scenes.swift" "$BASE"

say -v Linh -r 150 -o "$BASE/voice.aiff" \
  "Một căn phòng, hai công năng. Ban ngày là bàn làm việc tiện dụng. Chỉ vài giây, hệ thống thủy lực chuyển thành giường full-size. Gọn gàng, hiện đại, tối ưu từng mét vuông. Merax Murphy Bed."

ffmpeg -y -loglevel error \
  -loop 1 -t 3.4 -i "$BASE/scene-01.png" \
  -loop 1 -t 3.4 -i "$BASE/scene-02.png" \
  -loop 1 -t 3.4 -i "$BASE/scene-03.png" \
  -loop 1 -t 3.4 -i "$BASE/scene-04.png" \
  -loop 1 -t 3.4 -i "$BASE/scene-05.png" \
  -filter_complex "
    [0:v]zoompan=z='min(zoom+0.00045,1.045)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=102:s=1920x1080:fps=30,setsar=1[v0];
    [1:v]zoompan=z='min(zoom+0.00055,1.055)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=102:s=1920x1080:fps=30,setsar=1[v1];
    [2:v]zoompan=z='if(lte(zoom,1.001),1.055,max(1.0,zoom-0.00055))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=102:s=1920x1080:fps=30,setsar=1[v2];
    [3:v]zoompan=z='min(zoom+0.0005,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=102:s=1920x1080:fps=30,setsar=1[v3];
    [4:v]zoompan=z='if(lte(zoom,1.001),1.05,max(1.0,zoom-0.0005))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=102:s=1920x1080:fps=30,setsar=1[v4];
    [v0][v1]xfade=transition=fade:duration=0.4:offset=3.0[x1];
    [x1][v2]xfade=transition=wipeleft:duration=0.4:offset=6.0[x2];
    [x2][v3]xfade=transition=fade:duration=0.4:offset=9.0[x3];
    [x3][v4]xfade=transition=wipeup:duration=0.4:offset=12.0[vout]
  " \
  -map "[vout]" -t 15 -r 30 -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -movflags +faststart "$BASE/merax-promo-silent.mp4"

ffmpeg -y -loglevel error \
  -i "$BASE/merax-promo-silent.mp4" -i "$BASE/voice.aiff" \
  -filter_complex "[1:a]apad=pad_dur=15,volume=1.15,afade=t=in:st=0:d=0.25,afade=t=out:st=14:d=0.8[a]" \
  -map 0:v -map "[a]" -t 15 -c:v copy -c:a aac -b:a 192k -movflags +faststart \
  "$BASE/merax-murphy-bed-promo-15s.mp4"

ffmpeg -y -loglevel error -ss 00:00:07.5 -i "$BASE/merax-murphy-bed-promo-15s.mp4" -frames:v 1 "$BASE/preview.jpg"
