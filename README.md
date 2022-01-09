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
`curl -XPOST http://localhost:3000/accounts/ -H "Content-Type: application/json" --data '{ "groupId": "af7cbe4d-8fb1-44b7-9d3d-fe965ecac973", "name": "test account" }'`
`curl -XPOST http://localhost:3000/rules/ -H "Content-Type: application/json" --data '{ "accountId": "3d9ca325-691c-4be6-856e-8164090c4372", "rule": { "_type": "Select" } }'`
`curl -XPOST http://localhost:3000/transactions/ -H "Content-Type: application/json" --data '{ "sourceId": "1", "amount": 10.53, "merchantName": "Apple", "description": "Description", "authorizedAt": 1641693073, "capturedAt": 1641693073, "metadata": { "_type": "Plaid" } }'`
`curl -XPOST http://localhost:3000/transactions/ -H "Content-Type: application/json" --data '{ "sourceId": "1", "amount": 10.53, "merchantName": "Apple", "description": "Description", "authorizedAt": 1641693073, "metadata": { "_type": "Plaid" } }'`

### list
`curl -XGET "http://localhost:3000/groups/"`
`curl -XGET "http://localhost:3000/accounts?groupId=af7cbe4d-8fb1-44b7-9d3d-fe965ecac973"`
`curl -XGET "http://localhost:3000/rules?accountId=3d9ca325-691c-4be6-856e-8164090c4372"`
`curl -XGET "http://localhost:3000/transactions/"`

### get
`curl -XGET http://localhost:3000/groups/f58d8fa8-0f23-423c-b0ca-0b6259aa52b9`
`curl -XGET http://localhost:3000/accounts/9f9cb6ef-1406-49e8-bce0-9f4a911cbf38`
`curl -XGET http://localhost:3000/rules/883ecc47-d225-4d92-9efb-a49d5abf024c`
`curl -XGET http://localhost:3000/transactions/d72e3fd4-0477-46d9-bab5-307aab6568d2`

### delete
`curl -XDELETE http://localhost:3000/groups/f58d8fa8-0f23-423c-b0ca-0b6259aa52b9`
`curl -XDELETE http://localhost:3000/accounts/9f9cb6ef-1406-49e8-bce0-9f4a911cbf38`
`curl -XDELETE http://localhost:3000/rules/883ecc47-d225-4d92-9efb-a49d5abf024c`
`curl -XDELETE http://localhost:3000/transactions/d72e3fd4-0477-46d9-bab5-307aab6568d2`

## todo

### next
 - Simple materialize transactions
   - `/accounts/:id/list`
   - Just Select rules
     - Eq, Neq, Gt, Ge, Lt, Le, Regex
     - Make typesafe (need to limit types on transaction)
     - How to handle metadata nesting?
 - Accounts hierarchy
  - 1 global account per user
  - Materialize sub-accounts through global account
 - Complete rules
   - Select is conflict-free
   - Some way of adding/updating metadata based on Select query + with ability to reference existing metadata
 - Rules conflict resolution

### miscellaneous
 - request logging
 - no need for camelize if columns are renamed in select
 - abstract common db queries/operations
