# 个人博客系统

一个简约高级风格的个人博客，前后端分离架构，支持多端访问。

## 技术栈

- **前端**: React 19 + Vite + React Router + Axios + React Quill
- **后端**: Node.js + Express + JWT
- **数据库**: MySQL

## 项目结构

```
personBlog/
├── front_end_of_blog/     # 前端 React 项目
├── back_end_of_blog/      # 后端 Node.js 项目
├── database/              # 数据库脚本
│   └── init.sql          # 数据库初始化脚本
└── README.md
```

## 功能特性

### 访客权限
- 浏览所有已发布的文章列表
- 查看单篇文章详情

### 管理员权限
- 管理员登录（账号密码验证）
- 发布新文章（支持富文本编辑）
- 编辑/删除自己发布的文章

## 快速开始

### 1. 环境要求

- Node.js 18+
- MySQL 8.0+
- npm 或 yarn

### 2. 初始化数据库

```bash
# 登录 MySQL
mysql -u root -p

# 执行初始化脚本
source database/init.sql
```

或者直接导入：
```bash
mysql -u root -p < database/init.sql
```

### 3. 启动后端

```bash
# 进入后端目录
cd back_end_of_blog

# 安装依赖
npm install

# 配置环境变量（修改 .env 文件）
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=你的MySQL密码
# DB_NAME=blog_db
# JWT_SECRET=你的JWT密钥

# 启动服务
npm start
```

后端默认运行在 `http://localhost:3001`

### 4. 启动前端

```bash
# 进入前端目录
cd front_end_of_blog

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端默认运行在 `http://localhost:5173`

## 测试方法

### 1. 访客浏览

直接访问 `http://localhost:5173`，可以：
- 查看文章列表
- 点击文章查看详情
- 无法进行任何修改操作

### 2. 管理员登录

1. 点击右上角「管理员登录」
2. 使用预设账号登录：
   - 用户名: `admin`
   - 密码: `123456`
3. 登录成功后导航栏显示「发布文章」入口

### 3. 发布文章

1. 登录后点击「发布文章」
2. 填写标题、内容（支持富文本格式）、标签
3. 点击「发布文章」按钮
4. 发布成功后自动跳转到首页

### 4. 编辑/删除文章

1. 登录后进入自己发布的文章详情页
2. 页面底部显示「编辑文章」和「删除文章」按钮
3. 只能操作自己发布的文章

## API 接口

| 接口 | 方法 | 功能 | 权限 |
|------|------|------|------|
| `/api/articles` | GET | 获取文章列表 | 公开 |
| `/api/articles/:id` | GET | 获取文章详情 | 公开 |
| `/api/auth/login` | POST | 管理员登录 | 公开 |
| `/api/articles` | POST | 发布文章 | 需登录 |
| `/api/articles/:id` | PUT | 编辑文章 | 需登录 |
| `/api/articles/:id` | DELETE | 删除文章 | 需登录 |

## 部署指南

### 方案一：免费云服务部署（推荐新手）

#### 第一步：将代码推送到 GitHub

```bash
# 在项目根目录
git init
git add .
git commit -m "Initial commit"

# 在 GitHub 创建新仓库后
git remote add origin https://github.com/你的用户名/personBlog.git
git push -u origin main
```

#### 第二步：部署数据库（Railway MySQL）

