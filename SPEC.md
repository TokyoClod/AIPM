# AIProjectManager - 多人协作项目管理平台

## 1. 项目概述

**项目名称**: AIProjectManager (AIPM)  
**项目类型**: 企业级Web应用  
**核心功能**: 支持多项目并行管理、多任务层级划分、多用户权限控制的企业级项目管理平台  
**目标用户**: 项目经理、团队成员、企业管理者

---

## 2. 技术架构

### 2.1 技术栈

| 层级 | 技术选择 |
|------|----------|
| **前端框架** | React 18 + TypeScript |
| **UI组件库** | Ant Design 5.x |
| **状态管理** | Zustand |
| **路由** | React Router v6 |
| **图表库** | ECharts + Gantt |
| **后端框架** | Node.js + Express |
| **数据库** | SQLite (开发) / PostgreSQL (生产) |
| **认证** | JWT |
| **邮件服务** | Nodemailer |
| **任务调度** | node-cron |
| **构建工具** | Vite |

### 2.2 项目目录结构

```
AIPM/
├── client/                     # 前端应用
│   ├── public/
│   ├── src/
│   │   ├── api/               # API请求
│   │   ├── components/        # 通用组件
│   │   ├── pages/             # 页面组件
│   │   ├── stores/            # 状态管理
│   │   ├── types/             # TypeScript类型
│   │   ├── utils/             # 工具函数
│   │   ├── styles/            # 全局样式
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── server/                     # 后端应用
│   ├── src/
│   │   ├── controllers/      # 控制器
│   │   ├── middleware/        # 中间件
│   │   ├── models/            # 数据模型
│   │   ├── routes/            # 路由
│   │   ├── services/          # 业务逻辑
│   │   ├── utils/             # 工具函数
│   │   └── index.ts
│   ├── package.json
│   └── .env
└── package.json                # 根目录配置
```

---

## 3. 功能模块规格

### 3.1 用户认证与权限系统

#### 3.1.1 用户管理
- 用户注册（邮箱验证码）
- 用户登录（JWT token）
- 密码找回
- 用户资料编辑
- 头像上传

#### 3.1.2 RBAC权限模型

| 角色 | 权限描述 |
|------|----------|
| **超级管理员** | 系统全权限、环境管理、用户管理 |
| **项目经理** | 项目创建、任务分配、全项目视图 |
| **团队负责人** | 本团队项目/任务管理 |
| **成员** | 查看被分配任务、更新任务进度 |

#### 3.1.3 权限控制粒度
- 功能级权限：菜单、按钮可见性
- 数据级权限：项目、任务访问范围
- 操作级权限：创建、编辑、删除、指派

### 3.2 项目管理模块

#### 3.2.1 项目创建
- 项目名称、描述、起止日期
- 项目成员添加
- 项目分类/标签
- 项目模板选择

#### 3.2.2 任务层级结构
```
项目
├── 一级任务 (Phase)
│   ├── 二级任务 (Milestone)
│   │   ├── 三级任务 (Task)
│   │   │   └── 子任务 (Sub-task)
```

#### 3.2.3 任务拆分规则
- 手动创建：自由定义任务层级
- 智能拆分：按人数/天数/工作量自动分配
- 模板复用：从预设模板创建

#### 3.2.4 任务分配
- 单用户指派
- 多用户协作
- 角色/部门筛选
- 批量分配

### 3.3 多视图可视化

#### 3.3.1 列表视图
- 可排序列：状态、负责人、截止日期、优先级
- 多级筛选：项目、状态、负责人、日期范围
- 批量操作：批量指派、批量状态更新
- 列自定义：显示/隐藏列

#### 3.3.2 看板视图
- 列定义：状态/优先级/负责人自定义
- 拖拽操作：任务状态拖拽更新
- 泳道划分：按负责人/项目分组
- 卡片信息：任务标题、截止日期、风险标识

#### 3.3.3 甘特图视图
- 时间粒度：日/周/月
- 任务依赖线
- 进度百分比显示
- 关键路径高亮
- 资源加载视图

### 3.4 任务执行与跟踪

#### 3.4.1 任务状态管理
| 状态 | 描述 |
|------|------|
| 未开始 | 任务待处理 |
| 进行中 | 任务执行中 |
| 已完成 | 任务完成 |
| 已暂停 | 任务暂停 |
| 已取消 | 任务取消 |

#### 3.4.2 任务进度更新
- 进度百分比滑块
- 工作日志记录
- 里程碑检查点
- 完成情况描述

#### 3.4.3 风险标记机制
- 风险等级：低/中/高/严重
- 风险类型：技术/资源/进度/质量
- 风险描述与建议
- 风险转移/缓解措施
- 风险关联任务

### 3.5 项目监控与分析

#### 3.5.1 项目仪表盘
- 整体进度环
- 任务完成率统计
- 关键风险列表
- 责任人工作量分布
- 近7天活动趋势
- 即将到期任务提醒

