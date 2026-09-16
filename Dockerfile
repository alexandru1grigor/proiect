FROM node:20.19.0-alpine AS dependencies
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20.19.0-alpine AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20.19.0-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/runtime/run.sh /usr/bin/run.sh
RUN npm ci --omit=dev && chmod +x /usr/bin/run.sh
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
ENTRYPOINT ["run.sh"]
