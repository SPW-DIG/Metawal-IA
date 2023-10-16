FROM node:16-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY dist/standalone/package.json dist/standalone/yarn.lock ./

RUN yarn --frozen-lockfile --prod

COPY dist/standalone/ ./

EXPOSE 5000
ENTRYPOINT ["node", "index.js"]
