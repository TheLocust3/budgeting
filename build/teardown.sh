#! /bin/bash

echo "Tearing down ${CONTROL_PLANE_IP}"

ssh ubuntu@"${CONTROL_PLANE_IP}" "sudo kubectl delete -f ~/cluster/"