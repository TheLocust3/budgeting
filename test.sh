#! /bin/bash

export PGDATABASE=budget
export PGHOST=localhost
export PGPORT=5432
export PGUSER=jakekinsella
export PGPASSWORD=foobar

jest --forceExit --verbose "rule.test.ts"
