FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg fonts-noto-cjk ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev && mkdir -p /app/.local && chown -R node:node /app
USER node
ENV NODE_ENV=production PORT=4311 HOST=0.0.0.0
EXPOSE 4311
CMD ["npm", "start"]
