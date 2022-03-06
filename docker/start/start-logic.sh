#! /bin/bash

docker run -u node -p 3001:8080 -d common:latest node /usr/src/app/logic/dist/index.js