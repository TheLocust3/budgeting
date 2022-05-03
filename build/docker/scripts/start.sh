#! /bin/bash

./build/docker/scripts/stop.sh 2> /dev/null

./build/docker/scripts/setup_network.sh

./build/docker/scripts/start_db.sh

postfix=$(openssl rand -hex 4)

docker run \
  -p 3000:3000 \
  --name "engine-$postfix" \
  --hostname engine \
  --network budgeting \
  --env PGDATABASE=budget \
  --env PGHOST=postgres \
  --env PGPORT=5432 \
  --env PGUSER=jakekinsella \
  --env PGPASSWORD=foobar \
  --env-file secrets.env \
  -d common:latest \
  node /home/node/app/dist/engine/index.js

docker run \
  -p 3001:3001 \
  --name "logic-$postfix" \
  --hostname logic \
  --network budgeting \
  --env PGDATABASE=budget \
  --env PGHOST=postgres \
  --env PGPORT=5432 \
  --env PGUSER=jakekinsella \
  --env PGPASSWORD=foobar \
  --env-file secrets.env \
  -d common:latest \
  node /home/node/app/dist/logic/index.js

docker run \
  -p 3002:3002 \
  --name "scheduler-$postfix" \
  --hostname scheduler \
  --network budgeting \
  --env PGDATABASE=budget \
  --env PGHOST=postgres \
  --env PGPORT=5432 \
  --env PGUSER=jakekinsella \
  --env PGPASSWORD=foobar \
  --env-file secrets.env \
  -d common:latest \
  node /home/node/app/dist/scheduler/index.js
