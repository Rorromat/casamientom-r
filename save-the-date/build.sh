#!/bin/sh
# One command rebuilds the film: events → score → mix → picture → master (−14 LUFS) → poster → reading check.
# Needs the Lemo-Opuscar library (LIB) with its core packages and the freepats + karoryfer sample packs,
# and ffmpeg 7+ on PATH (6.x makes mux.sh reject the audio).
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
node core/render/events.mjs "$HERE"
"$LIB/.venv/bin/python" "$HERE/music/compose.py"
"$LIB/.venv/bin/python" "$HERE/mix.py"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/save-the-date.mp4" 24 1
ffmpeg -v error -y -ss 36 -i "$HERE/save-the-date.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
node core/render/readcheck.mjs "$HERE"
