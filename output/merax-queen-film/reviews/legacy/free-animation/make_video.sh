#!/bin/zsh
set -euo pipefail
BASE="${0:A:h}"
PYTHON="/Users/quyth/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3"

"$PYTHON" "$BASE/animate.py"
say -v Samantha -r 215 -f "$BASE/narration.txt" -o "$BASE/narration.aiff"

ffmpeg -y -loglevel error \
  -i "$BASE/assembly-animation-silent.mp4" -i "$BASE/narration.aiff" \
  -filter_complex "[1:a]apad=pad_dur=48,volume=1.08,afade=t=in:st=0:d=0.3,afade=t=out:st=46.5:d=1.2[a]" \
  -map 0:v -map "[a]" -t 48 -c:v copy -c:a aac -b:a 192k -movflags +faststart \
  "$BASE/merax-animated-assembly-guide-en.mp4"

ffmpeg -y -loglevel error -ss 00:00:27 -i "$BASE/merax-animated-assembly-guide-en.mp4" -frames:v 1 "$BASE/preview.jpg"