1. 访问 [railway.app](https://railway.app)，使用 GitHub 登录
2. 点击 **New Project** → **Provision MySQL**
3. 点击 MySQL 服务 → **Variables** 标签，复制以下信息：
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`
4. 点击 **Query** 标签，粘贴 `database/init.sql` 内容并执行

#### 第三步：部署后端（Railway）

1. 在同一 Railway 项目中，点击 **New** → **GitHub Repo**
2. 选择你的仓库，设置：
   - **Root Directory**: `back_end_of_blog`
3. 添加环境变量（Settings → Variables）：
   ```
   PORT=3001
   DB_HOST=（从 MySQL 服务复制）
   DB_PORT=（从 MySQL 服务复制）
   DB_USER=（从 MySQL 服务复制）
   DB_PASSWORD=（从 MySQL 服务复制）
   DB_NAME=（从 MySQL 服务复制）
   JWT_SECRET=your-super-secret-key-change-this
   JWT_EXPIRES_IN=7d
   ```
4. 点击 **Settings** → **Networking** → **Generate Domain** 获取后端 URL
   - 例如：`https://your-app.railway.app`

#### 第四步：部署前端（Vercel）

1. 访问 [vercel.com](https://vercel.com)，使用 GitHub 登录
2. 点击 **Add New** → **Project** → 导入你的仓库
3. 配置项目：
   - **Framework Preset**: Vite
   - **Root Directory**: `front_end_of_blog`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. 添加环境变量：
   ```
   VITE_API_BASE_URL=https://your-app.railway.app（上一步获取的后端 URL）
   ```
5. 点击 **Deploy**

部署完成后，Vercel 会给你一个前端 URL，如 `https://your-blog.vercel.app`

---

### 方案二：云服务器部署（更灵活）

适合需要完全控制的用户，如阿里云/腾讯云轻量应用服务器。

#### 第一步：准备云服务器

1. 购买云服务器（推荐 2核4G 配置）
2. 安装必要软件：
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install -y nodejs npm mysql-server nginx
   
   # 安装 Node.js 18+（如果版本过低）
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

#### 第二步：配置 MySQL

```bash
# 启动 MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation

# 登录并初始化数据库
sudo mysql -u root -p
```

```sql
-- 执行 init.sql 内容，然后创建专用用户
CREATE USER 'blog_user'@'localhost' IDENTIFIED BY '你的密码';
GRANT ALL PRIVILEGES ON blog_db.* TO 'blog_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 第三步：部署后端

```bash
# 上传代码到服务器（使用 scp 或 git clone）
cd /var/www
git clone https://github.com/你的用户名/personBlog.git
cd personBlog/back_end_of_blog

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
nano .env  # 编辑配置

# 使用 PM2 管理进程
npm install -g pm2
pm2 start app.js --name blog-api
pm2 save
pm2 startup
```

#### 第四步：配置 Nginx 反向代理

```bash
sudo nano /etc/nginx/sites-available/blog
```

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 或服务器 IP

    # 前端静态文件
    location / {
        root /var/www/personBlog/front_end_of_blog/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 上传文件访问
    location /uploads {
        proxy_pass http://localhost:3001;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 第五步：构建前端

```bash
cd /var/www/personBlog/front_end_of_blog

# 修改 API 地址（如果使用 Nginx 代理，可以用相对路径）
echo "VITE_API_BASE_URL=" > .env

# 构建
npm install
npm run build
```

#### 第六步：配置防火墙

```bash
# 开放 80 和 443 端口
sudo ufw allow 80
sudo ufw allow 443
```

同时在云服务器控制台的**安全组**中开放 80、443 端口。

---

### 配置 HTTPS（推荐）

使用 Let's Encrypt 免费证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### 部署后检查清单

- [ ] 数据库连接正常
- [ ] 后端 API 可访问：`https://你的域名/api/articles`
- [ ] 前端页面正常加载
- [ ] 管理员登录功能正常
- [ ] 文章发布和图片上传正常
- [ ] 手机端访问正常

## 响应式适配

- 桌面端：完整布局
- 平板/手机端：导航栏折叠为汉堡菜单，内容自适应宽度

## 设计风格

- 配色：黑白灰主色 + 低饱和蓝色强调色
- 字体：系统默认无衬线字体
- 布局：简约工整，无冗余元素

## 安全说明

当前版本为简化开发，密码以明文存储。生产环境建议：
1. 使用 bcrypt 加密密码
2. 配置 HTTPS
3. 设置更复杂的 JWT 密钥
4. 配置跨域白名单

## License

MIT
