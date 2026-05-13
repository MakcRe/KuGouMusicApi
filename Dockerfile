FROM node:lts-alpine

RUN apk add --no-cache tini

RUN corepack enable

ENV NODE_ENV=production

WORKDIR /app

RUN chown node:node /app

COPY --chown=node:node package.json pnpm-lock.yaml ./

USER node

RUN pnpm install --prod --frozen-lockfile

COPY --chown=node:node . ./

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "app.js"]
