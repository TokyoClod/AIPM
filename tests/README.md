# AIPM 测试文档

## 测试框架说明

AIPM项目采用多层次测试策略，确保代码质量和系统稳定性。

### 测试层次

#### 1. 前端单元测试 (Frontend Unit Tests)

**框架**: Vitest + React Testing Library

**配置文件**: `client/vitest.config.ts`

**测试目录**: `client/src/__tests__/`

**特点**:
- 使用 Vitest 作为测试运行器
- React Testing Library 提供组件测试能力
- 支持 TypeScript
- 内置覆盖率报告（目标：80%）
- 支持 jsdom 环境

**运行命令**:
```bash
# 运行前端测试
cd client
npm run test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 启动测试UI界面
npm run test:ui
```

#### 2. 后端单元测试 (Backend Unit Tests)

**框架**: Jest + Supertest

**配置文件**: `server/jest.config.js`

**测试目录**: `server/tests/`

**特点**:
- 使用 Jest 作为测试框架
- Supertest 用于 API 集成测试
- 支持 TypeScript
- 内置覆盖率报告（目标：70%）
- 支持 ES Modules

**运行命令**:
```bash
# 运行后端测试
cd server
npm run test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

#### 3. E2E端到端测试 (End-to-End Tests)

**框架**: Playwright

**配置文件**: `playwright.config.ts`

**测试目录**: `e2e/`

**特点**:
- 支持多浏览器测试（Chromium、Firefox、WebKit）
- 响应式测试（桌面、平板、手机）
- 自动截图和视频录制
- 失败时自动重试
- 完整的用户流程测试

**运行命令**:
```bash
# 运行E2E测试
npm run test:e2e

# 启动测试UI界面
npm run test:e2e:ui

# 调试模式运行测试
npm run test:e2e:debug

# 有头模式运行测试
npm run test:e2e:headed

# 查看测试报告
npm run test:e2e:report

# 生成测试代码
npm run test:e2e:codegen
```

## 运行测试指南

### 本地运行测试

#### 运行所有测试
```bash
# 在项目根目录运行所有测试（前端 + 后端 + E2E）
npm run test:all
```

#### 运行前端测试
```bash
# 运行前端测试
npm run test:frontend

# 或进入client目录运行
cd client
npm run test
```

#### 运行后端测试
```bash
# 运行后端测试
npm run test:backend

# 或进入server目录运行
cd server
npm run test
```

#### 运行E2E测试
```bash
# 运行E2E测试（需要先启动服务）
npm run test:e2e
```

### 生成覆盖率报告

#### 生成前后端覆盖率报告
```bash
# 生成前后端覆盖率报告并合并
npm run test:coverage
```

#### 生成合并报告
```bash
# 仅生成合并报告（需要先运行测试）
npm run test:report
```

报告输出位置：
- Markdown摘要: `coverage-report/summary.md`
- HTML报告: `coverage-report/index.html`

### CI/CD 环境运行测试

项目配置了 GitHub Actions 自动化测试流程：

**触发条件**:
- 推送到 `main` 或 `develop` 分支
- Pull Request 到 `main` 或 `develop` 分支

**测试流程**:
1. **后端测试**: 安装依赖 → 运行测试 → 上传覆盖率
2. **前端测试**: 安装依赖 → 运行测试 → 上传覆盖率
3. **E2E测试**: 构建项目 → 启动服务 → 运行Playwright测试
4. **覆盖率合并**: 下载前后端覆盖率 → 生成合并报告 → 上传报告

**查看测试结果**:
- GitHub Actions 页面查看测试运行状态
- Artifacts 中下载测试报告和覆盖率报告
- GitHub Step Summary 中查看覆盖率摘要

## 覆盖率目标说明

### 覆盖率目标

项目设定的覆盖率目标为 **80%**，具体指标包括：

- **行覆盖率 (Lines)**: ≥ 80%
- **函数覆盖率 (Functions)**: ≥ 80%
- **分支覆盖率 (Branches)**: ≥ 80%
- **语句覆盖率 (Statements)**: ≥ 80%

### 当前配置

#### 前端覆盖率配置 (client/vitest.config.ts)
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  exclude: [
    'node_modules/',
    'src/__tests__/',
    '**/*.d.ts',
    '**/*.config.*',
    '**/types/**',
    'src/main.tsx',
    'src/vite-env.d.ts',
  ],
  all: true,
  lines: 80,
  functions: 80,
  branches: 80,
  statements: 80,
}
```

#### 后端覆盖率配置 (server/jest.config.js)
```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

### 覆盖率报告说明

覆盖率报告包含以下内容：

1. **后端覆盖率**: 服务端代码的测试覆盖率
2. **前端覆盖率**: 客户端代码的测试覆盖率
3. **总体覆盖率**: 前后端合并后的整体覆盖率
4. **达标状态**: 显示各项指标是否达到80%目标

### 提高覆盖率的建议

1. **编写单元测试**: 为每个函数和组件编写测试用例
2. **覆盖边界情况**: 测试正常流程和异常情况
3. **集成测试**: 编写API集成测试覆盖业务逻辑
4. **E2E测试**: 编写完整的用户流程测试
5. **持续监控**: 在CI/CD中强制执行覆盖率检查

## 测试最佳实践

### 单元测试

1. **测试命名**: 使用描述性的测试名称
   ```typescript
   describe('UserService', () => {
     it('should create a new user with valid data', () => {
       // 测试代码
     });
   });
   ```

2. **AAA模式**: Arrange-Act-Assert
   ```typescript
   it('should calculate total correctly', () => {
     // Arrange - 准备测试数据
     const items = [{ price: 10 }, { price: 20 }];
     
     // Act - 执行测试操作
     const total = calculateTotal(items);
     
     // Assert - 验证结果
     expect(total).toBe(30);
   });
   ```

3. **测试隔离**: 每个测试应该独立，不依赖其他测试

### E2E测试

1. **用户视角**: 从用户角度编写测试
2. **关键流程**: 测试核心业务流程
3. **断言清晰**: 使用明确的断言
4. **等待策略**: 使用合适的等待策略

```typescript
test('user can login successfully', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="username"]', 'testuser');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('.welcome-message')).toBeVisible();
});
```

## 故障排查

### 常见问题

1. **测试超时**
   - 增加超时时间配置
   - 检查异步操作是否正确处理

2. **覆盖率不足**
   - 查看详细覆盖率报告找出未覆盖代码
   - 为未覆盖的分支编写测试

3. **E2E测试失败**
   - 检查服务是否正常启动
   - 查看Playwright报告中的截图和视频
   - 使用调试模式逐步排查

4. **CI测试失败**
   - 查看GitHub Actions日志
   - 下载Artifacts中的测试报告
   - 本地复现问题

## 相关资源

- [Vitest 文档](https://vitest.dev/)
- [Jest 文档](https://jestjs.io/)
- [React Testing Library 文档](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright 文档](https://playwright.dev/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
