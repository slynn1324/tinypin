#!/bin/sh

#-e TINYPIN_SLOW=2000
docker run --name tinypin -p 3001:3000 -v "$(pwd)/data:/data" tinypin
