# budgeting

## local deploy (with hot-reload)

### dependecies
 - [Docker Desktop](https://www.docker.com/products/docker-desktop/)
 - [minikube](https://minikube.sigs.k8s.io/docs/)
 - [nodejs](https://nodejs.org/en/)
 - [yarn](https://classic.yarnpkg.com/lang/en/docs/install/)

### initial setup

`minikube start`  
`eval $(minikube docker-env)`  
`minikube tunnel &`

Create `secrets.env` in the root of the repo:
```
PLAID_CLIENT_ID=???
PLAID_SECRET=???
```

### setup + compile
`yarn setup`  

### build+deploy
`./build/local/publish.sh`  
`./build/local/deploy.sh`  
  
... some amount of waiting ...  
`kubectl get pods` should show the containers starting up  
  
Navigate to `http://localhost:8080/graphql`  

### build + hot-reload
`yarn deploy`


## cloud deploy

### depedencies
 - [Packer](http://packer.io)
 - [Terraform](https://www.terraform.io)

### initial setup

Environment variables:
```
export AWS_ACCESS_KEY_ID=???
export AWS_SECRET_ACCESS_KEY=???
export AWS_ACCOUNT_ID=???
export AWS_DEFAULT_REGION=us-east-1
```

Create `secrets.env` in the root of the repo:
```
PLAID_CLIENT_ID=???
PLAID_SECRET=???
```
  
Initialize the build depedencies:
`./build/aws/init.sh`

### aws setup
Build the AMI:  
`./build/aws/build_image.sh`

Set up the ECR repo:  
`./build/aws/build_repo.sh`

### aws build
Manually create+install an EC2 Key Pair in the AWS Console called "budgeting".  

Build the resources:  
`./build/aws/build.sh`  
  
Note the value of `control_plane_ip`.  
  
... wait _awhile_ ...  

### cluster deploy

Export the Control Plane IP:  
`export CONTROL_PLANE_IP=???`  

Deploy the cluster:  
`./build/publish.sh`  
`./build/deploy.sh`  

... wait \~10minutes time (until `sudo kubectl get pods` shows all the containers running) ...  

## graphql api
### External API
Open `localhost:8080/external/graphql`.

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
Open `localhost:8080/graphql`.

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
  },
  total,
  accounts {
    id,
    name,
    total,
    transactions {
      id,
      amount,
      merchantName,
      description
    }
  },
  buckets {
    id,
    name,
    total,
    transactions {
      id
    }
  },
  rules {
    id,
    rule
  },
  untagged {
    id
  },
  conflicts {
    element {
      id
    },
    rules
  }
}
```

### Admin API
Open `localhost:8080/admin/graphql`.

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

### schema

Schemas for each endpoint are located in `schema/`.  

To dump a new schema:
`yarn global add get-graphql-schema`
`./schema/dump.sh "${ADMIN_TOKEN}"`

## notes

### code structure

`logic`
 - GraphQL API server
  
`user`
 - Business logic layer over raw users/accounts/rules/integrations/sources
 - Provides a simple interface to read/add/delete resources from individual users
  
`engine`
 - The rules engine
 - Provides an interface to materialize all transactions under an account via its rules
 - Provides an interface to validate the creation of rules
  
`job`
 - Jobs run on a schedule by Kubernetes

`storage`
 - Provides interfaces (i.e. frontends) to interact with each table in the database
  
`model`
 - Typed models for every resource in the project
 - JSON/SQL converters for said types
  
`magic`
 - Miscellaneous utilities
  

### tables

`users`
 - the root user record with associated password

`accounts`
 - Either a physical account (bank account) or virtual account (ex. vacation)

`rules`
 - Rules to divide transactions across accounts

`transactions`
 - The actual transactions recording the amount + various other details
 - Attached to a user + source

`sources`
 - Essential a label of where a transaction came from

`integrations`
 - Plaid credentials associated with a source
 - Transactions pulled from these credentials will be tagged with the associated source

## todo

### polish
 - Move back to separate login/user graphql endpoints
   - means no need to handle unauthorized in endpoints
   - publish graphql schema with repo
 - On account delete, sources should also be deleted
   - This might involve a schema update unfortunately
   - Afterwards, no need to be able to directly delete sources
 - Add ability to sort transactions in IR

### next
 - Puller improvements
  - Handle Plaid pageination
  - Don't re-pull everything
  - Some way to alert users of failures
 - HTTPS infrastructure
   - pull certs from S3 on logic container start
 - Move control plane to separate instance + use ASGs for nodes
   - Need some sort of "size" to control how many logic replicas are created + way to scale up puller jobs

### miscellaneous
 - createLinkToken should have actual errors
 - exchangePublicToken should have actual errors
 - Validate integration credentials before creating
 - Don't build plan/stages for every transaction

### future
  Hide/unhide bucket
  - Optional remainder in SplitByValue
   - need way of raising a conflict inside of a single split rule
  - Add comment mutation
 - basic rule pushdowns
   - all include rules are up for grabs
