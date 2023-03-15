#!/bin/bash

curl --output dart.zip https://storage.googleapis.com/dart-archive/channels/stable/release/2.17.7/sdk/dartsdk-linux-x64-release.zip

unzip -q dart.zip

rm dart.zip
