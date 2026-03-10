import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Progress, Tabs, Table, Tag, Button, Space, Modal, Form, Input, Select, DatePicker, Slider, message, Dropdown, Menu } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, ArrowLeftOutlined, DragOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { projectApi, taskApi } from '../api';
import { useProjectStore } from '../stores/projectStore';
import { useAuthStore } from '../stores/authStore';
import { Task, ProjectDashboard } from '../types';
import KanbanBoard from '../components/Task/KanbanBoard';
import GanttChart from '../components/Task/GanttChart';

const { TextArea } = Input;

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projectDashboard, setProjectDashboard } = useProjectStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const [activeView, setActiveView] = useState('list');

  useEffect(() => {
    if (id) loadProjectDashboard(id);
  }, [id]);

  const loadProjectDashboard = async (projectId: string) => {
    setLoading(true);
    try {
      const res = await projectApi.getDashboard(projectId);
      if (res.data.success) {
        setProjectDashboard(res.data.data);
      }
    } catch (error) {
      message.error('加载项目失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = (parentId?: string) => {
    setEditingTask(null);
    form.resetFields();
    if (parentId) form.setFieldsValue({ parent_id: parentId });
    setTaskModalVisible(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    form.setFieldsValue({
      ...task,
      start_date: task.start_date ? dayjs(task.start_date) : null,
      end_date: task.end_date ? dayjs(task.end_date) : null,
    });
    setTaskModalVisible(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskApi.delete(taskId);
      message.success('任务已删除');
      if (id) loadProjectDashboard(id);
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleTaskSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        project_id: id,
        start_date: values.start_date?.format('YYYY-MM-DD'),
        end_date: values.end_date?.format('YYYY-MM-DD'),
      };

      if (editingTask) {
        await taskApi.update(editingTask.id, data);
        message.success('任务已更新');
      } else {
        await taskApi.create(data);
        message.success('任务已创建');
      }
      setTaskModalVisible(false);
      if (id) loadProjectDashboard(id);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleTaskStatusChange = async (taskId: string, status: string) => {
    try {
      await taskApi.update(taskId, { status });
      if (id) loadProjectDashboard(id);
    } catch (error) {
      message.error('更新失败');
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

  const chartOption = {
    tooltip: { trigger: 'item' },
    legend: { top: '5%', left: 'center' },
    series: [
      {
        name: '任务状态',
        type: 'pie',
        radius: ['40%', '70%'],
        data: projectDashboard?.taskDistribution?.map((d: any) => ({
          value: d.count,
          name: d.status,
        })) || [],
      },
    ],
  };

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Task) => (
        <a onClick={() => navigate(`/tasks/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{priority}</Tag>
      ),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => <Progress percent={progress} size="small" />,
    },
    {
      title: '负责人',
      dataIndex: 'assignee_name',
      key: 'assignee_name',
    },
    {
      title: '截止日期',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Task) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEditTask(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDeleteTask(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  if (loading || !projectDashboard) {
    return <div>加载中...</div>;
  }

  const { project, stats, taskDistribution, riskItems, upcomingTasks, memberWorkload } = projectDashboard;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')}>
          返回项目列表
        </Button>
      </div>

      <div className="page-header">
        <h1>{project.name}</h1>
        <p className="subtitle">{project.description || '暂无描述'}</p>
      </div>

      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card>
            <Row gutter={16} align="middle">
              <Col>
                <Progress type="circle" percent={stats.completionRate} />
              </Col>
              <Col>
                <div>项目进度</div>
                <div style={{ color: '#8c8c8c' }}>
                  已完成 {stats.completedTasks} / {stats.totalTasks} 任务
                </div>
              </Col>
              <Col style={{ marginLeft: 'auto' }}>
                <Space>
                  <Tag color="green">进行中: {stats.inProgressTasks}</Tag>
                  <Tag color="blue">待处理: {stats.pendingTasks}</Tag>
                  <Tag color="red">延期: {stats.overdueTasks}</Tag>
                  <Tag color="orange">风险: {stats.criticalRisks}</Tag>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Tabs 
        activeKey={activeView} 
        onChange={setActiveView}
        items={[
          {
            key: 'list',
            label: '列表视图',
            children: (
              <Card 
                title="任务列表" 
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => handleCreateTask()}>
                    新建任务
                  </Button>
                }
              >
                <Table
                  columns={columns}
                  dataSource={upcomingTasks}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
          {
            key: 'kanban',
            label: '看板视图',
            children: (
              <KanbanBoard 
                projectId={id!} 
                onTaskUpdate={() => id && loadProjectDashboard(id)}
              />
            ),
          },
          {
            key: 'gantt',
            label: '甘特图',
            children: <GanttChart projectId={id!} />,
          },
        ]}
      />

      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="任务分布">
            <ReactECharts option={chartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="团队工作量">
            {memberWorkload?.map((member: any) => (
              <div key={member.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>{member.name}</span>
                  <span>{member.completedCount}/{member.taskCount} 任务</span>
                </div>
                <Progress 
                  percent={member.taskCount > 0 ? Math.round((member.completedCount / member.taskCount) * 100) : 0} 
                  size="small"
                />
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingTask ? '编辑任务' : '新建任务'}
        open={taskModalVisible}
        onCancel={() => setTaskModalVisible(false)}
        footer={null}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleTaskSubmit}>
          <Form.Item name="title" label="任务标题" rules={[{ required: true, message: '请输入任务标题' }]}>
            <Input placeholder="请输入任务标题" />
          </Form.Item>
          <Form.Item name="description" label="任务描述">
            <TextArea rows={3} placeholder="请输入任务描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="状态" initialValue="pending">
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
              <Form.Item name="priority" label="优先级" initialValue="medium">
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
          <Form.Item name="progress" label="进度">
            <Slider marks={{ 0: '0%', 50: '50%', 100: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setTaskModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
