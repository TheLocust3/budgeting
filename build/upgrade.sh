#! /bin/bash

export VERSION=${1:-latest}

echo "Upgrading $CONTROL_PLANE_IP @ $VERSION"

./build/push.sh $VERSION

ssh ubuntu@"${CONTROL_PLANE_IP}" "sudo sh /home/ubuntu/tools/upgrade.sh"
