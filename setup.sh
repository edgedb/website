#!/bin/bash

set -e

export PATH=$PATH:/usr/local/go/bin

git submodule update

PYTHON=python3.8
if ! command -v $PYTHON &> /dev/null
then
  PYTHON=python3.9
fi
if ! command -v $PYTHON &> /dev/null
then
  PYTHON=python3.10
fi
if ! command -v $PYTHON &> /dev/null
then
  echo -e "Python 3.8, 3.9, or 3.10 is required"
  exit 1
fi

if [ ! -d ./.venv ]
then
  $PYTHON -m venv ./.venv
  echo -e ">>> Virtual env created in ./.venv"
fi

echo -e "\n>>> Upgrading pip..."
./.venv/bin/pip install --upgrade pip

echo -e "\n>>> Installing dependencies..."
./.venv/bin/pip install -e .

echo -e "\n>>> Installing Go dependencies..."
go install -v golang.org/x/tools/cmd/godoc@v0.1.11

if [ ! -d ./.repos/edgedb ]
then
  echo -e "\n>>> Cloning edgedb/edgedb"
  git clone https://github.com/edgedb/edgedb.git ./.repos/edgedb \
    --depth=1 --no-single-branch
else
  echo -e "\n>>> Updating edgedb/edgedb"
  cd .repos/edgedb
  git checkout master && git pull
  cd ../../
fi

if [ ! -d ./.repos/edgedb-python ]
then
  echo -e "\n>>> Cloning edgedb/edgedb-python"
  git clone https://github.com/edgedb/edgedb-python.git ./.repos/edgedb-python \
    --depth=1 --no-single-branch
  cd ./.repos/edgedb-python && git fetch --tags --depth=1 && cd ../../
else
  echo -e "\n>>> Updating edgedb/edgedb-python"
  cd .repos/edgedb-python
  git checkout master && git pull
  cd ../../
fi

if [ ! -d ./.repos/edgedb-js ]
then
  echo -e "\n>>> Cloning edgedb/edgedb-js"
  git clone https://github.com/edgedb/edgedb-js.git ./.repos/edgedb-js \
    --depth=1 --no-single-branch
  cd ./.repos/edgedb-js && git fetch --tags --depth=1 && cd ../../
else
  echo -e "\n>>> Updating edgedb/edgedb-js"
  cd .repos/edgedb-js
  git checkout master && git pull
  cd ../../
fi

if [ ! -d ./.repos/edgedb-net ]
then
  echo -e "\n>>> Cloning edgedb/edgedb-net"
  git clone https://github.com/edgedb/edgedb-net.git ./.repos/edgedb-net \
    --depth=1 --no-single-branch
  cd ./.repos/edgedb-net && git fetch --tags --depth=1 && cd ../../
else
  echo -e "\n>>> Updating edgedb/edgedb-net"
  cd .repos/edgedb-net
  git checkout dev && git pull
  cd ../../
fi

if [ ! -d ./.repos/edgedb-go ]
then
  echo -e "\n>>> Cloning edgedb/edgedb-go"
  git clone https://github.com/edgedb/edgedb-go.git ./.repos/edgedb-go \
    --depth=1
else
  echo -e "\n>>> Updating edgedb/edgedb-go"
  cd .repos/edgedb-go
  git checkout master && git pull
  cd ../../
fi

if [ ! -d ./.repos/edgedb-dart ]
then
  echo -e "\n>>> Cloning edgedb/edgedb-dart"
  git clone https://github.com/edgedb/edgedb-dart.git ./.repos/edgedb-dart \
    --depth=1
else
  echo -e "\n>>> Updating edgedb/edgedb-dart"
  cd .repos/edgedb-dart
  git checkout main && git pull
  cd ../../
fi

DART=dart
if [ -d ./dart-sdk ]
then
  DART=../../dart-sdk/bin/dart
fi

echo -e "\n>>> Installing dart deps"
cd .repos/edgedb-dart
$DART pub get
cd ../../


if [ ! -d ./.repos/easy-edgedb ]
then
  echo -e "\n>>> Cloning edgedb/easy-edgedb"
  git clone https://github.com/edgedb/easy-edgedb.git ./.repos/easy-edgedb \
    --depth=1
else
  echo -e "\n>>> Updating edgedb/easy-edgedb"
  cd .repos/easy-edgedb
  git checkout master && git pull
  cd ../../
fi

if [ ! -e ./build.config.ts ]
then
  echo -e "\n>>> Creating build.config.ts"
  echo -e "import {BuildConfig} from './dataBuild/interfaces';

const config: BuildConfig = {
  repoPaths: {
    edgedb: './.repos/edgedb',
    js: './.repos/edgedb-js',
    python: './.repos/edgedb-python',
    go: './.repos/edgedb-go',
    dart: './.repos/edgedb-dart',
    easyedb: './.repos/easy-edgedb',
    dotnet: './.repos/edgedb-net',
  },
  sphinxPath: './.venv/bin/sphinx-build',
};

export default config;
" > ./build.config.ts
else
  echo -e "\n>>> build.config.ts detected, keeping it as is."
fi

if [ ! -e ./docVersions.config.ts ]
then
  echo -e "\n>>> Creating docVersions.config.ts"
  echo -e "import {DocVersionsConfig} from './dataBuild/interfaces';

const config: DocVersionsConfig = {
  versions: [
    {id: 'v1.0beta1', label: '1.0 beta 1', branch: 'master', tag: 'latest'},
  ],
  drivers: {
    js: {id: 'v0.11.0', label: '0.11.0', branch: 'v0.11.0'},
    python: {id: 'v0.11.0', label: '0.11.0', branch: 'v0.11.0'},
  },
};

export default config;
" > ./docVersions.config.ts
else
  echo -e "\n>>> docVersions.config.ts detected, keeping it as is."
fi

if [ ! -z $DISALLOW_ROBOTS ]
then
  echo -e "\n>>> Creating robots.txt"
  echo -e "User-agent: *
Disallow: /" > ./public/robots.txt
else
  echo -e "\n>>> Creating robots.txt"
  echo -e "User-agent: *
Disallow:" > ./public/robots.txt
fi
