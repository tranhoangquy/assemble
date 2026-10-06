#!/bin/zsh
set -euo pipefail

BASE="${0:A:h}"
PYTHON="/Users/quyth/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3"

"$PYTHON" "$BASE/render_scenes.py"
say -v Linh -r 200 -f "$BASE/narration.txt" -o "$BASE/narration.aiff"

ffmpeg -y -loglevel error \
  -framerate 1/5 -start_number 1 -i "$BASE/scenes/scene-%02d.jpg" \
  -vf "zoompan=z='min(zoom+0.00018,1.025)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=125:s=1920x1080:fps=25,fade=t=in:st=0:d=0.5,fade=t=out:st=99:d=1" \
  -t 100 -r 25 -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -movflags +faststart "$BASE/assembly-silent.mp4"

ffmpeg -y -loglevel error \
  -i "$BASE/assembly-silent.mp4" -i "$BASE/narration.aiff" \
  -filter_complex "[1:a]apad=pad_dur=100,volume=1.12,afade=t=in:st=0:d=0.4,afade=t=out:st=98:d=1.5[a]" \
  -map 0:v -map "[a]" -t 100 -c:v copy -c:a aac -b:a 192k -movflags +faststart \
  "$BASE/merax-murphy-bed-assembly-guide.mp4"

ffmpeg -y -loglevel error -ss 00:00:45 -i "$BASE/merax-murphy-bed-assembly-guide.mp4" -frames:v 1 "$BASE/preview.jpg"
