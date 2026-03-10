#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * 读取JSON文件
 */
function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`文件不存在: ${filePath}`);
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`读取文件失败 ${filePath}:`, error.message);
    return null;
  }
}

/**
 * 计算覆盖率百分比
 */
function calculatePercentage(covered, total) {
  if (total === 0) return 100;
  return ((covered / total) * 100).toFixed(2);
}

/**
 * 获取覆盖率状态图标
 */
function getStatusIcon(percentage, threshold = 80) {
  const pct = parseFloat(percentage);
  if (pct >= threshold) return '✅';
  if (pct >= threshold - 10) return '⚠️';
  return '❌';
}

/**
 * 生成覆盖率摘要Markdown
 */
function generateSummaryMarkdown(backendCoverage, frontendCoverage) {
  let markdown = '# 测试覆盖率报告\n\n';
  markdown += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
  
  // 后端覆盖率
  if (backendCoverage) {
    markdown += '## 后端覆盖率\n\n';
    markdown += '| 指标 | 覆盖率 | 状态 |\n';
    markdown += '|------|--------|------|\n';
    
    const lines = calculatePercentage(
      backendCoverage.lines.covered,
      backendCoverage.lines.total
    );
    const functions = calculatePercentage(
      backendCoverage.functions.covered,
      backendCoverage.functions.total
    );
    const branches = calculatePercentage(
      backendCoverage.branches.covered,
      backendCoverage.branches.total
    );
    const statements = calculatePercentage(
      backendCoverage.statements.covered,
      backendCoverage.statements.total
    );
    
    markdown += `| 行覆盖率 | ${lines}% | ${getStatusIcon(lines)} |\n`;
    markdown += `| 函数覆盖率 | ${functions}% | ${getStatusIcon(functions)} |\n`;
    markdown += `| 分支覆盖率 | ${branches}% | ${getStatusIcon(branches)} |\n`;
    markdown += `| 语句覆盖率 | ${statements}% | ${getStatusIcon(statements)} |\n\n`;
  } else {
    markdown += '## 后端覆盖率\n\n⚠️ 后端覆盖率数据未找到\n\n';
  }
  
  // 前端覆盖率
  if (frontendCoverage) {
    markdown += '## 前端覆盖率\n\n';
    markdown += '| 指标 | 覆盖率 | 状态 |\n';
    markdown += '|------|--------|------|\n';
    
    const lines = calculatePercentage(
      frontendCoverage.lines.covered,
      frontendCoverage.lines.total
    );
    const functions = calculatePercentage(
      frontendCoverage.functions.covered,
      frontendCoverage.functions.total
    );
    const branches = calculatePercentage(
      frontendCoverage.branches.covered,
      frontendCoverage.branches.total
    );
    const statements = calculatePercentage(
      frontendCoverage.statements.covered,
      frontendCoverage.statements.total
    );
    
    markdown += `| 行覆盖率 | ${lines}% | ${getStatusIcon(lines)} |\n`;
    markdown += `| 函数覆盖率 | ${functions}% | ${getStatusIcon(functions)} |\n`;
    markdown += `| 分支覆盖率 | ${branches}% | ${getStatusIcon(branches)} |\n`;
    markdown += `| 语句覆盖率 | ${statements}% | ${getStatusIcon(statements)} |\n\n`;
  } else {
    markdown += '## 前端覆盖率\n\n⚠️ 前端覆盖率数据未找到\n\n';
  }
  
  // 总体覆盖率
  if (backendCoverage && frontendCoverage) {
    const totalLines = backendCoverage.lines.total + frontendCoverage.lines.total;
    const totalLinesCovered = backendCoverage.lines.covered + frontendCoverage.lines.covered;
    const totalFunctions = backendCoverage.functions.total + frontendCoverage.functions.total;
    const totalFunctionsCovered = backendCoverage.functions.covered + frontendCoverage.functions.covered;
    const totalBranches = backendCoverage.branches.total + frontendCoverage.branches.total;
    const totalBranchesCovered = backendCoverage.branches.covered + frontendCoverage.branches.covered;
    const totalStatements = backendCoverage.statements.total + frontendCoverage.statements.total;
    const totalStatementsCovered = backendCoverage.statements.covered + frontendCoverage.statements.covered;
    
    markdown += '## 总体覆盖率\n\n';
    markdown += '| 指标 | 覆盖率 | 状态 |\n';
    markdown += '|------|--------|------|\n';
    
    const totalLinesPct = calculatePercentage(totalLinesCovered, totalLines);
    const totalFunctionsPct = calculatePercentage(totalFunctionsCovered, totalFunctions);
    const totalBranchesPct = calculatePercentage(totalBranchesCovered, totalBranches);
    const totalStatementsPct = calculatePercentage(totalStatementsCovered, totalStatements);
    
    markdown += `| 行覆盖率 | ${totalLinesPct}% | ${getStatusIcon(totalLinesPct)} |\n`;
    markdown += `| 函数覆盖率 | ${totalFunctionsPct}% | ${getStatusIcon(totalFunctionsPct)} |\n`;
    markdown += `| 分支覆盖率 | ${totalBranchesPct}% | ${getStatusIcon(totalBranchesPct)} |\n`;
    markdown += `| 语句覆盖率 | ${totalStatementsPct}% | ${getStatusIcon(totalStatementsPct)} |\n\n`;
    
    // 覆盖率目标
    markdown += '## 覆盖率目标\n\n';
    markdown += '- 目标覆盖率: **80%**\n';
    markdown += `- 行覆盖率: ${totalLinesPct >= 80 ? '✅ 达标' : '❌ 未达标'}\n`;
    markdown += `- 函数覆盖率: ${totalFunctionsPct >= 80 ? '✅ 达标' : '❌ 未达标'}\n`;
    markdown += `- 分支覆盖率: ${totalBranchesPct >= 80 ? '✅ 达标' : '❌ 未达标'}\n`;
    markdown += `- 语句覆盖率: ${totalStatementsPct >= 80 ? '✅ 达标' : '❌ 未达标'}\n`;
  }
  
  return markdown;
}

