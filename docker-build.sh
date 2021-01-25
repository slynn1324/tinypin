#!/bin/sh

docker build \
    -t slynn1324/tinypin \
    --build-arg VERSION=$(git rev-parse --verify --short HEAD) \
    .

