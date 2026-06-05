# ---------- 阶段1：构建前端 ----------
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install --registry https://registry.npmmirror.com
COPY client/ ./
RUN npm run build

# ---------- 阶段2：运行后端 + 托管前端 ----------
FROM node:20-alpine
WORKDIR /app

# 后端依赖
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev --registry https://registry.npmmirror.com

# 后端代码
COPY server/ ./server/
# 前端构建产物（后端 index.js 里 path 是 ../../client/dist）
COPY --from=client-build /app/client/dist ./client/dist

# 数据目录（挂载持久化）
RUN mkdir -p /app/data
VOLUME ["/app/data"]

ENV PORT=3001
EXPOSE 3001

WORKDIR /app/server
CMD ["node", "src/index.js"]
