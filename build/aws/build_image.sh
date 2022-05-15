#!/bin/bash

cd build/aws/

mkdir tmp/
envsubst '$AWS_DEFAULT_REGION:$AWS_ACCOUNT_ID' < ecr_refresh.sh > tmp/ecr_refresh.sh

packer build image.pkr.hcl
