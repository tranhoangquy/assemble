#!/bin/zsh
set -euo pipefail

BASE="${0:A:h}"
SOURCE="${BASE:h:h}/tmp/murphy-bed-folding-desk-assembly.mp4"

say -v Samantha -r 170 -f "$BASE/narration-en.txt" -o "$BASE/narration-en.aiff"

ffmpeg -y -loglevel error \
  -i "$SOURCE" -i "$BASE/narration-en.aiff" \
  -filter_complex "[1:a]apad=pad_dur=84,volume=1.08,afade=t=in:st=0:d=0.35,afade=t=out:st=82:d=1.2[a]" \
  -map 0:v -map "[a]" -t 84 -c:v copy -c:a aac -b:a 192k -movflags +faststart \
  "$BASE/merax-murphy-bed-threejs-assembly-en.mp4"

ffmpeg -y -loglevel error -ss 00:00:56 -i "$BASE/merax-murphy-bed-threejs-assembly-en.mp4" \
  -frames:v 1 "$BASE/preview.jpg"
