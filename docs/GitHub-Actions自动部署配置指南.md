# GitHub Actions 自动部署配置指南

本文档指导你完成 GitHub Actions 自动部署的配置，实现 `git push` 后自动更新服务器。

## 工作原理

```
本地修改代码 → git push → GitHub Actions 触发 → SSH 连接服务器 → 自动部署
```

## 配置步骤

### 第一步：在服务器上生成 SSH 密钥

登录你的腾讯云服务器：

```bash
ssh root@106.55.56.92
```

生成专用于 GitHub Actions 的 SSH 密钥：

```bash
# 生成密钥对（直接回车，不设置密码）
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions -N ""

# 将公钥添加到授权列表
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# 设置正确的权限
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 第二步：获取私钥内容

```bash
# 显示私钥内容（复制全部内容，包括 BEGIN 和 END 行）
cat ~/.ssh/github_actions
```

输出类似这样：

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...（很多行）...
QyQk9LUUtJQi1rZXkAAAAQZ2l0aHViLWFjdGlvbnMtZGVwbG95AQIDBA==
-----END OPENSSH PRIVATE KEY-----
```

**复制完整的私钥内容**（包括第一行和最后一行）。

### 第三步：在 GitHub 仓库添加 Secrets

1. 打开你的 GitHub 仓库：https://github.com/hyw-freeway/ai-of-blog
2. 点击 **Settings**（设置）
3. 左侧菜单找到 **Secrets and variables** → 点击 **Actions**
4. 点击 **New repository secret** 按钮

添加以下 3 个密钥：

| Name | Value | 说明 |
|------|-------|------|
| `SERVER_HOST` | `106.55.56.92` | 服务器 IP 地址 |
| `SERVER_USER` | `root` | SSH 用户名 |
| `SERVER_SSH_KEY` | （粘贴私钥内容） | 上一步复制的私钥 |

### 第四步：配置服务器 Git 仓库

确保服务器上的项目是通过 Git 克隆的，并且可以拉取更新：

```bash
cd /var/www/ai-of-blog

# 检查 Git 状态
git status

# 确保远程仓库配置正确
git remote -v

# 如果显示需要认证，可以配置 HTTPS 方式（不需要每次输入密码）
git config --global credential.helper store
```

### 第五步：测试自动部署

在本地修改任意文件并提交：

```bash
# 本地项目目录
git add .
git commit -m "测试自动部署"
git push
```

然后在 GitHub 仓库的 **Actions** 标签页查看部署进度。

---

## 查看部署日志

### GitHub 上查看

1. 进入仓库 → **Actions** 标签
2. 点击最新的工作流运行记录
3. 展开 **部署到腾讯云服务器** 步骤查看详细日志

### 服务器上查看

```bash
# 查看 PM2 日志
pm2 logs blog-api --lines 50

# 查看部署后的代码版本
cd /var/www/ai-of-blog && git log -1
```

---

## 常见问题

### Q1: 部署失败，提示 "Permission denied"

**原因**：SSH 密钥配置不正确

**解决**：
```bash
# 在服务器上检查
cat ~/.ssh/authorized_keys

# 确保包含 github_actions.pub 的内容
# 如果没有，重新执行：
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
```

### Q2: 部署失败，提示 "Host key verification failed"

**解决**：在 `deploy.yml` 中添加 `script_stop: true`：

```yaml
with:
  host: ${{ secrets.SERVER_HOST }}
  username: ${{ secrets.SERVER_USER }}
  key: ${{ secrets.SERVER_SSH_KEY }}
  script_stop: true
  script: |
    ...
```

### Q3: npm install 太慢

**解决**：服务器上配置 npm 镜像

```bash
npm config set registry https://registry.npmmirror.com
```

### Q4: 只想部署后端/前端

修改 `deploy.yml` 中的 `paths` 配置：

```yaml
on:
  push:
    branches:
      - main
    paths:
      # 只有这些文件变化才触发
      - 'back_end_of_blog/**'
      - 'front_end_of_blog/**'
```

### Q5: 手动触发部署

在 `deploy.yml` 中添加手动触发支持：

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:  # 添加这行，支持手动触发
```

然后在 GitHub Actions 页面点击 **Run workflow** 即可手动部署。

---

## 部署流程图

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions 部署流程                  │
│                                                             │
│  1. 开发者 git push                                         │
│           │                                                 │
│           ▼                                                 │
│  2. GitHub 检测到 main 分支更新                             │
│           │                                                 │
│           ▼                                                 │
│  3. 触发 Actions 工作流                                     │
│           │                                                 │
│           ▼                                                 │
│  4. 使用 SSH 密钥连接服务器                                 │
│           │                                                 │
│           ▼                                                 │
│  5. 在服务器上执行部署脚本                                  │
│      ├── git pull（拉取最新代码）                          │
│      ├── npm install（安装依赖）                           │
│      ├── npm run build（构建前端）                         │
│      └── pm2 restart（重启后端）                           │
│           │                                                 │
│           ▼                                                 │
│  6. 部署完成，网站自动更新                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 安全提示

1. **私钥保密**：`SERVER_SSH_KEY` 一旦泄露，攻击者可以登录你的服务器
2. **定期更换**：建议每 3-6 个月更换一次部署密钥
3. **最小权限**：生产环境建议创建专用部署用户，而不是使用 root

---

**配置完成后，你只需要 `git push`，1-3 分钟后网站就会自动更新！**
