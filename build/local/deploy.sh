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
export IMAGE_POLICY="Never"
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
export HOST="localhost"

minikube mount $(PWD)/dist:/dist &

kubectl create secret generic secrets --from-env-file secrets.env
kubectl create secret generic cert --from-file=tls.key=cert.key --from-file=tls.crt=cert.crt
kubectl create secret generic service --from-file service.json

for f in build/cluster/*.yaml; do envsubst < $f | kubectl apply -f -; done
