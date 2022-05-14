#! /bin/bash

mkdir -p tmp/build/docker
envsubst < build/docker/Dockerfile > tmp/build/docker/Dockerfile

docker image build . -f tmp/build/docker/Dockerfile -t $TAG