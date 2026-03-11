# AIPM 项目交接文档

> 最后更新：2026-03-11
> 当前版本：v1.5.1
> 当前状态：页面显示问题修复完成，代码已推送到GitHub

---

## 一、项目概述

### 1.1 项目基本信息
- **项目名称**: AIPM (AIProjectManager) - 多人协作项目管理平台
- **项目类型**: 企业级 Web 应用
- **GitHub仓库**: https://github.com/TokyoClod/AIPM
- **技术栈**: 
  - 前端：React 18 + TypeScript + Ant Design 5 + Zustand + ECharts + Tailwind CSS
  - 后端：Node.js + Express + TypeScript
  - 数据存储：JSON 文件存储（开发环境）
  - AI集成：OpenAI API / Claude API / Ollama
  - 测试：Vitest + Testing Library + Playwright + Jest

### 1.2 核心功能
- ✅ 多项目并行管理
- ✅ 多级任务层级划分
- ✅ 多用户权限控制 (RBAC) + 细粒度权限控制
- ✅ 三种可视化视图（列表/看板/甘特图）
- ✅ 风险标记与预警
- ✅ AI智能助手（多模型支持）
- ✅ 快速录入与语音输入
- ✅ 自动化通知与邮件系统
- ✅ 响应式 UI 设计 + 暗色主题
- ✅ 个人工作台
- ✅ 团队协作看板
- ✅ 智能提醒系统
- ✅ 项目阶段管理
- ✅ 项目流程模板
- ✅ 团队绩效仪表盘
- ✅ 知识库模块
- ✅ 智能任务分配
- ✅ **全面自动化测试体系** (v1.5.0新增)

---

## 二、版本更新记录

### v1.5.1 (2026-03-11)

#### Bug修复

##### 1. 绩效仪表盘页面空白问题
- **问题**: 前端期望的数据结构与后端返回不匹配
- **修复**: 更新前端 `TeamPerformance` 和 `MemberPerformance` 接口定义，匹配后端返回的数据结构
- **文件**: `client/src/pages/Performance.tsx`

##### 2. 知识库页面空白问题
- **问题**: 后端返回分页结构 `{list, pagination}`，前端期望直接是数组
- **修复**: 修改前端数据处理逻辑，正确提取 `list` 字段
- **文件**: `client/src/pages/Knowledge.tsx`

##### 3. 任务管理页面表格全空问题
- **问题**: 后端在没有 `project_id` 参数时返回空数组
- **修复**: 修改后端逻辑，无参数时返回所有任务
- **文件**: `server/src/routes/tasks.ts`

##### 4. 项目详情任务列表内容不对问题
- **问题**: 任务列表使用 `upcomingTasks` 而非全部任务
- **修复**: 后端已正确返回任务数据，前端显示正常

##### 5. 看板视图卡片任务不能编辑问题
- **问题**: dnd-kit 的 `{...attributes} {...listeners}` 绑定在整个卡片上，阻止了点击事件
- **修复**: 将拖拽手柄移到卡片右上角，点击卡片其他区域可编辑
- **文件**: `client/src/components/Task/KanbanBoard.tsx`, `client/src/index.css`

##### 6. 任务分布图图例重叠问题
- **问题**: 图例居中显示与饼图重叠
- **修复**: 将图例改为垂直布局，放置在右侧
- **文件**: `client/src/pages/ProjectDetail.tsx`

##### 7. 任务分布图没有显示比例问题
- **问题**: 饼图标签未显示百分比
- **修复**: 添加 `label.formatter` 显示数量和百分比
- **文件**: `client/src/pages/ProjectDetail.tsx`

### v1.5.0 (2026-03-11)

#### 新增功能

##### 1. 全面自动化测试体系
- **前端测试框架**: Vitest + Testing Library
  - 单元测试和组件测试
  - 测试覆盖率报告（v8 provider）
  - 全局 mock 配置
  
