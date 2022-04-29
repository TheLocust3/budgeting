#! /bin/bash

kubectl create secret generic secrets --from-env-file secrets.env
kubectl apply -f build/kubes/cluster/
