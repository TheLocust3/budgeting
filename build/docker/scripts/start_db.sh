#! /bin/bash

./build/docker/scripts/setup_network.sh

state=$(docker inspect postgres | jq '.[] | .State | .Status')
if [[ $state == "\"running\"" ]]; then
  exit 0
fi

docker rm postgres

docker run \
  -p 5432:5432 \
  --name postgres \
  --network budgeting \
  --env POSTGRES_DB=budget \
  --env POSTGRES_USER=jakekinsella \
  --env POSTGRES_PASSWORD=foobar \
  --env PGDATA=data.db \
  -d postgres:13.4 \
  postgres

echo "Waiting for postgres to start..."
sleep 30
