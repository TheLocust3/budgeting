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

## graphql api
Login
`curl -XPOST http://localhost:3001/users/login -H 'Content-Type: application/json' -d '{ "email": "jake.kinsella@gmail.com", "password": "foobar" }'`

Open `localhost:3001/graphql` and store the token as a cookie using the Developer Console:
`document.cookie="auth-token=${TOKEN}"`

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

## todo

### next
 - Add user add/login to unauthenticated graphql endpoint
 - Add admin graphql routes
 - Manually insert plaid credentials
 - Better puller
   - Think about how this scales, pull off of queue? Don't rely on DB row lock basically
   - Create "summary" transaction of account value on initial pull
   - Retry on failure

### miscellaneous
 - Optional remainder in SplitByValue
 - Add comment mutation
 - token timeout on JWT
 - expect unordered lists in tests
 - Don't build plan/stages for every transaction

### future
 - GraphQL better type checking
   - can we globally type check Context?
   - How about arguments?
   - Can we generate GraphQL types from fp-ts schemas?
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