/**
 * 生成HTML报告
 */
function generateHtmlReport(backendCoverage, frontendCoverage) {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>测试覆盖率报告 - AIPM</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      color: white;
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
    }
    
    .header p {
      font-size: 1.1rem;
      opacity: 0.9;
    }
    
    .card {
      background: white;
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    
    .card h2 {
      color: #333;
      margin-bottom: 20px;
      font-size: 1.5rem;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }
    
    .coverage-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    
    .coverage-item {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    
    .coverage-item h3 {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    
    .coverage-value {
      font-size: 2.5rem;
      font-weight: bold;
      margin: 10px 0;
    }
    
    .coverage-value.good {
      color: #28a745;
    }
    
    .coverage-value.warning {
      color: #ffc107;
    }
    
    .coverage-value.bad {
      color: #dc3545;
    }
    
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 10px;
    }
    
    .progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    
    .progress-fill.good {
      background: #28a745;
    }
    
    .progress-fill.warning {
      background: #ffc107;
    }
    
    .progress-fill.bad {
      background: #dc3545;
    }
    
    .status-icon {
      font-size: 1.5rem;
    }
    
    .timestamp {
      text-align: center;
      color: white;
      margin-top: 20px;
      opacity: 0.8;
    }
    
    .no-data {
      text-align: center;
      color: #999;
      padding: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>测试覆盖率报告</h1>
      <p>AIPM - 多人协作项目管理平台</p>
    </div>
    
    ${generateCoverageCard('后端覆盖率', backendCoverage)}
    
    ${generateCoverageCard('前端覆盖率', frontendCoverage)}
    
    ${generateTotalCoverageCard(backendCoverage, frontendCoverage)}
    
    <div class="timestamp">
      生成时间: ${new Date().toLocaleString('zh-CN')}
    </div>
  </div>
</body>
</html>`;

  return html;
}

/**
 * 生成覆盖率卡片HTML
 */
function generateCoverageCard(title, coverage) {
  if (!coverage) {
    return `
    <div class="card">
      <h2>${title}</h2>
      <div class="no-data">⚠️ 覆盖率数据未找到</div>
    </div>`;
  }
  
  const metrics = [
    { name: '行覆盖率', key: 'lines' },
    { name: '函数覆盖率', key: 'functions' },
    { name: '分支覆盖率', key: 'branches' },
    { name: '语句覆盖率', key: 'statements' }
  ];
  
  let html = `
    <div class="card">
      <h2>${title}</h2>
      <div class="coverage-grid">`;
  
  metrics.forEach(metric => {
    const percentage = calculatePercentage(
      coverage[metric.key].covered,
      coverage[metric.key].total
    );
    const statusClass = getStatusClass(percentage);
    const icon = getStatusIcon(percentage);
    
    html += `
        <div class="coverage-item">
          <h3>${metric.name}</h3>
          <div class="status-icon">${icon}</div>
          <div class="coverage-value ${statusClass}">${percentage}%</div>
          <div class="progress-bar">
            <div class="progress-fill ${statusClass}" style="width: ${percentage}%"></div>
          </div>
        </div>`;
  });
  
  html += `
      </div>
    </div>`;
  
  return html;
}

/**
 * 生成总体覆盖率卡片
 */
function generateTotalCoverageCard(backendCoverage, frontendCoverage) {
  if (!backendCoverage || !frontendCoverage) {
    return '';
  }
  
  const total = {
    lines: {
      covered: backendCoverage.lines.covered + frontendCoverage.lines.covered,
      total: backendCoverage.lines.total + frontendCoverage.lines.total
    },
    functions: {
      covered: backendCoverage.functions.covered + frontendCoverage.functions.covered,
      total: backendCoverage.functions.total + frontendCoverage.functions.total
    },
    branches: {
      covered: backendCoverage.branches.covered + frontendCoverage.branches.covered,
      total: backendCoverage.branches.total + frontendCoverage.branches.total
    },
    statements: {
      covered: backendCoverage.statements.covered + frontendCoverage.statements.covered,
      total: backendCoverage.statements.total + frontendCoverage.statements.total
    }
  };
  
  return generateCoverageCard('总体覆盖率', total);
}

/**
 * 获取状态CSS类
 */
function getStatusClass(percentage) {
  const pct = parseFloat(percentage);
  if (pct >= 80) return 'good';
  if (pct >= 70) return 'warning';
  return 'bad';
}

/**
 * 主函数
 */
function main() {
  console.log('📊 开始生成测试覆盖率报告...\n');
  
  // 读取后端覆盖率报告
  const backendCoveragePath = path.join(rootDir, 'server/coverage/coverage-summary.json');
  const backendCoverage = readJsonFile(backendCoveragePath);
  
  if (backendCoverage) {
    console.log('✅ 后端覆盖率数据已加载');
  } else {
    console.log('⚠️ 后端覆盖率数据未找到');
  }
  
  // 读取前端覆盖率报告
  const frontendCoveragePath = path.join(rootDir, 'client/coverage/coverage-summary.json');
  const frontendCoverage = readJsonFile(frontendCoveragePath);
  
  if (frontendCoverage) {
    console.log('✅ 前端覆盖率数据已加载');
  } else {
    console.log('⚠️ 前端覆盖率数据未找到');
  }
  
  // 创建输出目录
  const outputDir = path.join(rootDir, 'coverage-report');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 生成Markdown摘要
  const markdown = generateSummaryMarkdown(backendCoverage, frontendCoverage);
  const markdownPath = path.join(outputDir, 'summary.md');
  fs.writeFileSync(markdownPath, markdown, 'utf-8');
  console.log(`\n✅ Markdown摘要已生成: ${markdownPath}`);
  
  // 生成HTML报告
  const html = generateHtmlReport(backendCoverage, frontendCoverage);
  const htmlPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log(`✅ HTML报告已生成: ${htmlPath}`);
  
  // 输出摘要到控制台
  console.log('\n' + '='.repeat(60));
  console.log('测试覆盖率摘要');
  console.log('='.repeat(60));
  console.log(markdown);
  console.log('='.repeat(60));
  
  console.log('\n✨ 覆盖率报告生成完成！');
  console.log(`📁 报告目录: ${outputDir}`);
}

// 执行主函数
main();