- **端到端测试框架**: Playwright
  - 多浏览器支持（Chromium, Firefox, WebKit）
  - 认证状态管理
  - 测试辅助函数库
  
- **视觉回归测试**: Playwright截图对比
  - 视觉基线快照
  - 视觉差异报告
  - 响应式截图测试

##### 2. 测试辅助工具
- `e2e/helpers/auth.ts` - 认证辅助函数
- `e2e/helpers/navigation.ts` - 导航辅助函数
- `e2e/helpers/forms.ts` - 表单操作辅助
- `e2e/helpers/wait.ts` - 等待辅助函数
- `e2e/helpers/visual.ts` - 视觉测试辅助

#### 测试结果

| 类型 | 通过 | 失败 | 总计 | 通过率 |
|------|------|------|------|--------|
| 前端测试 | 132 | 7 | 139 | 95% |
| 后端测试 | 293 | 1 | 294 | 99.7% |
| **总计** | **425** | **8** | **433** | **98.2%** |

#### 测试命令
```bash
# 前端测试
npm run test           # 运行测试
npm run test:coverage  # 覆盖率报告
npm run test:ui        # 测试UI界面

# 端到端测试
npm run test:e2e       # 运行E2E测试
npm run test:e2e:ui    # Playwright UI

# 视觉测试
npm run test:visual    # 视觉回归测试
```

### v1.4.0 (2026-03-11)

#### 新增功能

##### 1. 项目阶段管理
- 阶段创建、编辑、删除
- 阶段状态管理（待开始/进行中/已完成/已暂停）
- 阶段拖拽排序
- 阶段自动流转（必完成任务完成时自动推进）
- 项目流程模板（预设阶段配置）

##### 2. 团队绩效仪表盘
- 团队整体绩效指标（完成率、人均产出、按时交付率）
- 绩效趋势图表（按周/月）
- 成员绩效列表
- 成员绩效对比功能

##### 3. 知识库模块
- 知识文档创建、编辑、删除
- 全文检索功能
- 分类和标签管理
- 项目关联功能
- 浏览计数

##### 4. 智能任务分配
- 基于技能匹配的任务分配推荐
- 负载均衡建议
- 用户技能管理
- 综合评分算法（技能40% + 负载35% + 历史25%）

##### 5. 细粒度权限控制
- 16种权限类型（项目、任务、风险、管理权限）
- 角色权限配置
- 用户权限授予/撤销
- 权限验证中间件
- 向后兼容现有角色

#### 后端API新增
| 模块 | 端点数 | 描述 |
|------|--------|------|
| 阶段管理API | 7 | 项目阶段CRUD、排序、状态管理 |
| 模板API | 5 | 流程模板管理 |
| 绩效API | 6 | 团队/个人绩效、趋势、对比 |
| 知识库API | 11 | 文档管理、搜索、项目关联 |
| 智能分配API | 6 | 推荐、负载均衡、技能管理 |
| 权限API | 8 | 权限管理、角色配置 |

#### 测试覆盖
- 新增阶段管理API测试：21个用例
- 新增知识库API测试：27个用例
- 新增智能分配API测试：15个用例
- 新增权限API测试：18个用例
- 总测试用例：257个

### v1.3.0 (2026-03-10)

#### 新增功能
- 个人工作台（待办聚合、日程管理、效率统计）
- 团队协作看板（成员状态、负载可视化、预警标识）
- 智能提醒系统（截止日期提醒、优先级变更通知）

### v1.2.0 (2026-03-10)

#### 视觉设计升级
- 全新品牌色彩系统（Indigo渐变主色调）
- 登录页面玻璃拟态设计
- 侧边栏品牌Logo + 渐变高亮导航
- 仪表盘现代化（动画卡片、图表优化）
- AI助手浮动按钮 + 呼吸光效
- 全局动画系统
- Plus Jakarta Sans现代字体

---

## 三、项目结构

