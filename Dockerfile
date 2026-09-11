FROM node:20-alpine AS dependencies

WORKDIR /usr/src/app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci --legacy-peer-deps

FROM dependencies AS build

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS production

ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts --legacy-peer-deps \
  && npm cache clean --force
COPY --from=build /usr/src/app/dist ./dist

USER node
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
