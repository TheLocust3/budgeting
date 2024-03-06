#! /bin/bash

export PGDATABASE=budget
export PGHOST=localhost
export PGPORT=5432
export PGUSER=jakekinsella
export PGPASSWORD=foobar

# sandbox credentials
export ENVIRONMENT=test

jest --forceExit --verbose $1
