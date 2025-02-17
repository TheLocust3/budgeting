# Budgeting

A simple budgeting app.

## local deploy (with hot-reload)

### dependecies
 - [Docker Desktop](https://www.docker.com/products/docker-desktop/)
 - [minikube](https://minikube.sigs.k8s.io/docs/)
 - [nodejs](https://nodejs.org/en/)
 - [yarn](https://classic.yarnpkg.com/lang/en/docs/install/)
 - envsubst
   - `brew install gettext`

### initial setup

`minikube start`  
`eval $(minikube docker-env)`  
`minikube addons enable ingress`  
`minikube tunnel`  
`sudo sh -c 'echo "127.0.0.1       budget.localhost" >> /etc/hosts'`

Create `secrets.env` in the root of the repo:
```
PLAID_CLIENT_ID=???
PLAID_SECRET=???
```

Create a certificate called `cert`:
```
openssl req -newkey rsa:4096 \
            -x509 \
            -sha256 \
            -days 3650 \
            -nodes \
            -out cert.crt \
            -keyout cert.key
```

Create a file called `service.json` with the Firebase credentials (https://firebase.google.com/docs/admin/setup?authuser=0#initialize-sdk).  

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
### authentication
Login to Firebase via:  
`yarn signin`  

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
  notifications {
    id,
    createdAt,
    title,
    body,
    acked
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
    },
    templates {
      id,
      template
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

## testing
```
createdb budget

export PGDATABASE=budget
export PGHOST=localhost
export PGPORT=5432
export PGUSER=jakekinsella
export PGPASSWORD=foobar

yarn migrate
yarn test
```

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
