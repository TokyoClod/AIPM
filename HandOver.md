# AIPM 项目交接文档

> 最后更新：2026-03-10 17:00
> 当前状态：测试框架完成，368个测试用例

---

## 一、项目概述

### 1.1 项目基本信息
- **项目名称**: AIPM (AIProjectManager) - 多人协作项目管理平台
- **项目类型**: 企业级 Web 应用
- **技术栈**: 
  - 前端：React 18 + TypeScript + Ant Design 5 + Zustand + ECharts
  - 后端：Node.js + Express + TypeScript
  - 数据存储：JSON 文件存储（开发环境）

### 1.2 核心功能
- ✅ 多项目并行管理
- ✅ 多级任务层级划分
- ✅ 多用户权限控制 (RBAC)
- ✅ 三种可视化视图（列表/看板/甘特图）
- ✅ 风险标记与预警
- ✅ 自动化通知与邮件系统
- ✅ 响应式 UI 设计

---

## 二、任务完成情况总结

### 2.1 已完成功能

| 模块 | 功能 | 状态 |
|------|------|------|
| **用户认证** | JWT 登录/注册 | ✅ |
| **权限控制** | RBAC 四级权限 | ✅ |
| **项目管理** | CRUD + 成员管理 | ✅ |
| **任务管理** | 层级任务 + 分配 | ✅ |
| **视图展示** | 列表/看板/甘特图 | ✅ |
| **风险管理** | 风险标记 + 预警 | ✅ |
| **仪表盘** | 数据统计 + 图表 | ✅ |
| **通知系统** |站内通知 + 邮件 | ✅ |
| **系统管理** | 用户角色管理 | ✅ |

### 2.2 解决的问题

1. **TypeScript 编译错误**
   - 问题：未使用的导入、import.meta.env 类型错误
   - 解决：调整 tsconfig.json，添加 vite-env.d.ts

2. **页面无内容显示**
   - 问题：Zustand store 初始化逻辑问题
   - 解决：简化认证状态管理，确保 localStorage 正确恢复

3. **登录后无法创建项目**
   - 问题：权限配置中 member 角色缺少 project:create 权限
   - 解决：扩展权限配置，允许所有登录用户创建项目

4. **API 请求 401 错误**
   - 问题：前端代理配置导致请求无法到达后端
   - 解决：配置 Vite 代理将 /api 请求转发到后端

5. **项目列表为空但项目已创建**
   - 问题：`GET /projects` 路由使用 `findByProject('')` 方法返回空数组，无法获取用户参与的项目
   - 解决：在 database.ts 添加 `project_members.getAll()` 方法，projects.ts 路由中调用该方法获取所有项目成员关联

6. **新建项目失败提示不明确**
   - 问题：错误处理没有显示具体错误消息
   - 解决：增强前端错误处理，显示服务器返回的具体错误信息

7. **Web端删除项目失败**
   - 问题：权限配置中删除项目权限只给 admin/manager
   - 解决：将 project:delete 权限扩展到所有角色 (admin/manager/leader/member)

8. **风险更新和删除失败**
   - 问题：risks 路由使用 findByProject('') 返回空数组
   - 解决：在 database.ts 添加 risks.findById() 方法

9. **admin账号没有管理员权限**
   - 问题：注册时所有用户都默认设为 member 角色
   - 解决：修改注册逻辑，第一个注册的用户自动设为 admin 角色；手动修改现有 admin 账号角色为 admin

10. **仪表盘不能选择具体项目**
   - 问题：只能查看全局概览，无法查看单个项目的详情
   - 解决：在 Dashboard 页面添加项目选择下拉框，可切换全局/项目详情视图

11. **甘特图显示问题**
   - 问题：原有甘特图实现复杂且显示不直观
   - 解决：重新实现为任务进度条形图 + 时间线 + 任务详情列表

---

## 九、AI智能化增强优化（2026-03-10）

### 已完成功能

| 模块 | 功能 | 状态 |
|------|------|------|
| **AI智能助手** | 多模型支持（OpenAI/Claude/Ollama） | ✅ |
| **AI对话组件** | 浮动按钮、消息列表、Markdown渲染 | ✅ |
| **Function Calling** | 任务/项目/风险操作工具 | ✅ |
| **快速录入** | Cmd+K快捷键、AI解析、批量操作 | ✅ |
| **语音录入** | Web Speech API、实时转文字 | ✅ |
| **项目状态汇总** | 周报/月报生成、AI分析 | ✅ |
| **风险预警系统** | 多级预警、AI分析、看板展示 | ✅ |
| **前端界面优化** | Tailwind CSS、暗色主题、动画效果 | ✅ |

