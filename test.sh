#! /bin/bash

export PGDATABASE=budget
export PGHOST=localhost
export PGPORT=5432
export PGUSER=jakekinsella
export PGPASSWORD=foobar

# sandbox credentials
export PLAID_CLIENT_ID=***REMOVED***
export PLAID_SECRET=***REMOVED***
export ENVIRONMENT=test

jest --forceExit --verbose user/transaction.test.ts
