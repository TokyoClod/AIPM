import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuickInput from '../../../components/AI/QuickInput';
import * as api from '../../../api';

// Mock API
vi.mock('../../../api', () => ({
  aiApi: {
    aiParse: vi.fn(),
  },
  taskApi: {
    create: vi.fn(),
  },
  riskApi: {
    create: vi.fn(),
  },
  projectApi: {
    getAll: vi.fn(),
  },
}));

describe('QuickInput', () => {
  const mockOnClose = vi.fn();

  const mockProjects = [
    { id: '1', name: '项目A' },
    { id: '2', name: '项目B' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock projectApi.getAll
    (api.projectApi.getAll as any).mockResolvedValue({
      data: { data: mockProjects },
    });
  });

  it('当 visible 为 false 时不应该显示', () => {
    render(<QuickInput visible={false} onClose={mockOnClose} />);
    
    expect(screen.queryByText('快速录入')).not.toBeInTheDocument();
  });

  it('当 visible 为 true 时应该显示', () => {
    render(<QuickInput visible={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('快速录入')).toBeInTheDocument();
  });

  it('应该显示输入文本框', () => {
    render(<QuickInput visible={true} onClose={mockOnClose} />);
    
    expect(screen.getByPlaceholderText(/输入任务、风险或进度更新/)).toBeInTheDocument();
  });

  it('应该显示 AI 解析按钮', () => {
    render(<QuickInput visible={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('AI 解析')).toBeInTheDocument();
  });

  it('应该能够输入文本', async () => {
    const user = userEvent.setup();
    render(<QuickInput visible={true} onClose={mockOnClose} />);
    
    const input = screen.getByPlaceholderText(/输入任务、风险或进度更新/);
    await user.type(input, '创建一个测试任务');
    
    expect(input).toHaveValue('创建一个测试任务');
  });

  it('点击 AI 解析按钮应该调用 API', async () => {
    const user = userEvent.setup();
    
    (api.aiApi.aiParse as any).mockResolvedValue({
      data: {
        data: {
          summary: '解析完成',
          tasks: [],
          risks: [],
        },
      },
    });
    
    render(<QuickInput visible={true} onClose={mockOnClose} />);
    
    const input = screen.getByPlaceholderText(/输入任务、风险或进度更新/);
    await user.type(input, '创建一个测试任务');
    
    const parseButton = screen.getByText('AI 解析');
    await user.click(parseButton);
    
    await waitFor(() => {
      expect(api.aiApi.aiParse).toHaveBeenCalledWith('创建一个测试任务');
    });
  });

  it('空输入时点击解析应该显示警告', async () => {
    const user = userEvent.setup();
    render(<QuickInput visible={true} onClose={mockOnClose} />);
    
    const parseButton = screen.getByText('AI 解析');
    await user.click(parseButton);
    
    // 应该显示警告消息
    await waitFor(() => {
      expect(screen.getByText('请输入内容')).toBeInTheDocument();
    });
  });

  it('解析成功后应该显示结果', async () => {
    const user = userEvent.setup();
    
    const parseResult = {
      summary: '识别到 1 个任务',
      tasks: [
        { title: '测试任务', priority: 'high', _isNew: true },
      ],
      risks: [],
    };
    
    (api.aiApi.aiParse as any).mockResolvedValue({
      data: { data: parseResult },
    });
    
    render(<QuickInput visible={true} onClose={mockOnClose} />);
    
    const input = screen.getByPlaceholderText(/输入任务、风险或进度更新/);
    await user.type(input, '创建一个测试任务');
    
    const parseButton = screen.getByText('AI 解析');
    await user.click(parseButton);
    
    await waitFor(() => {
      expect(screen.getByText('识别到 1 个任务')).toBeInTheDocument();
      expect(screen.getByText('测试任务')).toBeInTheDocument();
    });
  });

  it('应该显示识别的风险', async () => {
    const user = userEvent.setup();
    
    const parseResult = {
      summary: '识别到 1 个风险',
      tasks: [],
      risks: [
        { description: '测试风险', level: 'high', _isNew: true },
      ],
    };
    
    (api.aiApi.aiParse as any).mockResolvedValue({
      data: { data: parseResult },
    });
    
    render(<QuickInput visible={true} onClose={mockOnClose} />);
    
    const input = screen.getByPlaceholderText(/输入任务、风险或进度更新/);
    await user.type(input, '创建一个测试风险');
    
    const parseButton = screen.getByText('AI 解析');
    await user.click(parseButton);
    
    await waitFor(() => {
      expect(screen.getByText('测试风险')).toBeInTheDocument();
    });
  });

  it('应该能够编辑任务', async () => {
    const user = userEvent.setup();
    
    const parseResult = {
      summary: '识别到 1 个任务',
      tasks: [
        { title: '测试任务', priority: 'high', _isNew: true },
      ],
      risks: [],
    };
    
    (api.aiApi.aiParse as any).mockResolvedValue({
      data: { data: parseResult },
    });
    
    render(<QuickInput visible={true} onClose={mockOnClose} />);
    
    const input = screen.getByPlaceholderText(/输入任务、风险或进度更新/);
    await user.type(input, '创建一个测试任务');
    
    const parseButton = screen.getByText('AI 解析');
    await user.click(parseButton);
    
    await waitFor(() => {
      expect(screen.getByText('编辑')).toBeInTheDocument();
    });
    
    // 点击编辑按钮
    const editButtons = screen.getAllByText('编辑');
    await user.click(editButtons[0]);
    
    // 应该显示编辑表单
    await waitFor(() => {
      expect(screen.getByLabelText('任务标题')).toBeInTheDocument();
    });
  });

  it('应该能够删除任务', async () => {
    const user = userEvent.setup();
    
    const parseResult = {
      summary: '识别到 1 个任务',
      tasks: [
        { title: '测试任务', priority: 'high', _isNew: true },
      ],
      risks: [],
    };
    
    (api.aiApi.aiParse as any).mockResolvedValue({
      data: { data: parseResult },
    });
    
    render(<QuickInput visible={true} onClose={mockOnClose} />);
    
    const input = screen.getByPlaceholderText(/输入任务、风险或进度更新/);
    await user.type(input, '创建一个测试任务');
    
    const parseButton = screen.getByText('AI 解析');
    await user.click(parseButton);
    
    await waitFor(() => {
      expect(screen.getByText('测试任务')).toBeInTheDocument();
    });
    
    // 点击删除按钮
    const deleteButtons = screen.getAllByText('删除');
    await user.click(deleteButtons[0]);
    
    // 任务应该被删除
    await waitFor(() => {
      expect(screen.queryByText('测试任务')).not.toBeInTheDocument();
    });
  });

  it('点击确认提交应该创建任务和风险', async () => {
    const user = userEvent.setup();
    
    const parseResult = {
      summary: '识别到 1 个任务和 1 个风险',
      tasks: [
        { title: '测试任务', priority: 'high', _isNew: true },
      ],
      risks: [
        { description: '测试风险', level: 'high', _isNew: true },
      ],
    };
    
    (api.aiApi.aiParse as any).mockResolvedValue({
      data: { data: parseResult },
    });
    
    (api.taskApi.create as any).mockResolvedValue({
      data: { success: true },
    });
    
    (api.riskApi.create as any).mockResolvedValue({
      data: { success: true },
    });
    
    render(<QuickInput visible={true} onClose={mockOnClose} />);
    
    const input = screen.getByPlaceholderText(/输入任务、风险或进度更新/);
    await user.type(input, '创建任务和风险');
    
    const parseButton = screen.getByText('AI 解析');
    await user.click(parseButton);
    
    await waitFor(() => {
      expect(screen.getByText('确认提交')).toBeInTheDocument();
    });
    
    // 点击确认提交
    const submitButton = screen.getByText('确认提交');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(api.taskApi.create).toHaveBeenCalled();
      expect(api.riskApi.create).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('没有任务和风险时提交按钮应该禁用', async () => {
    const user = userEvent.setup();
    
    const parseResult = {
      summary: '未识别到内容',
      tasks: [],
      risks: [],
    };
    
    (api.aiApi.aiParse as any).mockResolvedValue({
      data: { data: parseResult },
    });
    
    render(<QuickInput visible={true} onClose={mockOnClose} />);
    
    const input = screen.getByPlaceholderText(/输入任务、风险或进度更新/);
    await user.type(input, '无意义内容');
    
    const parseButton = screen.getByText('AI 解析');
    await user.click(parseButton);
    
    await waitFor(() => {
      const submitButton = screen.getByText('确认提交');
      expect(submitButton).toBeDisabled();
    });
  });

  it('点击重新输入应该重置状态', async () => {
    const user = userEvent.setup();
    
    const parseResult = {
      summary: '识别到 1 个任务',
      tasks: [{ title: '测试任务', _isNew: true }],
      risks: [],
    };
    
    (api.aiApi.aiParse as any).mockResolvedValue({
      data: { data: parseResult },
    });
    
    render(<QuickInput visible={true} onClose={mockOnClose} />);
    
    const input = screen.getByPlaceholderText(/输入任务、风险或进度更新/);
    await user.type(input, '创建任务');
    
    const parseButton = screen.getByText('AI 解析');
    await user.click(parseButton);
    
    await waitFor(() => {
      expect(screen.getByText('重新输入')).toBeInTheDocument();
    });
    
    // 点击重新输入
    await user.click(screen.getByText('重新输入'));
    
    // 应该回到输入状态
    await waitFor(() => {
      expect(screen.getByText('AI 解析')).toBeInTheDocument();
    });
  });

  it('点击取消应该关闭弹窗', async () => {
    const user = userEvent.setup();
    render(<QuickInput visible={true} onClose={mockOnClose} />);
    
    // 找到关闭按钮（Modal 的 X 按钮）
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('应该显示快捷键提示', () => {
    render(<QuickInput visible={true} onClose={mockOnClose} />);
    
    expect(screen.getByText(/按 ⌘\/Ctrl \+ Enter 快速解析或提交/)).toBeInTheDocument();
  });

  it('按 Cmd/Ctrl + Enter 应该触发解析', async () => {
    (api.aiApi.aiParse as any).mockResolvedValue({
      data: { data: { summary: '', tasks: [], risks: [] } },
    });
    
    render(<QuickInput visible={true} onClose={mockOnClose} />);
    
    const input = screen.getByPlaceholderText(/输入任务、风险或进度更新/);
    fireEvent.change(input, { target: { value: '测试任务' } });
    fireEvent.keyDown(input, { key: 'Enter', metaKey: true });
    
    await waitFor(() => {
      expect(api.aiApi.aiParse).toHaveBeenCalled();
    });
  });

  it('应该显示优先级标签', async () => {
    const user = userEvent.setup();
    
    const parseResult = {
      summary: '',
      tasks: [
        { title: '低优先级任务', priority: 'low', _isNew: true },
        { title: '高优先级任务', priority: 'high', _isNew: true },
        { title: '紧急任务', priority: 'urgent', _isNew: true },
      ],
      risks: [],
    };
    
    (api.aiApi.aiParse as any).mockResolvedValue({
      data: { data: parseResult },
    });
    
    render(<QuickInput visible={true} onClose={mockOnClose} />);
    
    const input = screen.getByPlaceholderText(/输入任务、风险或进度更新/);
    await user.type(input, '创建任务');
    await user.click(screen.getByText('AI 解析'));
    
    await waitFor(() => {
      expect(screen.getByText('低')).toBeInTheDocument();
      expect(screen.getByText('高')).toBeInTheDocument();
      expect(screen.getByText('紧急')).toBeInTheDocument();
    });
  });

  it('应该显示风险级别标签', async () => {
    const user = userEvent.setup();
    
    const parseResult = {
      summary: '',
      tasks: [],
      risks: [
        { description: '低风险', level: 'low', _isNew: true },
        { description: '高风险', level: 'high', _isNew: true },
        { description: '严重风险', level: 'critical', _isNew: true },
      ],
    };
    
    (api.aiApi.aiParse as any).mockResolvedValue({
      data: { data: parseResult },
    });
    
    render(<QuickInput visible={true} onClose={mockOnClose} />);
    
    const input = screen.getByPlaceholderText(/输入任务、风险或进度更新/);
    await user.type(input, '创建风险');
    await user.click(screen.getByText('AI 解析'));
    
    await waitFor(() => {
      expect(screen.getByText('低风险')).toBeInTheDocument();
      expect(screen.getByText('高风险')).toBeInTheDocument();
      expect(screen.getByText('严重风险')).toBeInTheDocument();
    });
  });
});
