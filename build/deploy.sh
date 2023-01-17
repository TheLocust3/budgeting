#! /bin/bash

export VERSION=${1:-latest}

echo "Deploying to ${CONTROL_PLANE_IP} @ $VERSION"

./build/push.sh $VERSION

ssh ubuntu@"${CONTROL_PLANE_IP}" "sudo ./ecr_refresh.sh"
ssh ubuntu@"${CONTROL_PLANE_IP}" "sudo kubectl create secret generic secrets --from-env-file secrets.env"
ssh ubuntu@"${CONTROL_PLANE_IP}" "sudo kubectl create secret generic cert --from-file=tls.key=/etc/letsencrypt/live/jakekinsella.com/privkey.pem --from-file=tls.crt=/etc/letsencrypt/live/jakekinsella.com/fullchain.pem"
ssh ubuntu@"${CONTROL_PLANE_IP}" "sudo kubectl create secret generic service --from-file service.json"
ssh ubuntu@"${CONTROL_PLANE_IP}" "sudo kubectl apply -f ~/cluster/"