import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Descriptions, Tag, Button, Progress, Space, Modal, Form, Input, Select, DatePicker, Slider, List, message, Avatar } from 'antd';
import { ArrowLeftOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { taskApi, authApi } from '../api';
import { Task, User, TaskComment } from '../types';

const { TextArea } = Input;

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [progressForm] = Form.useForm();

  useEffect(() => {
    loadTask();
    loadUsers();
  }, [id]);

  const loadTask = async () => {
    try {
      const res = await taskApi.getById(id!);
      if (res.data.success) {
        setTask(res.data.data);
      }
    } catch (error) {
      message.error('加载任务失败');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await authApi.getUsers();
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const handleUpdate = async (values: any) => {
    try {
      const data = {
        ...values,
        start_date: values.start_date?.format('YYYY-MM-DD'),
        end_date: values.end_date?.format('YYYY-MM-DD'),
      };
      await taskApi.update(id!, data);
      message.success('任务已更新');
      setEditModalVisible(false);
      loadTask();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleProgressUpdate = async (values: any) => {
    try {
      await taskApi.updateProgress(id!, values);
      message.success('进度已更新');
      setProgressModalVisible(false);
      loadTask();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleAddComment = async (values: { content: string }) => {
    try {
      await taskApi.addComment(id!, values.content);
      message.success('评论已添加');
      loadTask();
    } catch (error) {
      message.error('添加失败');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'default',
      in_progress: 'processing',
      completed: 'success',
      paused: 'warning',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'green',
      medium: 'blue',
      high: 'orange',
      urgent: 'red',
    };
    return colors[priority] || 'default';
  };

  const getRiskLevelColor = (level?: string) => {
    const colors: Record<string, string> = {
      low: 'green',
      medium: 'blue',
      high: 'orange',
      critical: 'red',
    };
    return level ? colors[level] : 'default';
  };

  if (loading) return <div>加载中...</div>;
  if (!task) return <div>任务不存在</div>;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card title={task.title} extra={
            <Space>
              <Button icon={<EditOutlined />} onClick={() => {
                form.setFieldsValue({
                  ...task,
                  start_date: task.start_date ? dayjs(task.start_date) : null,
                  end_date: task.end_date ? dayjs(task.end_date) : null,
                });
                setEditModalVisible(true);
              }}>编辑</Button>
              <Button type="primary" onClick={() => {
                progressForm.setFieldsValue({ progress: task.progress, status: task.status });
                setProgressModalVisible(true);
              }}>更新进度</Button>
            </Space>
          }>
            <div style={{ marginBottom: 24 }}>
              <Space>
                <Tag color={getStatusColor(task.status)}>{task.status}</Tag>
                <Tag color={getPriorityColor(task.priority)}>{task.priority}</Tag>
                {task.risk_level && <Tag color={getRiskLevelColor(task.risk_level)}>风险: {task.risk_level}</Tag>}
              </Space>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>任务进度</span>
                <span>{task.progress}%</span>
              </div>
              <Progress percent={task.progress} status="active" />
            </div>

            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="负责人">{task.assignee_name || '未分配'}</Descriptions.Item>
              <Descriptions.Item label="创建人">{task.creator_name}</Descriptions.Item>
              <Descriptions.Item label="开始日期">{task.start_date ? dayjs(task.start_date).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
              <Descriptions.Item label="结束日期">{task.end_date ? dayjs(task.end_date).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
            </Descriptions>

            {task.description && (
              <div style={{ marginTop: 24 }}>
                <h4>任务描述</h4>
                <p>{task.description}</p>
              </div>
            )}

            {task.risk_description && (
              <div style={{ marginTop: 24 }}>
                <h4>风险说明</h4>
                <p style={{ color: '#f5222d' }}>{task.risk_description}</p>
              </div>
            )}
          </Card>

          <Card title="评论" style={{ marginTop: 16 }}>
            <List
              dataSource={task.comments || []}
              renderItem={(comment: TaskComment) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{comment.user_name}</div>
                    <div style={{ marginBottom: 4 }}>{comment.content}</div>
                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>{dayjs(comment.created_at).format('YYYY-MM-DD HH:mm')}</div>
                  </div>
                </List.Item>
              )}
              locale={{ emptyText: '暂无评论' }}
            />
            <div style={{ marginTop: 16 }}>
              <Form layout="vertical" onFinish={handleAddComment}>
                <Form.Item name="content" rules={[{ required: true, message: '请输入评论内容' }]}>
                  <TextArea rows={3} placeholder="添加评论..." />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">提交评论</Button>
                </Form.Item>
              </Form>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="子任务">
            {task.children && task.children.length > 0 ? (
              <List
                dataSource={task.children}
                renderItem={(child: Task) => (
                  <List.Item>
                    <Space>
                      <Tag color={getStatusColor(child.status)}>{child.status}</Tag>
                      <a>{child.title}</a>
                      <span>{child.progress}%</span>
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <p style={{ color: '#8c8c8c' }}>暂无子任务</p>
            )}
          </Card>
        </Col>
      </Row>

      <Modal title="编辑任务" open={editModalVisible} onCancel={() => setEditModalVisible(false)} footer={null} width={640}>
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item name="title" label="任务标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="任务描述">
            <TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select>
                  <Select.Option value="pending">未开始</Select.Option>
                  <Select.Option value="in_progress">进行中</Select.Option>
                  <Select.Option value="completed">已完成</Select.Option>
                  <Select.Option value="paused">已暂停</Select.Option>
                  <Select.Option value="cancelled">已取消</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="优先级">
                <Select>
                  <Select.Option value="low">低</Select.Option>
                  <Select.Option value="medium">中</Select.Option>
                  <Select.Option value="high">高</Select.Option>
                  <Select.Option value="urgent">紧急</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assignee_id" label="负责人">
                <Select allowClear>
                  {users.map(u => (
                    <Select.Option key={u.id} value={u.id}>{u.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="risk_level" label="风险等级">
                <Select allowClear>
                  <Select.Option value="low">低</Select.Option>
                  <Select.Option value="medium">中</Select.Option>
                  <Select.Option value="high">高</Select.Option>
                  <Select.Option value="critical">严重</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_date" label="开始日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_date" label="结束日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="risk_description" label="风险描述">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setEditModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="更新进度" open={progressModalVisible} onCancel={() => setProgressModalVisible(false)} footer={null}>
        <Form form={progressForm} layout="vertical" onFinish={handleProgressUpdate}>
          <Form.Item name="progress" label="进度">
            <Slider marks={{ 0: '0%', 50: '50%', 100: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="pending">未开始</Select.Option>
              <Select.Option value="in_progress">进行中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="paused">已暂停</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="进度说明">
            <TextArea rows={3} placeholder="记录工作进展..." />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setProgressModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
