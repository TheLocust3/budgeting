#! /bin/bash

docker run -p 8080:3001 -d common:latest node /usr/src/app/logic/dist/index.js