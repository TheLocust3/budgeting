# budgeting

## setup
`yarn install`  
`yarn setup`  
`yarn build`  

### initialize the database
`initdb data.db`  
`pg_ctl -D data.db start`  
`createdb budget`  

### generate certs
`mkdir certs`

Create a self-signed cert, placing the resultant files in the `certs/` directory as:
```
cert.crt
cert.key
```

## running

Environment variables:
```
export PGUSER=jakekinsella
export PGHOST=localhost
export PGPASSWORD=
export PGDATABASE=budget
export PGPORT=5432
export PLAID_CLIENT_ID=???
export PLAID_SECRET=???
```

Migrate database:
`yarn migrate`

Start the backends:
`yarn start-backend`

Start the UI:
`yarn start-frontend`

## test
Make sure the server is running (for system tests):
`yarn start-backend`

Run the test suite:
`yarn test`

## todo

### next
 - Frontend
   - User onboarding

### miscellaneous
 - Merge common table accessors
 - token timeout on UI + JWT
 - types for query paraments (+ decoders)
 - expect unordered lists in tests
 - Don't build plan/stages for every transaction
 - Optional remander in SplitByValue

### future
 - Better puller
   - Create "summary" transaction of account value on initial pull
   - Retry on failure
 - Global service configuration
   - various secret keys
 - Authenticate requests between components
 - basic rule pushdowns
   - all include rules are up for grabs
 - Engine aggregations
 - move handling of write transaction requests away from engine
 - a productized path for adding superusers
 - Stateful reaper jobs
    - Make services stateless, can restart jobs on crash
    - How to implicitly divide work between clusters?
       - "reaper microservice"? Isolates recovery to single service
