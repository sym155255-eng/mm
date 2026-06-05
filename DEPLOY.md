# 部署指南

导航站是单端口应用（Node 后端同时托管前端 + API + 数据库），部署非常简单。

---

## 方案一：Docker 部署（推荐，最省心）

服务器需先装好 Docker 和 docker compose。

```bash
# 1. 上传/克隆代码到服务器
git clone https://github.com/aa1558686/ddd.git
cd ddd

# 2. 一键构建并启动
docker compose up -d --build

# 完成！访问 http://服务器IP:3001
```

**常用命令：**
```bash
docker compose logs -f      # 看日志
docker compose restart      # 重启
docker compose down         # 停止
docker compose up -d --build  # 更新代码后重新部署
```

- 数据库存在宿主机 `./data/nav.db`，删容器不会丢数据
- 想用 80 端口：把 `docker-compose.yml` 里 `"3001:3001"` 改成 `"80:3001"`
- 记得改 `docker-compose.yml` 里的 `JWT_SECRET`

---

## 方案二：Linux VPS 直接部署（Node + PM2）

服务器需先装 Node.js 18+。

```bash
git clone https://github.com/aa1558686/ddd.git
cd ddd
chmod +x deploy.sh
./deploy.sh
```

脚本会自动：装依赖 → 构建前端 → 用 PM2 启动守护进程。

**设置开机自启**（首次部署后执行一次）：
```bash
pm2 startup    # 按提示复制执行它输出的那行命令
pm2 save
```

**自定义端口：**
```bash
PORT=8080 ./deploy.sh
```

---

## 方案三：免费托管平台（无需服务器）

支持 Node 的平台（Railway / Render / Fly.io 等）：

- **启动命令**：`cd server && npm install && cd ../client && npm install && npm run build && cd ../server && node src/index.js`
- 或直接用本仓库的 `Dockerfile`，平台会自动识别构建

---

## 部署后必做

1. 打开 `http://你的域名/admin`，用 `admin / admin123` 登录
2. **立即在「网站设置」里修改密码**
3. （可选）用 Nginx 反代 + HTTPS：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        # SSE 跑马灯/实时更新需要：
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
    }
}
```
再用 `certbot --nginx` 一键上 HTTPS。

---

## 数据备份

只需备份一个文件：`data/nav.db`（含所有链接、分类、设置、跑马灯等）。
