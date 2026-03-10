// Jest setup file
import { beforeAll, afterAll, jest } from '@jest/globals';

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
  console.log('Starting test suite...');
});

// 在所有测试之后执行
afterAll(async () => {
  console.log('Test suite completed.');
});
