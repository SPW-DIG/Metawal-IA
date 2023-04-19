FROM node:16-alpine AS BUILD_IMAGE

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json yarn.lock ./

RUN yarn --frozen-lockfile
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

# build application
RUN yarn build

# remove development dependencies
RUN npm prune --production



FROM node:16-alpine

WORKDIR /usr/src/app

# copy from build image
COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules

ENTRYPOINT ["node", "dist/index.js"]