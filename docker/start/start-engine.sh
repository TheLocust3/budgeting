#! /bin/bash

docker run -p 8080:3000 -d common:latest node /usr/src/app/engine/dist/index.js
