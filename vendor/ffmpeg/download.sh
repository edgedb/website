#!/bin/bash

set -e -x

find . -name 'ffmpeg*' | xargs rm

curl -LO https://ffmpeg.martin-riedl.de/redirect/latest/macos/amd64/release/ffmpeg.zip
mv ffmpeg.zip ffmpeg-mac-amd64.zip

curl -LO https://ffmpeg.martin-riedl.de/redirect/latest/macos/arm64/release/ffmpeg.zip
mv ffmpeg.zip ffmpeg-mac-arm64.zip

curl -LO https://ffmpeg.martin-riedl.de/redirect/latest/linux/amd64/release/ffmpeg.zip
mv ffmpeg.zip ffmpeg-linux-amd64.zip

curl -LO https://ffmpeg.martin-riedl.de/redirect/latest/linux/arm64/release/ffmpeg.zip
mv ffmpeg.zip ffmpeg-linux-arm64.zip
