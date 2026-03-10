import { useEffect, useState } from 'react';
import { Table, Button, Tag, Select, Space, Input, Card, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { taskApi, projectApi } from '../api';
import { Task, Project } from '../types';

export default function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ project_id: '', status: '', assignee_id: '', keyword: '' });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [filters]);

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

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await taskApi.getAll(filters);
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (error) {
      message.error('加载任务失败');
    } finally {
      setLoading(false);
    }
  };

  const flattenTasks = (taskList: Task[]): Task[] => {
    return taskList.reduce((acc: Task[], task) => {
      acc.push(task);
      if (task.children && task.children.length > 0) {
        acc.push(...flattenTasks(task.children));
      }
      return acc;
    }, []);
  };

  const flatTasks = flattenTasks(tasks);

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
      key: 'project',
      render: (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        return project?.name || '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
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
      render: (progress: number) => `${progress}%`,
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
  ];

  return (
    <div>
      <div className="page-header">
        <h1>任务管理</h1>
        <p className="subtitle">查看和管理所有任务</p>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="选择项目"
            allowClear
            style={{ width: 200 }}
            value={filters.project_id || undefined}
            onChange={(value) => setFilters({ ...filters, project_id: value || '' })}
          >
            {projects.map(p => (
              <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
            ))}
          </Select>
          <Select
            placeholder="任务状态"
            allowClear
            style={{ width: 120 }}
            value={filters.status || undefined}
            onChange={(value) => setFilters({ ...filters, status: value || '' })}
          >
            <Select.Option value="pending">未开始</Select.Option>
            <Select.Option value="in_progress">进行中</Select.Option>
            <Select.Option value="completed">已完成</Select.Option>
            <Select.Option value="paused">已暂停</Select.Option>
            <Select.Option value="cancelled">已取消</Select.Option>
          </Select>
          <Input
            placeholder="搜索任务..."
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            onPressEnter={() => loadTasks()}
          />
          <Button onClick={loadTasks}>搜索</Button>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={flatTasks}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
