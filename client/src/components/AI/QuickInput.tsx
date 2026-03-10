import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, Button, Spin, Card, Form, Select, InputNumber, Tag, Space, message, Divider } from 'antd';
import { ThunderboltOutlined, CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { aiApi, taskApi, riskApi, projectApi } from '../../api';
import { Task, Risk, Project, AIParseResult } from '../../types';

const { TextArea } = Input;
const { Option } = Select;

interface QuickInputProps {
  visible: boolean;
  onClose: () => void;
}

interface ParsedTask extends Partial<Task> {
  _isNew?: boolean;
}

interface ParsedRisk extends Partial<Risk> {
  _isNew?: boolean;
}

const QuickInput: React.FC<QuickInputProps> = ({ visible, onClose }) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parseResult, setParseResult] = useState<AIParseResult | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [editingRiskIndex, setEditingRiskIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<any>(null);
  const [taskForm] = Form.useForm();
  const [riskForm] = Form.useForm();

  // 加载项目列表
  useEffect(() => {
    if (visible) {
      loadProjects();
      // 自动聚焦到输入框
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  // 重置状态
  useEffect(() => {
    if (!visible) {
      setInputText('');
      setParseResult(null);
      setEditingTaskIndex(null);
      setEditingRiskIndex(null);
      setLoading(false);
      setSubmitting(false);
    }
  }, [visible]);

  const loadProjects = async () => {
    try {
      const response = await projectApi.getAll();
      setProjects(response.data.data || []);
    } catch (error) {
      console.error('加载项目失败:', error);
    }
  };

  // 解析输入内容
  const handleParse = async () => {
    if (!inputText.trim()) {
      message.warning('请输入内容');
      return;
    }

    setLoading(true);
    try {
      const response = await aiApi.aiParse(inputText);
      const result = response.data.data as AIParseResult;
      
      // 为每个解析结果添加标记
      if (result.tasks) {
        result.tasks = result.tasks.map(task => ({ ...task, _isNew: true }));
      }
      if (result.risks) {
        result.risks = result.risks = result.risks.map(risk => ({ ...risk, _isNew: true }));
      }
      
      setParseResult(result);
      message.success('解析完成');
    } catch (error: any) {
      message.error(error.response?.data?.message || '解析失败');
    } finally {
      setLoading(false);
    }
  };

  // 编辑任务
  const handleEditTask = (index: number) => {
    const task = parseResult?.tasks?.[index];
    if (task) {
      taskForm.setFieldsValue({
        title: task.title || '',
        description: task.description || '',
        project_id: task.project_id,
        priority: task.priority || 'medium',
      });
      setEditingTaskIndex(index);
    }
  };

  // 保存任务编辑
  const handleSaveTask = async () => {
    try {
      const values = await taskForm.validateFields();
      if (parseResult?.tasks && editingTaskIndex !== null) {
        parseResult.tasks[editingTaskIndex] = {
          ...parseResult.tasks[editingTaskIndex],
          ...values,
        };
        setParseResult({ ...parseResult });
        setEditingTaskIndex(null);
        message.success('任务已更新');
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 删除任务
  const handleDeleteTask = (index: number) => {
    if (parseResult?.tasks) {
      parseResult.tasks.splice(index, 1);
      setParseResult({ ...parseResult });
      message.success('任务已删除');
    }
  };

  // 编辑风险
  const handleEditRisk = (index: number) => {
    const risk = parseResult?.risks?.[index];
    if (risk) {
      riskForm.setFieldsValue({
        description: risk.description || '',
        level: risk.level || 'medium',
        project_id: risk.project_id,
        mitigation: risk.mitigation || '',
      });
      setEditingRiskIndex(index);
    }
  };

  // 保存风险编辑
  const handleSaveRisk = async () => {
    try {
      const values = await riskForm.validateFields();
      if (parseResult?.risks && editingRiskIndex !== null) {
        parseResult.risks[editingRiskIndex] = {
          ...parseResult.risks[editingRiskIndex],
          ...values,
        };
        setParseResult({ ...parseResult });
        setEditingRiskIndex(null);
        message.success('风险已更新');
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 删除风险
  const handleDeleteRisk = (index: number) => {
    if (parseResult?.risks) {
      parseResult.risks.splice(index, 1);
      setParseResult({ ...parseResult });
      message.success('风险已删除');
    }
  };

  // 提交所有数据
  const handleSubmit = async () => {
    if (!parseResult) return;

    setSubmitting(true);
    try {
      const promises: Promise<any>[] = [];

      // 创建任务
      if (parseResult.tasks && parseResult.tasks.length > 0) {
        parseResult.tasks.forEach(task => {
          if (task.title) {
            promises.push(taskApi.create({
              title: task.title,
              description: task.description,
              project_id: task.project_id,
              priority: task.priority || 'medium',
              status: 'pending',
              progress: 0,
            }));
          }
        });
      }

      // 创建风险
      if (parseResult.risks && parseResult.risks.length > 0) {
        parseResult.risks.forEach(risk => {
          if (risk.description) {
            promises.push(riskApi.create({
              description: risk.description,
              level: risk.level || 'medium',
              project_id: risk.project_id,
              mitigation: risk.mitigation,
              type: 'other',
              status: 'identified',
            }));
          }
        });
      }

      await Promise.all(promises);
      message.success('数据已成功创建');
      onClose();
    } catch (error: any) {
      message.error(error.response?.data?.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!parseResult) {
        handleParse();
      } else {
        handleSubmit();
      }
    }
  };

  const getPriorityColor = (priority?: string) => {
    const colors: Record<string, string> = {
      low: 'default',
      medium: 'blue',
      high: 'orange',
      urgent: 'red',
    };
    return colors[priority || 'medium'] || 'default';
  };

  const getRiskLevelColor = (level?: string) => {
    const colors: Record<string, string> = {
      low: 'green',
      medium: 'blue',
      high: 'orange',
      critical: 'red',
    };
    return colors[level || 'medium'] || 'default';
  };

  return (
    <Modal
      title={
        <Space>
          <ThunderboltOutlined style={{ color: '#1890ff' }} />
          <span>快速录入</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
      destroyOnClose
      keyboard
      maskClosable={false}
    >
      <div style={{ marginBottom: 16 }}>
        <TextArea
          ref={inputRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入任务、风险或进度更新，例如：&#10;- 创建任务：完成用户登录功能开发，优先级高，属于项目A&#10;- 创建风险：数据库性能可能成为瓶颈，级别高&#10;- 更新进度：任务123进度更新为80%"
          rows={4}
          disabled={loading || !!parseResult}
        />
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#999', fontSize: 12 }}>
            提示：按 ⌘/Ctrl + Enter 快速解析或提交
          </span>
          {!parseResult && (
            <Button
              type="primary"
              onClick={handleParse}
              loading={loading}
              icon={<ThunderboltOutlined />}
            >
              AI 解析
            </Button>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin tip="AI 正在解析..." />
        </div>
      )}

      {parseResult && (
        <>
          {parseResult.summary && (
            <Card size="small" style={{ marginBottom: 16, background: '#f5f7fa' }}>
              <strong>解析摘要：</strong> {parseResult.summary}
            </Card>
          )}

          {/* 任务列表 */}
          {parseResult.tasks && parseResult.tasks.length > 0 && (
            <>
              <Divider orientation="left">识别的任务 ({parseResult.tasks.length})</Divider>
              {parseResult.tasks.map((task, index) => (
                <Card
                  key={index}
                  size="small"
                  style={{ marginBottom: 8 }}
                  extra={
                    <Space>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditTask(index)}
                      >
                        编辑
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => handleDeleteTask(index)}
                      >
                        删除
                      </Button>
                    </Space>
                  }
                >
                  {editingTaskIndex === index ? (
                    <Form form={taskForm} layout="vertical" size="small">
                      <Form.Item
                        name="title"
                        label="任务标题"
                        rules={[{ required: true, message: '请输入任务标题' }]}
                      >
                        <Input />
                      </Form.Item>
                      <Form.Item name="description" label="任务描述">
                        <TextArea rows={2} />
                      </Form.Item>
                      <Form.Item name="project_id" label="所属项目">
                        <Select placeholder="选择项目">
                          {projects.map(p => (
                            <Option key={p.id} value={p.id}>{p.name}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item name="priority" label="优先级">
                        <Select>
                          <Option value="low">低</Option>
                          <Option value="medium">中</Option>
                          <Option value="high">高</Option>
                          <Option value="urgent">紧急</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item>
                        <Space>
                          <Button type="primary" size="small" onClick={handleSaveTask}>
                            保存
                          </Button>
                          <Button size="small" onClick={() => setEditingTaskIndex(null)}>
                            取消
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  ) : (
                    <>
                      <div style={{ marginBottom: 8 }}>
                        <strong>{task.title}</strong>
                        {task.priority && (
                          <Tag color={getPriorityColor(task.priority)} style={{ marginLeft: 8 }}>
                            {task.priority === 'low' ? '低' : 
                             task.priority === 'medium' ? '中' : 
                             task.priority === 'high' ? '高' : '紧急'}
                          </Tag>
                        )}
                      </div>
                      {task.description && (
                        <div style={{ color: '#666', fontSize: 13 }}>{task.description}</div>
                      )}
                      {task.project_id && (
                        <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                          项目：{projects.find(p => p.id === task.project_id)?.name || task.project_id}
                        </div>
                      )}
                    </>
                  )}
                </Card>
              ))}
            </>
          )}

          {/* 风险列表 */}
          {parseResult.risks && parseResult.risks.length > 0 && (
            <>
              <Divider orientation="left">识别的风险 ({parseResult.risks.length})</Divider>
              {parseResult.risks.map((risk, index) => (
                <Card
                  key={index}
                  size="small"
                  style={{ marginBottom: 8 }}
                  extra={
                    <Space>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditRisk(index)}
                      >
                        编辑
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => handleDeleteRisk(index)}
                      >
                        删除
                      </Button>
                    </Space>
                  }
                >
                  {editingRiskIndex === index ? (
                    <Form form={riskForm} layout="vertical" size="small">
                      <Form.Item
                        name="description"
                        label="风险描述"
                        rules={[{ required: true, message: '请输入风险描述' }]}
                      >
                        <TextArea rows={2} />
                      </Form.Item>
                      <Form.Item name="level" label="风险级别">
                        <Select>
                          <Option value="low">低</Option>
                          <Option value="medium">中</Option>
                          <Option value="high">高</Option>
                          <Option value="critical">严重</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item name="project_id" label="所属项目">
                        <Select placeholder="选择项目">
                          {projects.map(p => (
                            <Option key={p.id} value={p.id}>{p.name}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item name="mitigation" label="缓解措施">
                        <TextArea rows={2} />
                      </Form.Item>
                      <Form.Item>
                        <Space>
                          <Button type="primary" size="small" onClick={handleSaveRisk}>
                            保存
                          </Button>
                          <Button size="small" onClick={() => setEditingRiskIndex(null)}>
                            取消
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  ) : (
                    <>
                      <div style={{ marginBottom: 8 }}>
                        <Tag color={getRiskLevelColor(risk.level)}>
                          {risk.level === 'low' ? '低风险' : 
                           risk.level === 'medium' ? '中风险' : 
                           risk.level === 'high' ? '高风险' : '严重风险'}
                        </Tag>
                      </div>
                      <div style={{ marginBottom: 8 }}>{risk.description}</div>
                      {risk.mitigation && (
                        <div style={{ color: '#666', fontSize: 13 }}>
                          缓解措施：{risk.mitigation}
                        </div>
                      )}
                      {risk.project_id && (
                        <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                          项目：{projects.find(p => p.id === risk.project_id)?.name || risk.project_id}
                        </div>
                      )}
                    </>
                  )}
                </Card>
              ))}
            </>
          )}

          {/* 操作按钮 */}
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => {
              setParseResult(null);
              setInputText('');
            }}>
              重新输入
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={submitting}
              icon={<CheckOutlined />}
              disabled={
                (!parseResult.tasks || parseResult.tasks.length === 0) &&
                (!parseResult.risks || parseResult.risks.length === 0)
              }
            >
              确认提交
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default QuickInput;
