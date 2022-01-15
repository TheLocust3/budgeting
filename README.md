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
 - Rules are only splits between sub accounts
   - Percentage splits only to start
   - Splits only operate on amount
   - On create, validate accounts are real + percents add up to 100%
 - Attach rule
   - To add metadata
 - `materialize/:accountId`
   - Transactions come out tagged with sub accounts and with uncategorized
   - Still need conflicts if two rules match modifying the same field
 - Fully model splits
   - Percentage (list of account + percent), numeric (list of account + value, remainder pointing to account)
 - expect unordered lists in tests
 - request logging
 - Clean up TODO: JK's

### future
 - Don't build plan/stages for every transaction
 - frontends
   - move route logic to frontend module
   - all pure functions
   - scrub errors before returning to route
 - run linter
 - Aggregations

### miscellaneous
 - unit tests against frontends/components
 - no need for camelize if columns are renamed in select
 - abstract common db queries/operations
