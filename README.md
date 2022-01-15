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
 - frontends
   - move route logic to frontend module
   - all pure functions
   - scrub errors before returning to route
 - Attach Rule
   - To add metadata
   - Re-purpose update + restrict it
 - Percentage Split Rule
   - \_type: "Percent"
   - where: Clause
   - field is always amount
   - by: array of Percent ({ account, percent })
   - must validate account ids + percent == 100
 - Numeric Split Rule:
   - \_type: "Percent"
   - where: Clause
   - field is always amount
   - by: array of Value ({ account, value })
   - remainder: account
   - if amount < total, amounts are split in order
   - must validate account ids
 - `materialize/:accountId`
   - Transactions come out tagged with sub accounts and with uncategorized
   - Still need conflicts if two rules match modifying the same field
 - Split-split conflicts + attach-attach conflicts
   - Generalize update conflicts

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
