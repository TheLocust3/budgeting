#! /bin/bash

TYPE="${1:-prod}" # prod/local
if [ "$TYPE" = "local" ]; then
  echo "Deploying locally with hot-reload"
  export ENGINE_COMMAND="cd /home/node/app/ && CHOKIDAR_USEPOLLING=true yarn exec nodemon --watch dist/ -L node dist/engine/index.js"
  export SCHEDULER_COMMAND="cd /home/node/app/ && CHOKIDAR_USEPOLLING=true yarn exec nodemon --watch dist/ -L node dist/scheduler/index.js"
  export LOGIC_COMMAND="cd /home/node/app/ && CHOKIDAR_USEPOLLING=true yarn exec nodemon --watch dist/ -L node dist/logic/index.js"

  export LOCAL_MOUNT="
            - name: dist
              mountPath: /home/node/app/dist"
  export LOCAL_VOLUME="
        - name: dist
          hostPath:
            path: /dist"
else
  export ENGINE_COMMAND="node /home/node/app/dist/engine/index.js"
  export SCHEDULER_COMMAND="node /home/node/app/dist/scheduler/index.js"
  export LOGIC_COMMAND="node /home/node/app/dist/logic/index.js"
fi

kubectl create secret generic secrets --from-env-file secrets.env

for f in build/kubes/cluster/*.yaml; do envsubst < $f | kubectl apply -f -; done