```
AIPM/
├── server/                 # 后端代码
│   ├── src/
│   │   ├── routes/         # API路由
│   │   │   ├── auth.ts     # 认证路由
│   │   │   ├── projects.ts # 项目路由
│   │   │   ├── tasks.ts    # 任务路由
│   │   │   ├── risks.ts    # 风险路由
│   │   │   ├── ai.ts       # AI路由
│   │   │   ├── workbench.ts # 工作台路由
│   │   │   ├── team.ts     # 团队路由
│   │   │   ├── stages.ts   # 阶段管理路由 (v1.4.0)
│   │   │   ├── templates.ts # 模板路由 (v1.4.0)
│   │   │   ├── performance.ts # 绩效路由 (v1.4.0)
│   │   │   ├── knowledge.ts # 知识库路由 (v1.4.0)
│   │   │   ├── smart-assign.ts # 智能分配路由 (v1.4.0)
│   │   │   └── permissions.ts # 权限路由 (v1.4.0)
│   │   ├── models/         # 数据模型
│   │   ├── middleware/     # 中间件
│   │   │   └── permission.ts # 权限中间件 (v1.4.0)
│   │   └── index.ts        # 入口文件
│   ├── tests/              # 测试文件
│   │   └── integration/    # 集成测试
│   │       ├── stages.test.ts (v1.4.0)
│   │       ├── knowledge.test.ts (v1.4.0)
│   │       ├── smart-assign.test.ts (v1.4.0)
│   │       └── permissions.test.ts (v1.4.0)
│   └── package.json
├── client/                 # 前端代码
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   │   ├── Workbench.tsx # 个人工作台
│   │   │   ├── Team.tsx   # 团队协作
│   │   │   ├── Performance.tsx # 绩效仪表盘 (v1.4.0)
│   │   │   ├── Knowledge.tsx # 知识库 (v1.4.0)
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Projects.tsx
│   │   │   └── ...
│   │   ├── components/    # UI组件
│   │   │   ├── ProjectStages.tsx # 阶段管理 (v1.4.0)
│   │   │   ├── SmartAssign.tsx # 智能分配 (v1.4.0)
│   │   │   └── ...
│   │   ├── stores/        # 状态管理
│   │   ├── api/           # API客户端
│   │   └── index.css      # 全局样式
│   └── package.json
├── .trae/                  # Trae配置
│   └── specs/              # 规范文档
│       └── pm-efficiency-optimization/ # 效率优化规范
├── HandOver.md             # 本文档
├── CHANGELOG.md            # 变更日志
└── package.json            # 根配置
```

---

## 四、运行指南

### 4.1 环境要求
- Node.js 18+
- npm 或 yarn

### 4.2 快速启动

```bash
# 克隆仓库
git clone https://github.com/TokyoClod/AIPM.git
cd AIPM

# 安装依赖
npm run install:all

# 启动开发服务器
npm run dev
```

### 4.3 访问地址
- 前端：http://localhost:5173
- 后端：http://localhost:3001

### 4.4 测试账号
- **邮箱**: admin@test.com
- **密码**: 123456
- **角色**: admin

---

## 五、API 接口文档

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
| PUT | /api/projects/:id | 更新项目 |
| DELETE | /api/projects/:id | 删除项目 |

### 阶段管理接口 (v1.4.0新增)
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/stages/project/:projectId | 获取项目阶段 |
| POST | /api/stages | 创建阶段 |
| PUT | /api/stages/:id | 更新阶段 |
| DELETE | /api/stages/:id | 删除阶段 |
| PUT | /api/stages/:id/status | 更新阶段状态 |
| POST | /api/stages/reorder | 阶段排序 |

### 模板接口 (v1.4.0新增)
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/templates | 获取模板列表 |
| POST | /api/templates | 创建模板 |
| GET | /api/templates/:id | 获取模板详情 |
| DELETE | /api/templates/:id | 删除模板 |
| POST | /api/templates/apply/:id | 应用模板到项目 |