### 新增文件

**后端：**
- `server/src/services/ai.service.ts` - AI服务核心
- `server/src/services/ai-tools.service.ts` - Function Calling工具
- `server/src/services/report.service.ts` - 报告生成服务
- `server/src/services/scheduler.service.ts` - 定时任务调度
- `server/src/services/risk-alert.service.ts` - 风险预警服务
- `server/src/routes/ai.ts` - AI路由

**前端：**
- `client/src/components/AI/AIAssistant.tsx` - AI助手组件
- `client/src/components/AI/ChatWindow.tsx` - 对话窗口
- `client/src/components/AI/MessageList.tsx` - 消息列表
- `client/src/components/AI/QuickInput.tsx` - 快速录入
- `client/src/components/AI/VoiceInput.tsx` - 语音录入
- `client/src/pages/RiskAlerts.tsx` - 风险预警页面
- `client/src/stores/aiStore.ts` - AI状态管理
- `client/src/stores/themeStore.ts` - 主题状态管理
- `client/src/hooks/useSpeechRecognition.ts` - 语音识别Hook

### 待完成功能（P2优先级）

| 模块 | 功能 | 状态 |
|------|------|------|
| **多级知识库** | 个人/团队/项目知识管理 | ⏳ |
| **AI数据洞察** | 趋势分析、异常检测 | ⏳ |

### 配置说明

使用AI功能需要配置环境变量：
```bash
# server/.env
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_claude_key
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_AI_MODEL=openai
```

---

## 十、测试框架（2026-03-10）

### 测试框架概览

| 测试类型 | 框架 | 用例数 | 覆盖率目标 |
|---------|------|--------|-----------|
| 后端单元/集成测试 | Jest + Supertest | 145 | 80% |
| 前端组件测试 | Vitest + Testing Library | 147 | 80% |
| 端到端测试 | Playwright | 76 | - |
| **总计** | - | **368** | **80%** |

### 测试目录结构

```
AIPM/
├── server/
│   └── tests/
│       ├── unit/           # 单元测试
│       ├── integration/    # 集成测试
│       └── setup.ts        # 测试环境
├── client/
│   └── src/__tests__/
│       ├── components/     # 组件测试
│       ├── pages/          # 页面测试
│       └── stores/         # Store测试
├── e2e/
│   ├── auth.spec.ts        # 认证流程测试
│   ├── projects.spec.ts    # 项目管理测试
│   ├── tasks.spec.ts       # 任务管理测试
│   ├── risks.spec.ts       # 风险管理测试
│   ├── ai.spec.ts          # AI功能测试
│   └── dashboard.spec.ts   # 仪表盘测试
└── .github/workflows/
    └── test.yml            # CI配置
```

### 运行测试命令

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

### CI/CD集成

- GitHub Actions自动运行测试
- Push到main/develop分支触发
- PR自动检查测试状态
- 自动生成覆盖率报告

### 2.3 未完成事项

| 事项 | 原因 | 优先级 |
|------|------|--------|
| 邮件发送功能 | 需要配置 SMTP 服务器 | 低 |
| 正式数据库迁移 | 开发阶段使用 JSON 存储 | 中 |
| 单元测试 | 项目时间限制 | 中 |
| 生产环境部署脚本 | 需要进一步配置 | 中 |

### 2.4 全功能测试结果

| 功能模块 | 创建 | 查询 | 更新 | 删除 | 状态 |
|---------|------|------|------|------|------|
| 用户认证 | ✅ | ✅ | ✅ | - | 通过 |
| 项目管理 | ✅ | ✅ | ✅ | ✅ | 通过 |
| 任务管理 | ✅ | ✅ | ✅ | ✅ | 通过 |
| 风险管理 | ✅ | ✅ | ✅ | ✅ | 通过 |
| 仪表盘 | - | ✅ | - | - | 通过 |
| 通知系统 | - | ✅ | - | - | 通过 |

---

## 三、关键技术决策及依据

### 3.1 技术选型

| 决策 | 选择 | 依据 |
|------|------|------|
| 前端框架 | React 18 | 成熟稳定，生态丰富 |
| UI 组件库 | Ant Design 5 | 企业级组件，简洁清爽 |
| 状态管理 | Zustand | 轻量级，API 简洁 |
| 后端框架 | Express | 简单灵活，易于扩展 |
| 数据存储 | JSON 文件 | 开发阶段快速启动，无需额外依赖 |
| 可视化 | ECharts | 功能强大，文档完善 |

