import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';

// AI模型类型定义
export type AIModelType = 'openai' | 'claude' | 'ollama';

// 消息类型定义
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Function Calling工具定义
export interface AITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

// AI服务配置
export interface AIServiceConfig {
  model?: AIModelType;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// AI响应接口
export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  toolCalls?: any[];
}

// 流式响应类型
export type StreamCallback = (chunk: string, done: boolean) => void;

// AI服务基类接口
interface AIProvider {
  chat(messages: ChatMessage[], config?: AIServiceConfig, tools?: AITool[]): Promise<AIResponse>;
  chatStream(messages: ChatMessage[], callback: StreamCallback, config?: AIServiceConfig, tools?: AITool[]): Promise<void>;
  parseContent(content: string, type: string): Promise<any>;
  analyzeRisk(data: any): Promise<any>;
}

// OpenAI服务实现
class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private defaultModel = 'gpt-4-turbo-preview';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OpenAI API key not configured');
    }
    this.client = new OpenAI({
      apiKey: apiKey || 'dummy-key',
    });
  }

  async chat(messages: ChatMessage[], config?: AIServiceConfig, tools?: AITool[]): Promise<AIResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: config?.model || this.defaultModel,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: config?.temperature ?? 0.7,
        max_tokens: config?.maxTokens,
        tools: tools,
      });

      const choice = response.choices[0];
      return {
        content: choice.message.content || '',
        model: response.model,
        usage: response.usage ? {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens,
        } : undefined,
        toolCalls: choice.message.tool_calls,
      };
    } catch (error: any) {
      console.error('OpenAI chat error:', error);
      throw new Error(`OpenAI API错误: ${error.message}`);
    }
  }

  async chatStream(
    messages: ChatMessage[],
    callback: StreamCallback,
    config?: AIServiceConfig,
    tools?: AITool[]
  ): Promise<void> {
    try {
      const stream = await this.client.chat.completions.create({
        model: config?.model || this.defaultModel,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: config?.temperature ?? 0.7,
        max_tokens: config?.maxTokens,
        stream: true,
        tools: tools,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          callback(content, false);
        }
      }
      callback('', true);
    } catch (error: any) {
      console.error('OpenAI stream error:', error);
      throw new Error(`OpenAI流式响应错误: ${error.message}`);
    }
  }

  async parseContent(content: string, type: string): Promise<any> {
    const systemPrompt = `你是一个专业的项目管理系统内容解析助手。请将用户提供的${type}内容解析为结构化数据。
返回JSON格式，不要包含markdown代码块标记。`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content },
    ], { temperature: 0.3 });

    try {
      return JSON.parse(response.content);
    } catch {
      return { raw: response.content, parsed: false };
    }
  }

  async analyzeRisk(data: any): Promise<any> {
    const systemPrompt = `你是一个专业的项目风险管理分析师。请分析提供的项目数据，识别潜在风险并给出建议。
返回JSON格式，包含以下字段：
- risks: 风险列表（level, type, description, mitigation）
- summary: 总体风险概述
- recommendations: 改进建议`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(data) },
    ], { temperature: 0.5 });

    try {
      return JSON.parse(response.content);
    } catch {
      return { raw: response.content, parsed: false };
    }
  }
}

