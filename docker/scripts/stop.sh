#! /bin/bash

docker ps | grep logic | awk '{print $1}' | xargs docker kill
docker ps | grep scheduler | awk '{print $1}' | xargs docker kill
docker ps | grep engine | awk '{print $1}' | xargs docker kill
