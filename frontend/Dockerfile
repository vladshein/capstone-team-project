FROM node:24-alpine
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate
RUN chown -R node:node /app
USER node
COPY --chown=node:node package.json pnpm-lock.yaml ./
RUN pnpm install
COPY --chown=node:node . .
EXPOSE 5173
CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0"]
