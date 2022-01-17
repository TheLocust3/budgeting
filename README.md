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
 - Split-split conflicts + attach-attach conflicts
   - Generalize update conflicts
 - Validate rules
   - Only includes real subaccounts
   - Percent adds up 100

### future
 - expect unordered lists in tests
 - request logging
 - Clean up TODO: JK's
 - Don't build plan/stages for every transaction
 - run linter
 - Aggregations

### miscellaneous
 - unit tests against frontends/components
 - no need for camelize if columns are renamed in select
 - abstract common db queries/operations
