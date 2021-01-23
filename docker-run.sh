#!/bin/sh

#-e TINYPIN_SLOW=2000
docker run -d --name tinypin -p 3001:3000 -v "$(pwd)/data:/data" --restart=unless-stopped tinypin
