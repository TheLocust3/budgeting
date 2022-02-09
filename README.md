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
`yarn start`

## test
Make sure the server is running (for system tests):
`yarn start`

Run the test suite:
`yarn test`

## todo

### next
 - How do we deploy and scale this application easily?
   - Simplify table accesses and models
     - create functions should take some internal pre-persisted object instead of just null-ing fields
     - Always pull rules with `accounts` into some "rich" account
     - fix `linkedAccounts`, try to get rid of `withChildren`
 - Move business logic API to graphql
   - what sort of schema should it have?
 - some way to manually insert Plaid credentials
 - Better puller
   - Think about how this scales, pull off of queue? Don't rely on DB row lock basically
   - Create "summary" transaction of account value on initial pull
   - Retry on failure

### miscellaneous
 - Merge common table accessors
 - token timeout on JWT
 - expect unordered lists in tests
 - Don't build plan/stages for every transaction
 - Optional remainder in SplitByValue

### future
 - How to simplify channel communication?
   - engine/scheduler shoud "export" objects that allow other services to talk to them?
 - Global service configuration
   - various secret keys + API endpoints
 - Engine aggregations
 - Deployment
 - Amazon Cognito?
 - Authenticate requests between components
 - basic rule pushdowns
   - all include rules are up for grabs
 - a productized path for adding superusers
 - Stateful reaper jobs
    - Make services stateless, can restart jobs on crash
    - How to implicitly divide work between clusters?
       - "reaper microservice"? Isolates recovery to single service
