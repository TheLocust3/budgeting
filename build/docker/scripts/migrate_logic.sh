#! /bin/bash

./build/docker/scripts/setup_network.sh

./build/docker/scripts/start_db.sh

postfix=$(openssl rand -hex 4)

docker run \
  --name "migrate-logic-$postfix" \
  --network budgeting \
  --env PGDATABASE=budget \
  --env PGHOST=postgres \
  --env PGPORT=5432 \
  --env PGUSER=jakekinsella \
  --env PGPASSWORD=foobar \
  --env-file secrets.env \
  -d common:latest \
  node /home/node/app/dist/logic/migrate.js

echo "Waiting for migration to complete..."
sleep 5