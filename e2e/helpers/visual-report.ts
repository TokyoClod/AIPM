import * as fs from 'fs';
import * as path from 'path';

export interface VisualDiffResult {
  testName: string;
  passed: boolean;
  diffPixels?: number;
  diffPercentage?: number;
  baselinePath?: string;
  actualPath?: string;
  diffPath?: string;
  error?: string;
}

export interface VisualReportData {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: VisualDiffResult[];
}

export class VisualReportGenerator {
  private reportDir: string;
  private results: VisualDiffResult[] = [];

  constructor(reportDir: string = './visual-report') {
    this.reportDir = reportDir;
    
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  addResult(result: VisualDiffResult): void {
    this.results.push(result);
  }

  generateReport(): string {
    const reportData: VisualReportData = {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      passedTests: this.results.filter(r => r.passed).length,
      failedTests: this.results.filter(r => !r.passed).length,
      results: this.results,
    };

    const htmlContent = this.generateHTML(reportData);
    
    const reportPath = path.join(this.reportDir, 'visual-report.html');
    fs.writeFileSync(reportPath, htmlContent);

    const jsonPath = path.join(this.reportDir, 'visual-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));

    return reportPath;
  }

  private generateHTML(data: VisualReportData): string {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>视觉回归测试报告</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header .timestamp {
            opacity: 0.9;
            font-size: 0.9em;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .summary-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        
        .summary-card h3 {
            font-size: 0.9em;
            color: #666;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        
        .summary-card .number {
            font-size: 2.5em;
            font-weight: bold;
        }
        
        .summary-card.total .number {
            color: #667eea;
        }
        
        .summary-card.passed .number {
            color: #10b981;
        }
        
        .summary-card.failed .number {
            color: #ef4444;
        }
        
        .results {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .results-header {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .results-header h2 {
            color: #333;
        }
        
        .result-item {
            padding: 20px;
            border-bottom: 1px solid #e5e7eb;
            transition: background 0.2s;
        }
        
        .result-item:hover {
            background: #f8f9fa;
        }
        
        .result-item:last-child {
            border-bottom: none;
        }
        
        .result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .result-name {
            font-weight: 600;
            font-size: 1.1em;
        }
        
        .result-status {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
        }
        
        .result-status.passed {
            background: #d1fae5;
            color: #065f46;
        }
        
        .result-status.failed {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .result-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .detail-item {
            font-size: 0.9em;
        }
        
        .detail-label {
            color: #666;
            margin-right: 5px;
        }
        
        .detail-value {
            font-weight: 600;
        }
        
        .diff-images {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 15px;
        }
        
        .diff-image {
            border: 1px solid #e5e7eb;
            border-radius: 5px;
            overflow: hidden;
        }
        
        .diff-image img {
            width: 100%;
            height: auto;
            display: block;
        }
        
        .diff-image-label {
            padding: 10px;
            background: #f8f9fa;
            font-size: 0.85em;
            font-weight: 600;
            text-align: center;
        }
        
        .no-results {
            padding: 60px 20px;
            text-align: center;
            color: #666;
        }
        
        .no-results p {
            font-size: 1.1em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>视觉回归测试报告</h1>
            <div class="timestamp">生成时间: ${data.timestamp}</div>
        </div>
        
        <div class="summary">
            <div class="summary-card total">
                <h3>总测试数</h3>
                <div class="number">${data.totalTests}</div>
            </div>
            <div class="summary-card passed">
                <h3>通过</h3>
                <div class="number">${data.passedTests}</div>
            </div>
            <div class="summary-card failed">
                <h3>失败</h3>
                <div class="number">${data.failedTests}</div>
            </div>
        </div>
        
        <div class="results">
            <div class="results-header">
                <h2>测试结果详情</h2>
            </div>
            ${this.generateResultsHTML(data.results)}
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  private generateResultsHTML(results: VisualDiffResult[]): string {
    if (results.length === 0) {
      return `
        <div class="no-results">
            <p>暂无测试结果</p>
        </div>
      `;
    }

    return results.map(result => `
      <div class="result-item">
          <div class="result-header">
              <div class="result-name">${result.testName}</div>
              <div class="result-status ${result.passed ? 'passed' : 'failed'}">
                  ${result.passed ? '通过' : '失败'}
              </div>
          </div>
          ${this.generateDetailsHTML(result)}
      </div>
    `).join('');
  }

  private generateDetailsHTML(result: VisualDiffResult): string {
    if (result.passed) {
      return `
        <div class="result-details">
            <div class="detail-item">
                <span class="detail-label">状态:</span>
                <span class="detail-value">截图匹配成功</span>
            </div>
        </div>
      `;
    }

    return `
      <div class="result-details">
          ${result.diffPixels ? `
            <div class="detail-item">
                <span class="detail-label">差异像素:</span>
                <span class="detail-value">${result.diffPixels}</span>
            </div>
          ` : ''}
          ${result.diffPercentage ? `
            <div class="detail-item">
                <span class="detail-label">差异百分比:</span>
                <span class="detail-value">${result.diffPercentage.toFixed(2)}%</span>
            </div>
          ` : ''}
          ${result.error ? `
            <div class="detail-item">
                <span class="detail-label">错误信息:</span>
                <span class="detail-value">${result.error}</span>
            </div>
          ` : ''}
      </div>
      ${this.generateDiffImagesHTML(result)}
    `;
  }

  private generateDiffImagesHTML(result: VisualDiffResult): string {
    const images: Array<{ label: string; path?: string }> = [
      { label: '基线截图', path: result.baselinePath },
      { label: '实际截图', path: result.actualPath },
      { label: '差异对比', path: result.diffPath },
    ];

    const validImages = images.filter(img => img.path && fs.existsSync(img.path));
    
    if (validImages.length === 0) {
      return '';
    }

    return `
      <div class="diff-images">
          ${validImages.map(img => `
            <div class="diff-image">
                <div class="diff-image-label">${img.label}</div>
                <img src="${img.path}" alt="${img.label}">
            </div>
          `).join('')}
      </div>
    `;
  }
}

export function generateVisualReport(
  results: VisualDiffResult[],
  outputDir?: string
): string {
  const generator = new VisualReportGenerator(outputDir);
  
  results.forEach(result => generator.addResult(result));
  
  return generator.generateReport();
}
