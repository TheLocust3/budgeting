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
 - types for query paraments (+ decoders)
 - Frontend
   - Move plaid logic to frontend + add sources from frontend
 - Model logic APIs in "model" package and add frontends to UI
 - Create user through UI + login
 - `integration` table which stores JSON blob with Plaid keys
 - `source` has optional integration id
 - Cleanup
   - Add names to pipe functions
 - Scheduler
   - Setup core scheduler loop
   - Spin off puller subprocesses
   - puller adds transactions via `POST@engine /puller/transaction` and completes via `POST@scheduler /puller/complete`
 - Engine
   - Optional remander in SplitByValue
 - Business logic layer
   - manage business logic

### miscellaneous
 - expect unordered lists in tests
 - Don't build plan/stages for every transaction
 - validate email
   - both formatting + send email to user
 - pull jwt secret fron environment
 - JWT expiry
 - distinguish between channel errors and user facing errors
 - a productized path for adding superusers

### future
 - Global service configuration
 - Authenticate requests between components
 - basic rule pushdowns
   - all include rules are up for grabs
 - Aggregations
 - split database in separate instances
 - move handling of write transaction requests away from engine
 - have pullers pull jobs from queue fed by some cron job
 - Stateful reaper jobs
    - Make services stateless, can restart jobs on crash
    - How to implicitly divide work between clusters?
       - "reaper microservice"? Isolates recovery to single service
