import { useEffect, useState } from 'react';
import { Table, Tag, Button, Modal, Form, Input, Select, DatePicker, Space, message, Popconfirm, Progress } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { taskApi, projectApi } from '../api';
import { Task, Project } from '../types';

const { TextArea } = Input;

export default function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTasks();
    loadProjects();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await taskApi.getAll();
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (error) {
      message.error('加载任务失败');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const res = await projectApi.getAll();
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load projects');
    }
  };

  const handleCreate = () => {
    setEditingTask(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    form.setFieldsValue({
      ...task,
      start_date: task.start_date ? dayjs(task.start_date) : null,
      end_date: task.end_date ? dayjs(task.end_date) : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await taskApi.delete(id);
      if (res.data.success) {
        message.success('任务已删除');
        loadTasks();
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        start_date: values.start_date?.format('YYYY-MM-DD'),
        end_date: values.end_date?.format('YYYY-MM-DD'),
      };

      if (editingTask) {
        const res = await taskApi.update(editingTask.id, data);
        if (res.data.success) {
          message.success('任务已更新');
        }
      } else {
        const res = await taskApi.create(data);
        if (res.data.success) {
          message.success('任务已创建');
        }
      }
      setModalVisible(false);
      loadTasks();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待处理',
      in_progress: '进行中',
      completed: '已完成',
      paused: '已暂停',
      cancelled: '已取消',
    };
    return labels[status] || status;
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
      title: '所属项目',
      dataIndex: 'project_id',
      key: 'project_id',
      render: (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        return project?.name || '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => <Tag color={getPriorityColor(priority)}>{priority}</Tag>,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => <Progress percent={progress || 0} size="small" />,
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
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除此任务?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>任务管理</h1>
          <p className="subtitle" style={{ margin: '4px 0 0' }}>管理所有项目任务</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} size="large">
          新建任务
        </Button>
      </div>

      <div className="chart-container">
        <Table columns={columns} dataSource={tasks} rowKey="id" loading={loading} />
      </div>

      <Modal
        title={editingTask ? '编辑任务' : '新建任务'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 24 }}>
          <Form.Item name="title" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input placeholder="请输入任务名称" size="large" />
          </Form.Item>
          <Form.Item name="description" label="任务描述">
            <TextArea rows={3} placeholder="请输入任务描述" />
          </Form.Item>
          <Form.Item name="project_id" label="所属项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select placeholder="请选择项目" size="large">
              {projects.map(p => (
                <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="pending">
            <Select size="large">
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="in_progress">进行中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="paused">已暂停</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue="medium">
            <Select size="large">
              <Select.Option value="low">低</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="urgent">紧急</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="progress" label="进度" initialValue={0}>
            <Select size="large">
              {Array.from({ length: 11 }, (_, i) => i * 10).map(v => (
                <Select.Option key={v} value={v}>{v}%</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_date" label="开始日期">
                <DatePicker style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_date" label="截止日期">
                <DatePicker style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">{editingTask ? '保存' : '创建'}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

import { Row, Col } from 'antd';
