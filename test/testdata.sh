#!/usr/bin/env bash

command=$1

remote="s3://mapbox/somewhere"
dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

if [ "command" == "" ];
  then command=down
fi

if [ "command" == "down" ]; then
  mkdir -p "$dir/data"
  aws s3 sync "$remote" "$dir/data"
fi

if [ "command" == "up" ]; then
  aws s3 sync "$dir/data" "$remote"
fi
