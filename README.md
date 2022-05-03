# budgeting

## local deploy (with hot-reload)

### dependecies
 - [Docker Desktop](https://www.docker.com/products/docker-desktop/)
 - [minikube](https://minikube.sigs.k8s.io/docs/)

### initial setup

`minikube start`  
`eval $(minikube docker-env)`  
`minikube mount $(PWD)/dist:/dist &`

### compile code  
`yarn setup`  
`yarn build -w`  

### build+deploy
`./build/setup.sh`  
`./build/deploy.sh local`  
  
... some amount of waiting ...  
`kubectl get pods` should show the containers starting up  

### local port forwarding
`minikube tunnel`  
  
Navigate to `http://localhost:3001/external/graphql`  

## cloud deploy
TODO

## development setup
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
  integrations {
    id,
    name,
    sources {
      id,
      name
    }
  }
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

Manually create Plaid integration for user:
```
mutation {
  createPlaidIntegraton(userId: "???", itemId: "???", accessToken: "???", institutionName: "Ally Bank", accounts: [{ id: "test", name: "Ally Checking" }])
}
```

## todo

### next
 - Pull schema file for Nick
 - Cloud deployment

### after next
 - convert scheduler into repeating kubernetes jobs
 - Better logging

### miscellaneous
 - Return simplified rules interface
 - Optional remainder in SplitByValue
   - need way of raising a conflict inside of a single split rule
 - Add comment mutation
 - token timeout on JWT
 - expect unordered lists in tests
 - Don't build plan/stages for every transaction

### future
  - Puller improvements
    - Handle Plaid pageination
    - Don't re-pull everything
  - GraphQL
   - Use fp-ts schemas to generate graphQL types (args, inputs, outputs)
   - Push new GraphQL/iot types to model + remove old types there
 - Engine aggregations
 - Amazon Cognito?
 - basic rule pushdowns
   - all include rules are up for grabs
