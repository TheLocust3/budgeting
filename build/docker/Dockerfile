FROM $IMAGE

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /home/node/app

COPY --chown=node:node . .
RUN yarn setup

ENV PRODUCTION=1
EXPOSE 8080