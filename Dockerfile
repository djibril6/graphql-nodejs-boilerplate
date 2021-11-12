FROM node:alpine

RUN mkdir -p /usr/src/graphql-node-app && chown -R node:node /usr/src/graphql-node-app

WORKDIR /usr/src/graphql-node-app

COPY package.json package-lock.json ./

USER node

RUN yarn install --pure-lockfile

COPY --chown=node:node . .

EXPOSE 4000
