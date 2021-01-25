FROM node:alpine3.12

COPY . /tinypin

WORKDIR /tinypin

RUN apk add build-base python3 && npm install --verbose && apk del build-base python3

RUN mkdir /data && npm install

ENTRYPOINT ["sh", "-c" , "node server.js -i /data/images -d /data/tinypin.db"]
