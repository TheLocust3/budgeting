#! /bin/bash

export VERSION=${1:-latest}

echo "Pushing to ${CONTROL_PLANE_IP} @ $VERSION"

export IMAGE="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/common:$VERSION"
export IMAGE_POLICY="IfNotPresent"

rm -rf tmp/
mkdir -p tmp/build/cluster/
mkdir -p tmp/build/tools/

for f in build/cluster/*.yaml; do envsubst < $f > tmp/$f; done
for f in build/tools/*.sh; do envsubst '$AWS_DEFAULT_REGION:$AWS_ACCOUNT_ID:$VERSION' < $f > tmp/$f; done

ssh ubuntu@"${CONTROL_PLANE_IP}" "mkdir ~/cluster/"
ssh ubuntu@"${CONTROL_PLANE_IP}" "mkdir ~/tools/"

scp -r secrets.env ubuntu@"${CONTROL_PLANE_IP}":~/secrets.env
scp -r tmp/build/cluster/* ubuntu@"${CONTROL_PLANE_IP}":~/cluster/
scp -r tmp/build/tools/* ubuntu@"${CONTROL_PLANE_IP}":~/tools/
