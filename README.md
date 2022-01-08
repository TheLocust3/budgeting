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
curl -XPOST http://localhost:3000/accounts/ -H "Content-Type: application/json" --data '{ "groupId": "1", "name": "test account" }'

## todo

### next
 - transactions CRUD
 - accounts CRUD
 - rules CRUD
 - groups CRUD
 - Materialize transactions
 - Accounts hierarchy
  - 1 global account per user
  - Materialize sub-accounts through global account
 - Complete rules
   - Select is conflict-free
   - Some way of adding/updating metadata based on Select query + with ability to reference existing metadata
 - Rules conflict resolution

### miscellaneous
 - N/A