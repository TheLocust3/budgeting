# budgeting

## setup
`yarn install`  
`yarn setup`  
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
 - Business logic layer
   - sources + puller orchestration
   - manage business logic
 - distinguish between channel errors and user facing errors
 - Global service configuration
 - Authenticate requests between components

## future
 - split database in separate instances
 - move handling of write transaction requests away from engine
 - have pullers pull jobs from queue fed by some cron job
