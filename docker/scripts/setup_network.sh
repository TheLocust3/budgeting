#! /bin/bash

if docker network ls  | grep -q budgeting; then
  exit 0
fi

docker network create budgeting