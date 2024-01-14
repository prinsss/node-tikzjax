#!/bin/bash

set -x
mkdir -p tex

# Download neccessary files for TeX engine.
if [ ! -d "./tikzjax" ]; then
  git clone https://github.com/artisticat1/tikzjax.git
fi

cd ./tikzjax
git switch output-single-file
git pull
cp ./tex.wasm.gz ./core.dump.gz ../tex

mkdir -p ./dist
cp -r ./tex_files ./dist
cd ./dist/tex_files

# Make a reproducible tarball.
find . -name '*.gz' -type f -print -exec gzip -d {} \;
TZ=UTC0 tar \
  --sort=name \
  --mtime='1970-01-01 00:00:00' \
  --owner=0 \
  --group=0 \
  --numeric-owner \
  -czvf ../../../tex/tex_files.tar.gz .

cd ../../
rm -rf ./dist

mkdir -p css/bakoma
curl -L -O https://mirrors.ctan.org/fonts/cm/ps-type1/bakoma.zip
unzip -d css/bakoma -j bakoma.zip 'bakoma/LICENCE'
unzip -d css/bakoma/ttf -j bakoma.zip 'bakoma/ttf/*'
rm bakoma.zip
