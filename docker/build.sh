#! /bin/bash

docker build . -f engine/Dockerfile -t engine:latest
docker build . -f logic/Dockerfile -t logic:latest
docker build . -f scheduler/Dockerfile -t scheduler:latest