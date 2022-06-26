#! /bin/bash

echo "Upgrading cluster to $VERSION"

/home/ubuntu/ecr_refresh.sh

export IMAGE="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/common:$VERSION"

kubectl set image deployment/logic logic=$IMAGE
kubectl rollout restart deployment/logic

kubectl delete -f /home/ubuntu/cluster/005-puller-job.yaml
kubectl apply -f /home/ubuntu/cluster/005-puller-job.yaml

kubectl delete -f /home/ubuntu/cluster/003-migrate.yaml
kubectl apply -f /home/ubuntu/cluster/003-migrate.yaml
