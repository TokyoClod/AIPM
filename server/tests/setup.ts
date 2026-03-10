// Jest setup file
import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// 设置测试环境变量
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.NODE_ENV = 'test';

// 增加测试超时时间
jest.setTimeout(30000);

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 在所有测试之前执行
beforeAll(async () => {
  // 可以在这里初始化测试数据库连接等
  console.log('Starting test suite...');
});

// 在所有测试之后执行
afterAll(async () => {
  // 清理测试数据
  console.log('Test suite completed.');
});

// 每个测试之前执行
beforeEach(() => {
  // 重置测试数据或状态
});

// 每个测试之后执行
afterEach(() => {
  // 清理测试产生的数据
});
