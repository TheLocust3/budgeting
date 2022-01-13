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

## sample requests

### create
`curl -XPOST http://localhost:3000/groups/ -H "Content-Type: application/json" --data '{ "name": "test group" }'`  
`curl -XPOST http://localhost:3000/accounts/ -H "Content-Type: application/json" --data '{ "groupId": "bb741ad0-f746-4f25-8847-7c1d1730acfc", "name": "test account" }'`  
`curl -XPOST http://localhost:3000/rules/ -H "Content-Type: application/json" --data '{ "accountId": "69a008d6-2083-43b2-959a-5aa3d12dd5b3", "rule": { "_type": "Include", "clause": { "_type": "Match", "operator": "Eq", "field": "id", "value": "b98e19f0-f6ea-450a-b798-9947e495961a" } } }'`  
`curl -XPOST http://localhost:3000/rules/ -H "Content-Type: application/json" --data '{ "accountId": "d191281c-681f-4f4c-ad43-77aacceaab54", "rule": { "_type": "Include", "operator": "Eq", "field": "metadata._type", "value": "Plaid" } }'`  
`curl -XPOST http://localhost:3000/transactions/ -H "Content-Type: application/json" --data '{ "sourceId": "1", "amount": 10.53, "merchantName": "Apple", "description": "Description", "authorizedAt": 1641693073, "capturedAt": 1641693073, "metadata": { "_type": "Plaid" } }'`  
`curl -XPOST http://localhost:3000/transactions/ -H "Content-Type: application/json" --data '{ "sourceId": "1", "amount": 10.53, "merchantName": "Apple", "description": "Description", "authorizedAt": 1641693073, "metadata": { "_type": "Plaid" } }'`  

### list
`curl -XGET "http://localhost:3000/groups/"`  
`curl -XGET "http://localhost:3000/accounts?groupId=af7cbe4d-8fb1-44b7-9d3d-fe965ecac973"`  
`curl -XGET "http://localhost:3000/rules?accountId=69a008d6-2083-43b2-959a-5aa3d12dd5b3"`  
`curl -XGET "http://localhost:3000/transactions/"`  

### get
`curl -XGET http://localhost:3000/groups/9492b4c8-32f3-4912-9605-c34330edea5a`  
`curl -XGET http://localhost:3000/accounts/9f9cb6ef-1406-49e8-bce0-9f4a911cbf38`  
`curl -XGET http://localhost:3000/rules/883ecc47-d225-4d92-9efb-a49d5abf024c`  
`curl -XGET http://localhost:3000/transactions/d72e3fd4-0477-46d9-bab5-307aab6568d2`  

### delete
`curl -XDELETE http://localhost:3000/groups/f58d8fa8-0f23-423c-b0ca-0b6259aa52b9`  
`curl -XDELETE http://localhost:3000/accounts/9f9cb6ef-1406-49e8-bce0-9f4a911cbf38`  
`curl -XDELETE http://localhost:3000/rules/883ecc47-d225-4d92-9efb-a49d5abf024c`  
`curl -XDELETE http://localhost:3000/transactions/d72e3fd4-0477-46d9-bab5-307aab6568d2`  

### materialize account
`curl -XGET http://localhost:3000/accounts/69a008d6-2083-43b2-959a-5aa3d12dd5b3/materialize`  

## test
Make sure the server is running (for system tests):
`yarn start`

Run the test suite:
`yarn test`

## todo

### next
 - Add new fields via Update
   - need a clever way of modelling arbitrary fields
   - only string results?
 - Complete rules
   - Exists operator, regex operator
   - Properly handle dates
   - Don't build plan/stages for every transaction
   - Allow metadata access
   - Prevent updates to `id`
 - Update conflict resolution
 - Accounts hierarchy
   - 1 global account per user
   - Materialize sub-accounts through global account

### future
  - frontends
    - move route logic to frontend module
    - all pure functions
    - scrub errors before returning to route

### miscellaneous
 - unit tests against frontends/components
 - run linter
 - move db logic from routes to some sort of controller
 - request logging
 - no need for camelize if columns are renamed in select
 - abstract common db queries/operations
