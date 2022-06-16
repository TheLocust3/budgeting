#! /bin/bash

echo "Deploying to ${CONTROL_PLANE_IP}"

VERSION=${1:-latest}

./build/push.sh $VERSION

ssh ubuntu@"${CONTROL_PLANE_IP}" "sudo kubectl create secret generic secrets --from-env-file secrets.env"
ssh ubuntu@"${CONTROL_PLANE_IP}" "sudo kubectl apply -f ~/cluster/"