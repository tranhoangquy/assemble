#!/bin/zsh
set -euo pipefail

BASE="${0:A:h}"
SOURCE="${BASE:h:h}/tmp/murphy-bed-reconstructed-final-silent.mp4"
OUTPUT="$BASE/merax-murphy-bed-reconstructed-threejs-en.mp4"

say -v Samantha -r 180 -f "$BASE/narration-en.txt" -o "$BASE/narration-en.aiff"

ffmpeg -y -loglevel error \
  -i "$SOURCE" -i "$BASE/narration-en.aiff" \
  -filter_complex "[1:a]apad=pad_dur=193,volume=1.06,afade=t=in:st=0:d=0.35,afade=t=out:st=189:d=1.5[a]" \
  -map 0:v -map "[a]" -t 193 -c:v copy -c:a aac -b:a 192k -movflags +faststart \
  "$OUTPUT"

ffmpeg -y -loglevel error -ss 00:02:46 -i "$OUTPUT" -frames:v 1 "$BASE/preview-open.jpg"
