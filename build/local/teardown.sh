#! /bin/bash

kubectl delete secret secrets
for f in build/cluster/*.yaml; do envsubst < $f | kubectl delete -f -; done