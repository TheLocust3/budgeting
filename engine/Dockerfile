FROM node:16

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /home/node/app

COPY --chown=node:node . .
RUN yarn setup-engine

RUN chmod -R 777 /home/node/app/engine/dist/index.js

CMD node /home/node/app/engine/dist/index.js
EXPOSE 8080