#! /bin/bash

docker network create budgeting

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

docker run \
  -p 3000:8080 \
  --name engine \
  --network budgeting \
  --env PGDATABASE=budget \
  --env PGHOST=postgres \
  --env PGPORT=5432 \
  --env PGUSER=jakekinsella \
  --env PGPASSWORD=foobar \
  --env-file secrets.env \
  -d engine:latest

docker run \
  -p 3001:8080 \
  --name logic \
  --network budgeting \
  --env PGDATABASE=budget \
  --env PGHOST=postgres \
  --env PGPORT=5432 \
  --env PGUSER=jakekinsella \
  --env PGPASSWORD=foobar \
  --env-file secrets.env \
  -d logic:latest

docker run \
  -p 3002:8080 \
  --name scheduler \
  --network budgeting \
  --env PGDATABASE=budget \
  --env PGHOST=postgres \
  --env PGPORT=5432 \
  --env PGUSER=jakekinsella \
  --env PGPASSWORD=foobar \
  --env-file secrets.env \
  -d scheduler:latest
