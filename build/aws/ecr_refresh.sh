#!/bin/bash

PASSWORD=$(aws ecr get-login-password --region $AWS_DEFAULT_REGION)

cat << EOF | sudo tee /etc/rancher/k3s/registries.yaml
mirrors:
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com:
    endpoint:
      - "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com"
configs:
  "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com":
    auth:
      username: AWS
      password: $PASSWORD
EOF

systemctl restart k3s.service
