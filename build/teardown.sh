#! /bin/bash

echo "Tearing down ${CONTROL_PLANE_IP}"

ssh ubuntu@"${CONTROL_PLANE_IP}" "KUBECONFIG=/home/ubuntu/.kube/config kubectl teardown -f ~/cluster/"