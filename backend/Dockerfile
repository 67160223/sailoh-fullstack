# ---- Stage 1: build ----
FROM node:20-alpine AS builder

# Prisma engine ต้องพึ่ง OpenSSL บน alpine — ถ้าไม่ลงจะ generate/connect ไม่ได้
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Stage 2: production ----
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
# คัดลอก schema มาก่อน npm install เพราะ @prisma/client มี postinstall hook ที่รัน "prisma generate"
# ซึ่งต้องมี schema.prisma อยู่แล้วตอนนั้น ไม่งั้น install จะพังหรือได้ client ที่ไม่สมบูรณ์
COPY prisma ./prisma
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 4000

# migrate deploy = apply migration ที่มีอยู่แล้ว เหมาะกับ production ไม่สร้าง migration ใหม่ตอน runtime
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
