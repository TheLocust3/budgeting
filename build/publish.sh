#! /bin/bash

export IMAGE="arm64v8/node:16"
export TAG="common-arm:latest"
./build/docker/scripts/build.sh

aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
docker tag $(docker images | grep common-arg | head -n1 | awk '{print $3}') $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/common:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/common:latest