// Claude服务实现
class ClaudeProvider implements AIProvider {
  private client: Anthropic;
  private defaultModel = 'claude-3-5-sonnet-20241022';

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('Anthropic API key not configured');
    }
    this.client = new Anthropic({
      apiKey: apiKey || 'dummy-key',
    });
  }

  async chat(messages: ChatMessage[], config?: AIServiceConfig, tools?: AITool[]): Promise<AIResponse> {
    try {
      // Claude需要将system消息分离出来
      const systemMessage = messages.find(m => m.role === 'system');
      const otherMessages = messages.filter(m => m.role !== 'system');

      const response = await this.client.messages.create({
        model: config?.model || this.defaultModel,
        max_tokens: config?.maxTokens || 4096,
        system: systemMessage?.content,
        messages: otherMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      });

      const textContent = response.content.find(c => c.type === 'text');
      return {
        content: (textContent as any)?.text || '',
        model: response.model,
        usage: {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (error: any) {
      console.error('Claude chat error:', error);
      throw new Error(`Claude API错误: ${error.message}`);
    }
  }

  async chatStream(
    messages: ChatMessage[],
    callback: StreamCallback,
    config?: AIServiceConfig,
    tools?: AITool[]
  ): Promise<void> {
    try {
      const systemMessage = messages.find(m => m.role === 'system');
      const otherMessages = messages.filter(m => m.role !== 'system');

      const stream = this.client.messages.stream({
        model: config?.model || this.defaultModel,
        max_tokens: config?.maxTokens || 4096,
        system: systemMessage?.content,
        messages: otherMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          callback((event.delta as any).text, false);
        }
      }
      callback('', true);
    } catch (error: any) {
      console.error('Claude stream error:', error);
      throw new Error(`Claude流式响应错误: ${error.message}`);
    }
  }

  async parseContent(content: string, type: string): Promise<any> {
    const systemPrompt = `你是一个专业的项目管理系统内容解析助手。请将用户提供的${type}内容解析为结构化数据。
返回JSON格式，不要包含markdown代码块标记。`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content },
    ], { temperature: 0.3 });

    try {
      return JSON.parse(response.content);
    } catch {
      return { raw: response.content, parsed: false };
    }
  }

  async analyzeRisk(data: any): Promise<any> {
    const systemPrompt = `你是一个专业的项目风险管理分析师。请分析提供的项目数据，识别潜在风险并给出建议。
返回JSON格式，包含以下字段：
- risks: 风险列表（level, type, description, mitigation）
- summary: 总体风险概述
- recommendations: 改进建议`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(data) },
    ], { temperature: 0.5 });

    try {
      return JSON.parse(response.content);
    } catch {
      return { raw: response.content, parsed: false };
    }
  }
}

