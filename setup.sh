#!/bin/bash

set -e

export PATH=$PATH:/usr/local/go/bin

git submodule update

PYTHON=python3.11
if ! command -v $PYTHON &> /dev/null
then
  PYTHON=python3.10
fi
if ! command -v $PYTHON &> /dev/null
then
  PYTHON=python3.9
fi
if ! command -v $PYTHON &> /dev/null
then
  PYTHON=python3.8
fi
if ! command -v $PYTHON &> /dev/null
then
  echo -e "Python 3.8, 3.9, 3.10, or 3.11 is required"
  exit 1
fi

if [ ! -d ./.venv ]
then
  echo -e ">>> Using $PYTHON to create a new venv"
  $PYTHON -m venv ./.venv
  echo -e ">>> Virtual env created in ./.venv"
fi

echo -e "\n>>> Upgrading pip..."
./.venv/bin/pip install --upgrade pip

echo -e "\n>>> Installing dependencies..."
./.venv/bin/pip install -e .

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

if [ "$VERCEL_ENV" ] && [ "$PYTHON" = "python3.9" ] ; then
  echo -e "\n!!! This script is running inside the old Vercel build environment. !!!"
  echo -e "\n>>> Downgrading urllib3 to 1.26.15 to unbreak sphinx"
  # XXX This is a horrible hack to unbreak sphinx, which depends on requests, which
  # depends on urllib3. urllib refuses to import if the environment contains
  # an outrageously ancient version of OpenSSL<1.1.1, which, sadly, is what
  # Vercel build environment currently has.  Given that our documentation pipeline
  # does not download anything from the Internet this should be a relatively
  # safe downgrade.
  ./.venv/bin/pip install urllib3==1.26.15
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

if [ ! -d ./.repos/edgedb-java ]
then
  echo -e "\n>>> Cloning edgedb/edgedb-java"
  git clone https://github.com/edgedb/edgedb-java.git ./.repos/edgedb-java \
    --depth=1 --no-single-branch
  cd ./.repos/edgedb-java && git fetch --tags --depth=1 && cd ../../
else
  echo -e "\n>>> Updating edgedb/edgedb-java"
  cd .repos/edgedb-java
  git checkout master && git pull
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

if [ ! -d ./.repos/edgedb-elixir ]
then
  echo -e "\n>>> Cloning edgedb/edgedb-elixir"
  git clone https://github.com/edgedb/edgedb-elixir.git ./.repos/edgedb-elixir \
    --depth=1
else
  echo -e "\n>>> Updating edgedb/edgedb-elixir"
  cd .repos/edgedb-elixir
  git checkout master && git pull
  cd ../../
fi

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

if [ "$GITHUB_EDGEDB_CI_ACCESS_TOKEN_TEMP" == "" ]
then
  echo "\nSkipping fetching of edgedb/legal repo, no GITHUB_EDGEDB_CI_ACCESS_TOKEN set"
else
  if [ ! -d ./site/legal ]
  then
    echo -e "\n>>> Cloning edgedb/legal"
    git clone https://$GITHUB_EDGEDB_CI_ACCESS_TOKEN_TEMP@github.com/edgedb/legal.git ./site/legal \
      --depth=1
  else
    echo -e "\n>>> Updating edgedb/legal"
    cd ./site/legal
    git checkout main && git pull
    cd ../../
  fi
fi

if [ ! -e ./build.config.ts ]
then
  echo -e "\n>>> Creating build.config.ts"
  echo -e "import {BuildConfig} from './dataBuild/interfaces';

const config: BuildConfig = {
  repoPaths: {
    edgedb: '../.repos/edgedb',
    js: '../.repos/edgedb-js',
    python: '../.repos/edgedb-python',
    go: '../.repos/edgedb-go',
    dart: '../.repos/edgedb-dart',
    easyedb: '../.repos/easy-edgedb',
    dotnet: '../.repos/edgedb-net',
    java: '../.repos/edgedb-java',
    elixir: '../.repos/edgedb-elixir',
  },
  sphinxPath: '../.venv/bin/sphinx-build',
};

export default config;
" > ./build.config.ts
else
  echo -e "\n>>> build.config.ts detected, keeping it as is."
fi

if [ ! -z $DISALLOW_ROBOTS ]
then
  echo -e "\n>>> Creating robots.txt"
  echo -e "User-agent: *
Disallow: /" > ./site/public/robots.txt
else
  echo -e "\n>>> Creating robots.txt"
  echo -e "User-agent: *
Disallow:" > ./site/public/robots.txt
fi
