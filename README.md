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

### next
 - Scheduler
   - Setup core scheduler loop
   - Spin off puller subprocesses
 - Business logic layer
   - sources + puller orchestration
   - manage business logic

### miscellaneous
 - when a user is deleted, all associated resources should be cleaned up
 - expect unordered lists in tests
 - Don't build plan/stages for every transaction
 - validate email
   - both formatting + send email to user
 - pull jwt secret fron environment
 - JWT expiry
 - admin user to access `/user` + other global routes
 - distinguish between channel errors and user facing errors

### future
 - Global service configuration
 - Authenticate requests between components
 - basic rule pushdowns
   - all include rules are up for grabs
 - Aggregations
 - split database in separate instances
 - move handling of write transaction requests away from engine
 - have pullers pull jobs from queue fed by some cron job