// Ollama服务实现
class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private defaultModel = 'llama2';

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  async chat(messages: ChatMessage[], config?: AIServiceConfig, tools?: AITool[]): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config?.model || this.defaultModel,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: false,
          options: {
            temperature: config?.temperature ?? 0.7,
            num_predict: config?.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API响应错误: ${response.status}`);
      }

      const data = await response.json() as any;
      return {
        content: data.message?.content || '',
        model: data.model || config?.model || this.defaultModel,
        usage: {
          prompt_tokens: data.prompt_eval_count || 0,
          completion_tokens: data.eval_count || 0,
          total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
      };
    } catch (error: any) {
      console.error('Ollama chat error:', error);
      throw new Error(`Ollama API错误: ${error.message}`);
    }
  }

  async chatStream(
    messages: ChatMessage[],
    callback: StreamCallback,
    config?: AIServiceConfig,
    tools?: AITool[]
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config?.model || this.defaultModel,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: true,
          options: {
            temperature: config?.temperature ?? 0.7,
            num_predict: config?.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API响应错误: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法获取响应流');

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              callback(data.message.content, false);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
      callback('', true);
    } catch (error: any) {
      console.error('Ollama stream error:', error);
      throw new Error(`Ollama流式响应错误: ${error.message}`);
    }
  }

  async parseContent(content: string, type: string): Promise<any> {
    const systemPrompt = `你是一个专业的项目管理系统内容解析助手。请将用户提供的${type}内容解析为结构化数据。
返回JSON格式，不要包含markdown代码块标记。`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content },
    ], { temperature: 0.3 });

    try {
      return JSON.parse(response.content);
    } catch {
      return { raw: response.content, parsed: false };
    }
  }

  async analyzeRisk(data: any): Promise<any> {
    const systemPrompt = `你是一个专业的项目风险管理分析师。请分析提供的项目数据，识别潜在风险并给出建议。
返回JSON格式，包含以下字段：
- risks: 风险列表（level, type, description, mitigation）
- summary: 总体风险概述
- recommendations: 改进建议`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(data) },
    ], { temperature: 0.5 });

    try {
      return JSON.parse(response.content);
    } catch {
      return { raw: response.content, parsed: false };
    }
  }
}

// AI服务管理器
class AIServiceManager {
  private providers: Map<AIModelType, AIProvider>;
  private defaultProvider: AIModelType;

  constructor() {
    this.providers = new Map();
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('claude', new ClaudeProvider());
    this.providers.set('ollama', new OllamaProvider());
    
    // 默认使用OpenAI，如果未配置则使用Ollama
    this.defaultProvider = process.env.OPENAI_API_KEY ? 'openai' : 
                           process.env.ANTHROPIC_API_KEY ? 'claude' : 'ollama';
  }

  getProvider(type?: AIModelType): AIProvider {
    const providerType = type || this.defaultProvider;
    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new Error(`不支持的AI模型类型: ${providerType}`);
    }
    return provider;
  }

  async chat(
    messages: ChatMessage[],
    config?: AIServiceConfig,
    tools?: AITool[]
  ): Promise<AIResponse> {
    const provider = this.getProvider(config?.model);
    return provider.chat(messages, config, tools);
  }

  async chatStream(
    messages: ChatMessage[],
    callback: StreamCallback,
    config?: AIServiceConfig,
    tools?: AITool[]
  ): Promise<void> {
    const provider = this.getProvider(config?.model);
    return provider.chatStream(messages, callback, config, tools);
  }

  async parseContent(content: string, type: string, config?: AIServiceConfig): Promise<any> {
    const provider = this.getProvider(config?.model);
    return provider.parseContent(content, type);
  }

  async analyzeRisk(data: any, config?: AIServiceConfig): Promise<any> {
    const provider = this.getProvider(config?.model);
    return provider.analyzeRisk(data);
  }

  // Function Calling工具定义
  getProjectManagementTools(): AITool[] {
    return [
      {
        type: 'function',
        function: {
          name: 'create_task',
          description: '创建新任务',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: '任务标题' },
              description: { type: 'string', description: '任务描述' },
              project_id: { type: 'string', description: '项目ID' },
              priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: '优先级' },
              assignee: { type: 'string', description: '负责人ID' },
              start_date: { type: 'string', description: '开始日期' },
              end_date: { type: 'string', description: '结束日期' },
            },
            required: ['title', 'project_id'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'update_task',
          description: '更新任务信息',
          parameters: {
            type: 'object',
            properties: {
              task_id: { type: 'string', description: '任务ID' },
              status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'paused', 'cancelled'], description: '任务状态' },
              progress: { type: 'number', description: '进度百分比(0-100)' },
              title: { type: 'string', description: '任务标题' },
              description: { type: 'string', description: '任务描述' },
              priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: '优先级' },
            },
            required: ['task_id'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'create_risk',
          description: '创建风险记录',
          parameters: {
            type: 'object',
            properties: {
              description: { type: 'string', description: '风险描述' },
              level: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: '风险等级' },
              project_id: { type: 'string', description: '项目ID' },
              type: { type: 'string', enum: ['technical', 'resource', 'schedule', 'quality', 'other'], description: '风险类型' },
              mitigation: { type: 'string', description: '缓解措施' },
            },
            required: ['description', 'level', 'project_id'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'query_project',
          description: '查询项目状态和详细信息',
          parameters: {
            type: 'object',
            properties: {
              project_id: { type: 'string', description: '项目ID' },
            },
            required: ['project_id'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'list_tasks',
          description: '列出项目任务',
          parameters: {
            type: 'object',
            properties: {
              project_id: { type: 'string', description: '项目ID' },
              status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'paused', 'cancelled'], description: '按状态筛选' },
            },
            required: ['project_id'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'assign_task',
          description: '分配任务给用户',
          parameters: {
            type: 'object',
            properties: {
              task_id: { type: 'string', description: '任务ID' },
              user_id: { type: 'string', description: '用户ID' },
            },
            required: ['task_id', 'user_id'],
          },
        },
      },
    ];
  }
}

// 导出单例实例
export const aiService = new AIServiceManager();

// 导出类型和类
export { AIProvider, OpenAIProvider, ClaudeProvider, OllamaProvider, AIServiceManager };
