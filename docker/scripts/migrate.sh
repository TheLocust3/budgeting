#! /bin/bash

./docker/scripts/setup_network.sh

./docker/scripts/start_db.sh

postfix=$(openssl rand -hex 4)

docker run \
  --name "migrate-$postfix" \
  --network budgeting \
  --env PGDATABASE=budget \
  --env PGHOST=postgres \
  --env PGPORT=5432 \
  --env PGUSER=jakekinsella \
  --env PGPASSWORD=foobar \
  --env-file secrets.env \
  -d common:latest \
  node /home/node/app/storage/dist/db/migrate.js

echo "Waiting for migration to complete..."
sleep 5