#! /bin/bash

echo "Deploying locally with hot-reload"
export LOCAL_MOUNT="
          - name: dist
            mountPath: /home/node/app/dist"
# this is a wildly bad solution
export LOCAL_MOUNT2="
              - name: dist
                mountPath: /home/node/app/dist"
export LOCAL_VOLUME="
      - name: dist
        hostPath:
          path: /dist"
export LOCAL_VOLUME2="
          - name: dist
            hostPath:
              path: /dist"
export IMAGE="common:latest"
export POSTGRES_LB="---
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
  type: LoadBalancer"

minikube mount $(PWD)/dist:/dist &

kubectl create secret generic secrets --from-env-file secrets.env

for f in build/cluster/*.yaml; do envsubst < $f | kubectl apply -f -; done
