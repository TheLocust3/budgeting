#! /bin/bash

TYPE="${1:-prod}" # prod/local
if [ "$TYPE" = "local" ]; then
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

  minikube mount $(PWD)/dist:/dist &
fi

kubectl create secret generic secrets --from-env-file secrets.env

for f in build/cluster/*.yaml; do envsubst < $f | kubectl apply -f -; done
