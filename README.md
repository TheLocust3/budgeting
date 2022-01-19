# engine

## setup
`yarn install`  
`initdb data.db`  
`pg_ctl -D data.db start`  
`createdb budget`  

## running

Environment variables:
```
export PGUSER=jakekinsella
export PGHOST=localhost
export PGPASSWORD=
export PGDATABASE=budget
export PGPORT=5432
```

Migrate database:
`yarn migrate`

Start:
`yarn start`

## test
Make sure the server is running (for system tests):
`yarn start`

Run the test suite:
`yarn test`

## todo

### next
 - expect unordered lists in tests
 - Don't build plan/stages for every transaction
 - request logging
 - Clean up TODO: JK's
 - run linter

### future
 - authenticate requests
 - basic rule pushdowns
   - all include rules are up for grabs
 - Aggregations

### miscellaneous
 - unit tests against frontends/components
 - no need for camelize if columns are renamed in select
 - abstract common db queries/operations
