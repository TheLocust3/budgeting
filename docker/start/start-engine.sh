#! /bin/bash

docker run -u node -p 3000:8080 -d common:latest node /usr/src/app/engine/dist/index.js
