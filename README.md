# 个人博客系统

一个简约高级风格的个人博客，前后端分离架构，支持多端访问。

**当前版本**: v2.0 (AI 增强版)

## 技术栈

- **前端**: React 19 + Vite + React Router + Axios + EasyMDE
- **后端**: Node.js + Express + JWT
- **数据库**: MySQL
- **AI 服务**: DeepSeek / 硅基流动 / 通义千问（可选配置）

## 项目结构

```
personBlog/
├── front_end_of_blog/          # 前端 React 项目
│   └── src/
│       ├── components/
│       │   └── AIToolbar.jsx   # AI 工具组件 (v2.0)
│       └── pages/
├── back_end_of_blog/           # 后端 Node.js 项目
│   ├── config/
│   │   └── ai.js              # AI 配置 (v2.0)
│   ├── services/
│   │   └── aiService.js       # AI 服务层 (v2.0)
│   └── routes/
│       └── ai.js              # AI API 路由 (v2.0)
├── database/
│   ├── init.sql               # 数据库初始化脚本
│   └── migrate_ai_fields.sql  # AI 字段迁移脚本 (v2.0)
└── README.md
```

## 功能特性

### 访客权限
- 浏览所有已发布的文章列表
- 查看单篇文章详情
- 查看 AI 生成的文章摘要
- 使用智能语义搜索

### 管理员权限
- 管理员登录（账号密码验证）
- 发布新文章（支持 Markdown 编辑）
- 编辑/删除自己发布的文章
- AI 自动生成文章标签
- AI 语法纠错

### AI 增强功能 (v2.0 新增)

| 功能 | 说明 | 触发方式 |
|------|------|----------|
| **AI 文章摘要** | 自动生成 80-100 字精简摘要 | 首次打开文章时流式生成，支持重新生成 |
| **AI 标签生成** | 提取 3-5 个关键词标签 | 发布时自动生成（若未填写），或手动点击按钮预览 |
| **AI 语法纠错** | 修正中文错别字和语法问题 | 编辑页面点击「AI 纠错」按钮 |
| **智能语义搜索** | 基于向量嵌入的语义匹配 | 首页切换到「智能搜索」模式 |

**特色功能**：
- 摘要生成支持**流式输出**，实时显示 AI 生成过程
- 发布文章时若**未填写标签**，AI 会自动生成
- 语义搜索可匹配意思相近的文章（如搜「性能优化」匹配「缓存技巧」）

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

### 基础接口

| 接口 | 方法 | 功能 | 权限 |
|------|------|------|------|
| `/api/articles` | GET | 获取文章列表 | 公开 |
| `/api/articles?semantic=true&keyword=xxx` | GET | 语义搜索 | 公开 |
| `/api/articles/:id` | GET | 获取文章详情 | 公开 |
| `/api/auth/login` | POST | 管理员登录 | 公开 |
| `/api/articles` | POST | 发布文章（自动生成标签） | 需登录 |
| `/api/articles/:id` | PUT | 编辑文章 | 需登录 |
| `/api/articles/:id` | DELETE | 删除文章 | 需登录 |

### AI 接口 (v2.0)

| 接口 | 方法 | 功能 | 权限 |
|------|------|------|------|
| `/api/ai/summary` | POST | 生成文章摘要 | 公开 |
| `/api/ai/summary/stream/:articleId` | GET | 流式生成摘要 (SSE) | 公开 |
| `/api/ai/summary/stream/:articleId?regenerate=true` | GET | 重新生成摘要 | 公开 |
| `/api/ai/tags` | POST | 生成文章标签 | 需登录 |
| `/api/ai/proofread` | POST | 语法纠错 | 需登录 |
| `/api/ai/embedding` | POST | 生成文章向量 | 需登录 |

## AI 功能配置

### 1. 获取 API Key

推荐使用以下 AI 服务（任选其一）：

