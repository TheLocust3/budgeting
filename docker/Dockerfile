FROM node:16
WORKDIR /usr/src/app

COPY . .
RUN yarn setup
RUN chown -Rh node:node /usr/src/app
RUN chmod -R 777 /usr/src/app/engine/dist/index.js
RUN chmod -R 777 /usr/src/app/scheduler/dist/index.js
RUN chmod -R 777 /usr/src/app/logic/dist/index.js

EXPOSE 8080
