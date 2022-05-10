# budgeting

## local deploy (with hot-reload)

### dependecies
 - [Docker Desktop](https://www.docker.com/products/docker-desktop/)
 - [minikube](https://minikube.sigs.k8s.io/docs/)

### initial setup

`minikube start`  
`eval $(minikube docker-env)`  
`minikube tunnel &`

Create `secrets.env` in the root of the repo:
```
PLAID_CLIENT_ID=???
PLAID_SECRET=???
```

### compile code  
`yarn setup`  

### build+deploy
`./build/local/publish.sh`  
`./build/local/deploy.sh`  
  
... some amount of waiting ...  
`kubectl get pods` should show the containers starting up  
  
Navigate to `http://localhost:3001/external/graphql`  

### start hot-reload
`yarn deploy`


## cloud deploy

### depedencies
 - [Packer](http://packer.io)
 - [Terraform](https://www.terraform.io)
  
Environment variables:
```
export AWS_ACCESS_KEY_ID=???
export AWS_SECRET_ACCESS_KEY=???
export AWS_DEFAULT_REGION=us-east-1
```
  
The following commands must be executed from `build/aws`
`cd build/aws/`

Set up packer:
`packer init .`

Set up terraform:
`terraform init`

### ami build
Build the image:
`packer build image.pkr.hcl`

### aws build
Create+install an EC2 Key Pair in the AWS Console called "budgeting".  

Build the resources:
`terraform apply`
  
Note the value of `control_plane_ip`.
  
... wait _awhile_ ...  

### cluster deploy
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

Export the Control Plane IP:
`export CONTROL_PLANE_IP=???`

Deploy the cluster:
`./build/publish.sh`
`./build/deploy.sh`

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
 - Upload image to ECR
 - Better logging

### miscellaneous
 - priority rollup on account creation
   - rollup-job needs to be trigger basically immediately
 - if rollup job fails, it will never retry
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