| 服务商 | 费用 | 优势 |
|--------|------|------|
| [DeepSeek](https://platform.deepseek.com) | 约 0.001 元/千 tokens | 价格极低，中文效果好 |
| [硅基流动](https://siliconflow.cn) | 有免费额度 | 支持多种开源模型 |
| [通义千问](https://dashscope.aliyun.com) | 有免费额度 | 阿里云服务，稳定可靠 |

### 2. 配置环境变量

在 `back_end_of_blog/.env` 中添加：

```env
# AI 配置（以 DeepSeek 为例）
AI_PROVIDER=deepseek
AI_API_KEY=sk-your-api-key
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat

# Embedding 配置（语义搜索用，推荐硅基流动）
EMBEDDING_API_KEY=sk-your-embedding-api-key
EMBEDDING_BASE_URL=https://api.siliconflow.cn/v1
EMBEDDING_MODEL=BAAI/bge-m3
```

### 3. 数据库迁移（已有数据库）

如果已有数据库，执行迁移脚本添加 AI 字段：

```bash
mysql -u root -p blog_db < database/migrate_ai_fields.sql
```

## 部署指南

### 当前部署架构

本项目采用免费云服务部署，各组件分工如下：

| 组件 | 服务商 | 说明 |
|------|--------|------|
| **数据库** | [TiDB Cloud](https://tidbcloud.com) | MySQL 兼容的云数据库，Serverless 免费版 |
| **后端 API** | [Render](https://render.com) | Node.js 应用托管，免费版 |
| **前端** | [Vercel](https://vercel.com) | 静态网站托管，免费版 |

### 自动部署机制

项目已配置 GitHub 集成，代码推送后会**自动部署**：

- **修改后端代码** → 推送到 GitHub → **Render 自动重新部署**（约 2-3 分钟）
- **修改前端代码** → 推送到 GitHub → **Vercel 自动重新部署**（约 1-2 分钟）

```bash
# 修改代码后，只需执行：
git add .
git commit -m "你的修改说明"
git push

# Render 和 Vercel 会自动检测到更新并重新部署
```

### 注意事项

1. **Render 免费版休眠机制**：服务在 15 分钟无访问后会休眠，首次访问需等待约 30 秒唤醒
2. **TiDB Cloud 需要 SSL 连接**：后端已配置 `DB_SSL=true` 环境变量
3. **环境变量管理**：敏感信息（数据库密码、JWT 密钥）存储在各平台的环境变量中，不提交到代码仓库

---

### 方案一：免费云服务部署（TiDB + Render + Vercel）

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

#### 第二步：部署数据库（TiDB Cloud）

1. 访问 [tidbcloud.com](https://tidbcloud.com)，注册并登录
2. 创建 **Serverless Cluster**（免费）
3. 选择区域（推荐 Singapore 或 Tokyo）
4. 设置数据库密码并记住
5. 创建完成后，使用 **SQL Editor** 执行 `database/init.sql` 初始化数据库
6. 在 **Connect** 页面获取连接信息：Host、Port、User、Password

#### 第三步：部署后端（Render）

1. 访问 [render.com](https://render.com)，使用 GitHub 登录
2. 点击 **New** → **Web Service** → 连接你的仓库
3. 配置项目：
   - **Name**: `your-blog-api`
   - **Root Directory**: `back_end_of_blog`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. 添加环境变量：
   ```
   PORT=3001
   DB_HOST=（TiDB 提供的 Host）
   DB_PORT=4000
   DB_USER=（TiDB 提供的 User）
   DB_PASSWORD=（你设置的密码）
   DB_NAME=blog_db
   DB_SSL=true
   JWT_SECRET=your-super-secret-key
   JWT_EXPIRES_IN=7d
   ```
5. 点击 **Create Web Service**，等待部署完成
6. 记录生成的后端 URL，如 `https://your-blog-api.onrender.com`

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
   VITE_API_BASE_URL=https://your-blog-api.onrender.com（上一步的后端 URL）
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

## 版本历史

### v2.0 - AI 增强版 (2025-02)

**新增功能：**
- ✨ AI 文章摘要：流式生成，支持重新生成
- ✨ AI 标签生成：发布时自动生成，或手动预览
- ✨ AI 语法纠错：一键修正错别字和语法问题
- ✨ 智能语义搜索：基于向量嵌入的相似度匹配

**技术更新：**
- 新增 AI 服务层 (`aiService.js`)
- 支持 DeepSeek / 硅基流动 / 通义千问 多种 AI 提供商
- SSE 流式响应支持
- 向量嵌入存储与检索

### v1.0 - 基础版

- 文章 CRUD 功能
- 管理员登录认证
- Markdown 编辑器
- 图片/文件上传
- 响应式布局

## License

MIT
