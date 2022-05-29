#! /bin/bash

echo "Deploying to ${CONTROL_PLANE_IP}"

export IMAGE="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/common:latest"
export IMAGE_POLICY="IfNotPresent"

rm -rf tmp/
mkdir -p tmp/build/cluster/

for f in build/cluster/*.yaml; do envsubst < $f > tmp/$f; done

ssh ubuntu@"${CONTROL_PLANE_IP}" "mkdir ~/cluster/"
scp -r secrets.env ubuntu@"${CONTROL_PLANE_IP}":~/secrets.env
scp -r tmp/build/cluster/* ubuntu@"${CONTROL_PLANE_IP}":~/cluster/

ssh ubuntu@"${CONTROL_PLANE_IP}" "sudo kubectl create secret generic secrets --from-env-file secrets.env"
ssh ubuntu@"${CONTROL_PLANE_IP}" "sudo kubectl apply -f ~/cluster/"