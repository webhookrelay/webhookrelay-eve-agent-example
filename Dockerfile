# syntax=docker/dockerfile:1
# Self-hosted eve agent: build the Nitro node-server output with `eve build`
# and serve it with `eve start`. node:24-slim is multi-arch, so the same image
# builds on a Raspberry Pi (arm64), a Mac mini, or an x86 box.
FROM node:24-slim

WORKDIR /app

# Install dependencies first for better layer caching. Install all deps (incl.
# dev) so `eve build` has everything it needs.
COPY package.json package-lock.json ./
RUN npm ci

# No secrets are needed at build time — credentials are read at runtime from
# the environment.
COPY . .
RUN npx eve build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Durable session state is persisted here. Mount a volume to survive restarts.
VOLUME ["/app/.workflow-data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/eve/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "-c", "npx eve start --host 0.0.0.0 --port ${PORT:-3000}"]
