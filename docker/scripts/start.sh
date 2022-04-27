#! /bin/bash

./docker/scripts/stop.sh 2> /dev/null

./docker/scripts/setup_network.sh

./docker/scripts/start_db.sh

postfix=$(openssl rand -hex 4)

docker run \
  -p 3000:8080 \
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
  node /home/node/app/engine/dist/index.js

docker run \
  -p 3001:8080 \
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
  node /home/node/app/logic/dist/index.js

docker run \
  -p 3002:8080 \
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
  node /home/node/app/scheduler/dist/index.js
