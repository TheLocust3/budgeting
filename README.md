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
export META=/Users/jakekinsella/Programming/budget/budgeting/meta
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
 - Block storage DB
   - hash user email over the wire
   - Rethink scheduler logic
 - graphql API
   - rewrite logic routes
   - rewrite logic tests
   - integration tests
 - some way to manually insert Plaid credentials
 - Better puller
   - Create "summary" transaction of account value on initial pull
   - Retry on failure

### miscellaneous
 - Merge common table accessors
 - token timeout on JWT
 - expect unordered lists in tests
 - Don't build plan/stages for every transaction
 - Optional remainder in SplitByValue

### future
 - Storage improvements
   - lots of it can be made more generic
   - transactions + accounts + integrations should be indexed by id
   - Migrations
     - split transactions out by month
     - split out rules by account
   - Spin off into separate repo
 - Engine aggregations
 - Global service configuration
   - various secret keys
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
