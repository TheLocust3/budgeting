#! /bin/bash

echo "Deploying to ${CONTROL_PLANE_IP}"

rm -rf tmp/
mkdir -p tmp/build/cluster/

for f in build/cluster/*.yaml; do envsubst < $f > tmp/$f; done

ssh ubuntu@"${CONTROL_PLANE_IP}" "mkdir ~/cluster/"
scp -r secrets.env ubuntu@"${CONTROL_PLANE_IP}":~/secrets.env
scp -r tmp/build/cluster/* ubuntu@"${CONTROL_PLANE_IP}":~/cluster/

ssh ubuntu@"${CONTROL_PLANE_IP}" "KUBECONFIG=/home/ubuntu/.kube/config kubectl create secret generic secrets --from-env-file secrets.env"
ssh ubuntu@"${CONTROL_PLANE_IP}" "KUBECONFIG=/home/ubuntu/.kube/config kubectl apply -f ~/cluster/"