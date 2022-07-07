#!/bin/bash

TOKEN=$1

get-graphql-schema http://localhost:8080/external/graphql --header="Authorization=${TOKEN}" > schema/external.graphql
get-graphql-schema http://localhost:8080/graphql --header="Authorization=${TOKEN}" > schema/main.graphql
get-graphql-schema http://localhost:8080/admin/graphql --header="Authorization=${TOKEN}" > schema/admin.graphql

get-graphql-schema http://localhost:8080/external/graphql --header="Authorization=${TOKEN}" --json > schema/external.json
get-graphql-schema http://localhost:8080/graphql --header="Authorization=${TOKEN}" --json > schema/main.json
get-graphql-schema http://localhost:8080/admin/graphql --header="Authorization=${TOKEN}" --json > schema/admin.json