#! /bin/bash

docker run -u node -p 3002:8080 -d common:latest node /usr/src/app/scheduler/dist/index.js