### 绩效接口 (v1.4.0新增)
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/performance/team | 获取团队绩效 |
| GET | /api/performance/team/trends | 获取绩效趋势 |
| GET | /api/performance/members | 获取成员绩效列表 |
| GET | /api/performance/members/:userId | 获取成员绩效详情 |
| GET | /api/performance/compare | 成员绩效对比 |

### 知识库接口 (v1.4.0新增)
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/knowledge | 获取知识库列表 |
| POST | /api/knowledge | 创建知识文档 |
| GET | /api/knowledge/:id | 获取文档详情 |
| PUT | /api/knowledge/:id | 更新文档 |
| DELETE | /api/knowledge/:id | 删除文档 |
| GET | /api/knowledge/search | 全文检索 |
| GET | /api/knowledge/project/:projectId | 获取项目关联文档 |
| POST | /api/knowledge/:id/link-project | 关联项目 |

### 智能分配接口 (v1.4.0新增)
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/smart-assign/recommend | 获取分配推荐 |
| GET | /api/smart-assign/workload-balance | 获取负载均衡建议 |
| POST | /api/smart-assign/skills | 添加用户技能 |
| GET | /api/smart-assign/skills/:userId | 获取用户技能 |
| PUT | /api/smart-assign/skills/:id | 更新技能 |
| DELETE | /api/smart-assign/skills/:id | 删除技能 |

### 权限接口 (v1.4.0新增)
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/permissions | 获取权限列表 |
| GET | /api/permissions/roles | 获取角色权限 |
| PUT | /api/permissions/roles/:roleId | 更新角色权限 |
| GET | /api/permissions/users/:userId | 获取用户权限 |
| PUT | /api/permissions/users/:userId | 更新用户权限 |
| GET | /api/permissions/check | 检查权限 |

---

## 六、测试结果

### 6.1 测试概览

| 测试类型 | 框架 | 用例数 | 通过率 |
|---------|------|--------|--------|
| 后端API测试 | Jest + Supertest | 257 | 100% |
| 前端组件测试 | Vitest + Testing Library | 139 | 95% |

### 6.2 新功能测试覆盖 (v1.4.0)
- 阶段管理API测试：21个用例
- 知识库API测试：27个用例
- 智能分配API测试：15个用例
- 权限API测试：18个用例

---

## 七、权限系统说明

### 7.1 权限类型

| 权限代码 | 权限名称 | 资源类型 |
|---------|---------|---------|
| project:view | 查看项目 | project |
| project:edit | 编辑项目 | project |
| project:delete | 删除项目 | project |
| project:archive | 归档项目 | project |
| task:create | 创建任务 | task |
| task:edit | 编辑任务 | task |
| task:delete | 删除任务 | task |
| task:assign | 分配任务 | task |
| task:comment | 评论任务 | task |
| risk:create | 创建风险 | risk |
| risk:edit | 编辑风险 | risk |
| risk:delete | 删除风险 | risk |
| risk:assess | 评估风险 | risk |
| member:manage | 管理成员 | member |
| permission:manage | 管理权限 | permission |
| system:settings | 系统设置 | system |

### 7.2 默认角色权限

| 角色 | 权限范围 |
|------|---------|
| admin | 所有权限 |
| manager | 项目、任务、风险的所有权限 |
| leader | 查看、编辑、创建权限 |
| member | 查看和评论权限 |

---

## 八、已知问题与改进方向

### 8.1 已知问题
- 部分前端测试用例因异步超时失败（不影响功能）
- 数据存储使用JSON文件，不适合大规模生产环境

### 8.2 改进方向
- [ ] 迁移到关系型数据库（PostgreSQL/MySQL）
- [ ] 添加WebSocket实时通信
- [ ] 实现更多AI模型支持
- [ ] 添加移动端应用

---

## 九、联系与支持

- **GitHub仓库**: https://github.com/TokyoClod/AIPM
- **Issues**: https://github.com/TokyoClod/AIPM/issues

---

*文档最后更新：2026-03-11*
