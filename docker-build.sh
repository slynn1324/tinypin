#!/bin/sh

VERSION=$(git rev-parse --verify --short HEAD) 

docker build \
    -t slynn1324/tinypin \
    --build-arg VERSION=$VERSION \
    .

