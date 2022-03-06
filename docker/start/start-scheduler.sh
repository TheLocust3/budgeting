#! /bin/bash

docker run -p 8080:3002 -d common:latest node /usr/src/app/scheduler/dist/index.js