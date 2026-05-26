# syntax=docker/dockerfile:1.7

FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NODE_ENV=production

# -------------------------
# Dependencies
# -------------------------
FROM base AS deps

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Ensure ES module support
RUN npm pkg set type=module

RUN npm ci --omit=dev


# -------------------------
# Runtime Image
# -------------------------
FROM base AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000


USER node


COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json
COPY --from=deps /app/node_modules ./node_modules


COPY --chown=node:node src ./src
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node db ./db


COPY --chown=node:node entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 5000


CMD ["./entrypoint.sh"]