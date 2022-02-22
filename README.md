# budgeting

## setup
`yarn install`  
`yarn setup`  
`yarn build`  

### initialize the database
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

## graphql api
### External API
Open `localhost:3001/external/graphql`.

Login:
```
mutation {
  login(email: "jake.kinsella@gmail.com", password: "foobar") {
    token
  }
}
```

Store the token as a cookie using the Developer Console:
`document.cookie="auth-token=${TOKEN}"`

### Authenticated API
Open `localhost:3001/graphql`.

Sample query:
```
{
  user {
    id,
    email
  },
  accounts {
    id,
    name,
    transactions {
      id
    }
  },
  buckets {
    id,
    name,
    rules {
      id,
      rule
    },
    transactions {
      id
    }
  },
  untagged {
    id
  },
  conflicts {
    element {
      id
    },
    rules {
      id,
      rule
    }
  }
}
```

Manually create Plaid integration:
```
mutation {
  createPlaidIntegraton(itemId: "???", accessToken: "???", institutionName: "Ally Bank", accounts: [{ id: "test", name: "Ally Checking" }])
}
```

### Admin API
Open `localhost:3001/admin/graphql`.

Sample query:
```
{
  users {
    id,
    email
  }
}
```

## todo

### next
 - Full create user
   - Create global/physical/virtual + rules
 - Create accounts + rules when creating integration
 - Create "summary" transaction of account value on initial pull
   - make `last_refreshed` start as null
   - if null, pull current account balance and create a dummy transaction
 - Optional remainder in SplitByValue
   - need way of raising a conflict inside of a single split rule
 - Global service configuration
   - various secret keys + API endpoints
 - Authenticate requests between logic and engine
   - Add some secret to config. Logic signs requests with it and engine validates

### miscellaneous
 - Puller shouldn't overwrite authorized_at when the transaction is no longer pending
 - Move CreatePlaidIntegration to admin endpoint
 - Return simplified rules interface
 - Add comment mutation
 - token timeout on JWT
 - expect unordered lists in tests
 - Don't build plan/stages for every transaction
 - a path for adding superusers

### future
  - GraphQL
   - Use fp-ts schemas to generate graphQL types (args, inputs, outputs)
   - Push new GraphQL/iot types to model + remove old types there
 - Engine aggregations
 - Deployment
 - Amazon Cognito?
 - basic rule pushdowns
   - all include rules are up for grabs
 - Stateful reaper jobs
    - Make services stateless, can restart jobs on crash
    - How to implicitly divide work between clusters?
       - "reaper microservice"? Isolates recovery to single service
