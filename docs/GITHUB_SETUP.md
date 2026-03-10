# GitHub仓库创建指南

## 方法一：使用GitHub CLI（推荐）

### 1. 登录GitHub CLI

```bash
# 登录GitHub账号
gh auth login

# 按提示选择：
# ? What account do you want to log into? GitHub.com
# ? What is your preferred protocol for Git operations? HTTPS
# ? Authenticate Git with your GitHub token? Yes
# ? How would you like to authenticate GitHub CLI? Login with a web browser
```

### 2. 创建仓库并推送

```bash
# 进入项目目录
cd /Users/abner/Documents/trae_projects/AIPM

# 创建GitHub仓库（公开仓库）
gh repo create aipm --public --source=. --remote=origin --push

# 或创建私有仓库
gh repo create aipm --private --source=. --remote=origin --push
```

---

## 方法二：手动创建仓库

### 1. 在GitHub网站创建仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - Repository name: `aipm`
   - Description: `AI智能项目管理平台 - A modern AI-powered project management platform`
   - 选择 Public 或 Private
   - **不要**勾选 "Add a README file"（我们已有）
   - **不要**勾选 "Add .gitignore"（我们已有）
   - License: 选择 MIT（我们已有）
3. 点击 "Create repository"

### 2. 添加远程仓库并推送

```bash
# 进入项目目录
cd /Users/abner/Documents/trae_projects/AIPM

# 添加远程仓库（替换YOUR_USERNAME为您的GitHub用户名）
git remote add origin https://github.com/YOUR_USERNAME/aipm.git

# 推送到GitHub
git branch -M main
git push -u origin main
```

---

## 后续版本控制流程

### 日常开发流程

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 创建新分支开发功能
git checkout -b feature/new-feature

# 3. 提交更改
git add .
git commit -m "feat: 添加新功能"

# 4. 推送分支到远程
git push origin feature/new-feature

# 5. 在GitHub创建Pull Request合并代码
```

### 快速提交流程

```bash
# 添加所有更改
git add .

# 提交（使用约定式提交格式）
git commit -m "feat: 功能描述"
# 或
git commit -m "fix: 修复描述"
# 或
git commit -m "docs: 文档更新"

# 推送到远程
git push origin main
```

---

## 提交规范

使用约定式提交格式：

| 前缀 | 描述 |
|------|------|
| `feat:` | 新功能 |
| `fix:` | 修复bug |
| `docs:` | 文档更新 |
| `style:` | 代码格式（不影响功能） |
| `refactor:` | 重构 |
| `test:` | 测试相关 |
| `chore:` | 构建/工具/依赖 |

---

## 当前状态

✅ Git仓库已初始化
✅ 代码已提交到本地仓库
⏳ 等待推送到GitHub远程仓库

执行上述任一方法后，您的代码将被推送到GitHub！
