#!/bin/sh

nodeVersion=$(node -e "console.log(process.version.split('.')[0].slice(1))")
targetNodeVersion="12"

if [ "$nodeVersion" -lt "$targetNodeVersion" ]; then
  echo "Node.js version must be >= $targetNodeVersion"
  exit 1
fi
