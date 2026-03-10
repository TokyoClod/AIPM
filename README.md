# AIPM - AI智能项目管理平台

<div align="center">

![AIPM Logo](docs/logo.png)

**现代化的AI驱动项目管理解决方案**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[在线演示](#) | [文档](#) | [问题反馈](https://github.com/your-repo/aipm/issues)

</div>

---

## 📖 项目概述

AIPM（AI Project Manager）是一个基于AI技术的现代化项目管理平台，旨在帮助团队更高效地管理项目、任务和风险。通过集成大语言模型（LLM），AIPM提供智能对话、自动任务创建、风险预警等AI增强功能，显著提升项目管理效率。

### 核心特性

- 🤖 **AI智能助手** - 集成OpenAI/Claude/Ollama，支持自然语言交互
- 📊 **多视图展示** - 列表、看板、甘特图三种视图
- 🎯 **任务管理** - 多级任务层级、进度跟踪、自动提醒
- ⚠️ **风险预警** - AI风险识别、多级预警、智能分析
- 📝 **快速录入** - 文本/语音双模式，AI自动解析
- 🌙 **现代UI** - 响应式设计、暗色主题、流畅动画
- 🔐 **权限控制** - RBAC四级权限体系
- 📈 **数据洞察** - 项目仪表盘、趋势分析、AI报告

---

## 🚀 功能特性

### AI智能功能

| 功能 | 描述 |
|------|------|
| AI对话助手 | 右下角浮动按钮，随时与AI交互 |
| 快速录入 | Cmd+K快捷键，AI自动解析创建任务 |
| 语音输入 | 支持语音转文字，解放双手 |
| 智能提醒 | 自动识别延期风险，主动推送提醒 |
| AI报告 | 自动生成周报/月报，AI分析建议 |

### 项目管理

- ✅ 多项目并行管理
- ✅ 项目成员与权限管理
- ✅ 项目仪表盘与统计
- ✅ 项目状态汇总报告

### 任务管理

- ✅ 多级任务层级（父子任务）
- ✅ 任务状态与进度跟踪
- ✅ 任务分配与评论
- ✅ 三种视图（列表/看板/甘特图）

### 风险管理

- ✅ 风险标记与级别评估
- ✅ 风险预警与通知
- ✅ AI风险分析与建议
- ✅ 风险缓解措施跟踪

---

## 🛠️ 技术栈

### 前端

- **框架**: React 18 + TypeScript
- **UI库**: Ant Design 5
- **状态管理**: Zustand
- **图表**: ECharts
- **样式**: Tailwind CSS
- **测试**: Vitest + Testing Library + Playwright

### 后端

- **运行时**: Node.js 18+
- **框架**: Express + TypeScript
- **AI集成**: OpenAI API / Claude API / Ollama
- **认证**: JWT
- **测试**: Jest + Supertest

### 数据存储

- **开发环境**: JSON文件存储
- **生产环境**: PostgreSQL（推荐）

---

## 📦 安装步骤

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 yarn >= 1.22.0

### 克隆项目

```bash
git clone https://github.com/your-username/aipm.git
cd aipm
```

### 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd server && npm install

# 安装前端依赖
cd ../client && npm install
```

### 配置环境变量

创建 `server/.env` 文件：

```env
# 服务端口
PORT=3001

# JWT密钥
JWT_SECRET=your_jwt_secret_key_here

# AI服务配置（至少配置一个）
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_claude_api_key
OLLAMA_BASE_URL=http://localhost:11434

# 默认AI模型
DEFAULT_AI_MODEL=openai

# 邮件服务（可选）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

### 启动服务

```bash
# 启动后端服务（端口 3001）
cd server
npm run dev

# 新终端启动前端服务（端口 5173）
cd client
npm run dev
```

### 访问应用

打开浏览器访问 http://localhost:5173

**默认管理员账号**：
- 邮箱：admin@test.com
- 密码：123456

---

## 📖 使用方法

### 快速开始

1. **登录系统**：使用默认账号或注册新账号
2. **创建项目**：点击"新建项目"创建您的第一个项目
3. **添加任务**：在项目中创建任务，设置截止日期和优先级
4. **AI助手**：点击右下角AI按钮或按 `Cmd+K` 快速录入

### AI功能使用

#### AI对话助手
- 点击右下角浮动按钮打开AI助手
- 支持自然语言交互，如"创建一个任务：完成用户登录功能"
- AI会自动解析并创建相应任务

#### 快速录入
- 按 `Cmd+K` (Mac) 或 `Ctrl+K` (Windows) 打开快速录入
- 输入自然语言描述，AI自动解析
- 示例："明天下午3点开会讨论项目进度，需要张三参加"

#### 语音输入
- 在AI对话窗口点击麦克风按钮
- 说出任务内容，自动转换为文字
- AI解析后创建任务

### 项目管理流程

```
创建项目 → 添加成员 → 创建任务 → 分配任务 → 跟踪进度 → 风险管理 → 项目报告
```

---

## ⚙️ 配置说明

### AI模型配置

AIPM支持多种AI模型，可根据需求选择：

| 模型 | 配置项 | 特点 |
|------|--------|------|
| OpenAI GPT-4 | `OPENAI_API_KEY` | 功能强大，响应快 |
| Claude | `ANTHROPIC_API_KEY` | 安全可靠，长文本支持 |
| Ollama | `OLLAMA_BASE_URL` | 本地部署，数据安全 |

### 权限配置

系统支持四级权限：

| 角色 | 权限范围 |
|------|----------|
| admin | 系统管理员，全部权限 |
| manager | 项目经理，项目管理权限 |
| leader | 团队负责人，任务管理权限 |
| member | 普通成员，基础操作权限 |

### 数据库配置（生产环境）

推荐使用PostgreSQL：

```env
DATABASE_URL=postgresql://user:password@localhost:5432/aipm
```

---

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
npm run test:all

# 后端测试
cd server && npm test

# 前端测试
cd client && npm run test:run

# E2E测试
npm run test:e2e

# 生成覆盖率报告
npm run test:coverage
```

### 测试覆盖率

项目测试覆盖率目标为 **80%**，包含：
- 后端单元/集成测试：145个用例
- 前端组件测试：147个用例
- E2E测试：76个用例

---

## 📁 项目结构

```
AIPM/
├── client/                 # 前端应用
│   ├── src/
│   │   ├── api/           # API请求
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   ├── stores/        # 状态管理
│   │   └── __tests__/     # 测试文件
│   └── package.json
├── server/                 # 后端应用
│   ├── src/
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # API路由
│   │   ├── services/      # 业务服务
│   │   └── middleware/    # 中间件
│   ├── tests/             # 测试文件
│   └── package.json
├── e2e/                    # E2E测试
├── docs/                   # 文档
├── scripts/                # 脚本
├── .github/workflows/      # CI配置
├── HandOver.md             # 项目交接文档
└── README.md               # 项目说明
```

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范

- 使用 TypeScript 编写代码
- 遵循 ESLint 配置
- 编写单元测试
- 更新相关文档

### 提交规范

使用约定式提交：

- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具

---

## 📝 更新日志

### v1.0.0 (2026-03-10)

- ✨ 初始版本发布
- 🤖 AI智能助手集成
- 📊 项目管理核心功能
- 🎯 任务管理多视图
- ⚠️ 风险预警系统
- 🧪 完整测试框架

详见 [CHANGELOG.md](CHANGELOG.md)

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

感谢以下开源项目：

- [React](https://reactjs.org/)
- [Ant Design](https://ant.design/)
- [Express](https://expressjs.com/)
- [OpenAI](https://openai.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 📞 联系方式

- 项目主页：https://github.com/your-username/aipm
- 问题反馈：https://github.com/your-username/aipm/issues
- 邮箱：your-email@example.com

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给一个 Star ⭐**

Made with ❤️ by AIPM Team

</div>
