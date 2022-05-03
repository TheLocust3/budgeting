#! /bin/bash

TYPE="${1:-prod}" # prod/local
if [ "$TYPE" = "local" ]; then
  echo "Deploying locally with hot-reload"
  export ENGINE_COMMAND="cd /home/node/app/engine/ && yarn exec nodemon dist/index.js"
  export SCHEDULER_COMMAND="cd /home/node/app/scheduler/ && yarn exec nodemon dist/index.js"
  export LOGIC_COMMAND="cd /home/node/app/logic/ && yarn exec nodemon dist/index.js"

  export LOCAL_MOUNT="
            - name: local
              mountPath: /home/node/app/"
  export LOCAL_VOLUME="
        - name: local
          hostPath:
            path: /local"
else
  export ENGINE_COMMAND="node /home/node/app/engine/dist/index.js"
  export SCHEDULER_COMMAND="node /home/node/app/scheduler/dist/index.js"
  export LOGIC_COMMAND="node /home/node/app/logic/dist/index.js"
fi

kubectl create secret generic secrets --from-env-file secrets.env

for f in build/kubes/cluster/*.yaml; do envsubst < $f | kubectl apply -f -; done
