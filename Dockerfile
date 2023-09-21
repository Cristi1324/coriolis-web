FROM node:18

WORKDIR /root/coriolis-web

COPY ./ .

ENV NODE_OPTIONS=--openssl-legacy-provider
ENV NODE_ENV=production

RUN corepack enable
RUN yarn workspaces focus --all --production
RUN npm run build

ENTRYPOINT [ "npm", "run", "start" ]
EXPOSE 3000