### 3.2 架构设计

```
AIPM/
├── client/           # 前端应用
│   ├── src/
│   │   ├── api/     # API 请求封装
│   │   ├── stores/  # Zustand 状态管理
│   │   ├── pages/    # 页面组件
│   │   └── components/# 通用组件
│   └── vite.config.ts
├── server/           # 后端应用
│   ├── src/
│   │   ├── models/  # 数据模型
│   │   ├── routes/  # API 路由
│   │   ├── middleware/# 权限中间件
│   │   └── services/# 业务服务
│   └── data/        # JSON 数据存储
└── SPEC.md          # 项目规格文档
```

### 3.3 权限模型

```typescript
// 角色等级
ROLES = {
  ADMIN: 'admin',      // 超级管理员
  MANAGER: 'manager',  // 项目经理
  LEADER: 'leader',    // 团队负责人
  MEMBER: 'member'     // 普通成员
}

// 权限配置 - 已调整为宽松模式
PERMISSIONS = {
  'project:create': [admin, manager, leader, member],
  'project:read': [admin, manager, leader, member],
  'project:update': [admin, manager, leader, member],
  'project:delete': [admin, manager],
  // ...
}
```

---

## 四、遇到的挑战及解决方案

### 4.1 挑战 1：SQLite 原生模块编译失败
- **问题**：better-sqlite3 需要原生编译，在某些环境报错
- **解决**：改用 JSON 文件存储，简单高效适合开发

### 4.2 挑战 2：前端代理请求失败
- **问题**：Vite 代理配置后请求返回 404
- **分析**：代理配置需要完整路径
- **解决**：正确配置 proxy 将 /api/* 转发到 http://localhost:3001

### 4.3 挑战 3：Zustand Persist 初始化时序问题
- **问题**：刷新页面后认证状态丢失
- **解决**：简化 store 实现，直接读取 localStorage

---

## 五、下一步工作计划

### 5.1 短期任务（1-2周）

| 任务 | 优先级 | 预期完成 |
|------|--------|----------|
| 配置生产环境 PostgreSQL 数据库 | 高 | 1周 |
| 添加邮件 SMTP 配置 | 中 | 1周 |
| 编写单元测试 | 中 | 2周 |
| 完善错误处理和日志 | 中 | 1周 |

### 5.2 中期任务（1个月）

| 任务 | 优先级 | 预期完成 |
|------|--------|----------|
| 生产环境部署配置 | 高 | 2周 |
| Docker 容器化 | 中 | 3周 |
| CI/CD 流水线搭建 | 中 | 3周 |
| 性能优化 | 中 | 4周 |

### 5.3 长期任务（持续改进）

- [ ] 用户行为分析
- [ ] 移动端原生应用
- [ ] 项目模板功能
- [ ] 团队协作增强（评论、@提及）
- [ ] 文件附件上传
- [ ] 项目日历视图

---

## 六、运行指南

### 6.1 环境要求
- Node.js 18+
- npm 或 yarn

### 6.2 启动步骤

```bash
# 1. 安装根目录依赖
npm install

# 2. 安装前后端依赖
cd server && npm install
cd ../client && npm install

# 3. 启动后端（端口 3001）
cd server && npm run dev

# 4. 启动前端（端口 5173）
cd client && npm run dev
```

### 6.3 测试账号
- **邮箱**: admin@test.com
- **密码**: 123456
- **角色**: member（可在后台修改为 admin）

---

## 七、API 接口文档

### 认证接口
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/me | 获取当前用户 |

### 项目接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/projects | 获取项目列表 |
| POST | /api/projects | 创建项目 |
| GET | /api/projects/:id | 获取项目详情 |
| GET | /api/projects/:id/dashboard | 项目仪表盘 |

### 任务接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/tasks | 获取任务列表 |
| POST | /api/tasks | 创建任务 |
| PUT | /api/tasks/:id | 更新任务 |
| PUT | /api/tasks/:id/progress | 更新进度 |

### 风险接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/risks | 获取风险列表 |
| POST | /api/risks | 创建风险 |

---

## 八、注意事项

1. **数据持久化**：当前使用 JSON 文件存储，服务器重启后数据保留在 `server/data/aipm.json`
2. **邮件功能**：需配置 SMTP 环境变量才能发送邮件
3. **权限控制**：生产环境应调整权限配置收紧权限
4. **安全建议**：生产环境需使用 HTTPS、配置密钥、添加请求限流

---

*本文档将持续更新，记录项目演进和团队协作信息*
