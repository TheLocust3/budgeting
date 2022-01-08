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

### miscellaneous
 - N/A