#### 3.5.2 风险预警系统
- 风险热力图（按项目/时间）
- 延期风险自动识别
- 工作量超负荷预警
- 资源冲突检测

#### 3.5.3 智能分析
- 任务延期原因分析
- 工作量预测
- 解决建议生成（基于历史数据）

### 3.6 自动化通知

#### 3.6.1 每日项目汇总
- 项目完成百分比
- 今日/明日到期任务
- 新增风险提示
- 成员工作摘要

#### 3.6.2 邮件通知
- 任务指派通知
- 任务状态变更通知
- 风险预警通知
- 每日项目报告
- 邮件订阅配置

### 3.7 环境隔离

#### 3.7.1 多环境支持
- 开发环境 (development)
- 测试环境 (testing)
- 生产环境 (production)

#### 3.7.2 数据隔离
- 环境独立数据库
- 环境变量配置
- 环境标识显示

---

## 4. 数据库设计

### 4.1 核心表结构

```sql
-- 用户表
users (id, email, password, name, avatar, role_id, created_at, updated_at)

-- 角色表
roles (id, name, description, permissions)

-- 项目表
projects (id, name, description, start_date, end_date, status, owner_id, created_at)

-- 项目成员关联表
project_members (id, project_id, user_id, role)

-- 任务表
tasks (id, project_id, parent_id, title, description, status, priority, 
      progress, start_date, end_date, risk_level, risk_description,
      assignee_id, creator_id, created_at, updated_at)

-- 任务评论表
task_comments (id, task_id, user_id, content, created_at)

-- 风险记录表
risks (id, project_id, task_id, level, type, description, 
       mitigation, status, created_by, created_at)

-- 通知记录表
notifications (id, user_id, type, title, content, read, created_at)

-- 环境配置表
environments (id, name, db_path, is_active)
```

---

## 5. API接口设计

### 5.1 认证接口
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/me | 获取当前用户 |
| POST | /api/auth/refresh | 刷新Token |

### 5.2 项目接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/projects | 获取项目列表 |
| POST | /api/projects | 创建项目 |
| GET | /api/projects/:id | 获取项目详情 |
| PUT | /api/projects/:id | 更新项目 |
| DELETE | /api/projects/:id | 删除项目 |
| GET | /api/projects/:id/dashboard | 项目仪表盘数据 |

### 5.3 任务接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/tasks | 获取任务列表 |
| POST | /api/tasks | 创建任务 |
| GET | /api/tasks/:id | 获取任务详情 |
| PUT | /api/tasks/:id | 更新任务 |
| DELETE | /api/tasks/:id | 删除任务 |
| PUT | /api/tasks/:id/progress | 更新进度 |
| POST | /api/tasks/:id/comments | 添加评论 |

### 5.4 风险接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/risks | 获取风险列表 |
| POST | /api/risks | 创建风险记录 |
| PUT | /api/risks/:id | 更新风险状态 |

### 5.5 通知接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/notifications | 获取通知列表 |
| PUT | /api/notifications/:id/read | 标记已读 |
| POST | /api/reports/daily | 生成每日报告 |

---

## 6. UI/UX设计规格

### 6.1 设计风格
- **整体风格**: 简洁清爽的现代企业风格
- **配色方案**:
  - 主色: #1890ff (蓝色)
  - 成功: #52c41a (绿色)
  - 警告: #faad14 (橙色)
  - 危险: #f5222d (红色)
  - 背景: #f5f7fa
  - 卡片: #ffffff
- **字体**: system-ui, -apple-system, sans-serif

### 6.2 布局结构
- 顶部导航栏: 64px高度
- 侧边栏: 240px宽度 (可折叠至80px)
- 内容区: 自适应
- 卡片圆角: 8px
- 阴影: 0 2px 8px rgba(0,0,0,0.08)

### 6.3 响应式断点
| 设备 | 断点 |
|------|------|
| 桌面 | >= 1200px |
| 平板 | 768px - 1199px |
| 移动 | < 768px |

### 6.4 交互优化
- 操作反馈: 2秒内响应
- 加载状态: 骨架屏
- 错误处理: Toast提示
- 确认对话框: 二次确认危险操作

---

## 7. 验收标准

### 7.1 功能验收
- [ ] 用户可注册、登录、登出
- [ ] 项目可创建、编辑、删除
- [ ] 任务可创建、分配、层级管理
- [ ] 三种视图正常切换与操作
- [ ] 任务状态与进度可更新
- [ ] 风险可标记与查看
- [ ] 仪表盘正确显示统计数据
- [ ] 邮件通知可配置与发送
- [ ] 管理员可管理用户与权限

### 7.2 性能验收
- [ ] 页面加载时间 < 2秒
- [ ] 操作响应时间 < 2秒
- [ ] 支持100+任务流畅渲染

### 7.3 兼容性验收
- [ ] Chrome/Edge/Firefox/Safari正常访问
- [ ] Windows/Ubuntu系统部署正常
- [ ] 移动端响应式显示正常
