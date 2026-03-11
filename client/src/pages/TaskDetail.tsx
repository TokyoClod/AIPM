import { useEffect, useState } from 'react';
import { Card, Descriptions, Tag, Button, Space, message, Typography, Progress, List, Avatar } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { taskApi, projectApi } from '../api';
import { Task, Project } from '../types';

const { Title, Text } = Typography;

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadTask();
    }
  }, [id]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const res = await taskApi.getById(id!);
      if (res.data.success) {
        setTask(res.data.data);
        if (res.data.data.project_id) {
          const projectRes = await projectApi.getById(res.data.data.project_id);
          if (projectRes.data.success) {
            setProject(projectRes.data.data);
          }
        }
      }
    } catch (error) {
      message.error('加载任务失败');
    } finally {
      setLoading(false);
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

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}>加载中...</div>;
  }

  if (!task) {
    return <div style={{ textAlign: 'center', padding: 100 }}>任务不存在</div>;
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/tasks')}>
          返回任务列表
        </Button>
      </div>

      <Card loading={loading}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>{task.title}</Title>
            <Text type="secondary">{project?.name || '未分配项目'}</Text>
          </div>
          <Space>
            <Tag color={getStatusColor(task.status)}>{getStatusLabel(task.status)}</Tag>
            <Tag color={getPriorityColor(task.priority)}>{task.priority}</Tag>
          </Space>
        </div>

        <Descriptions bordered column={2}>
          <Descriptions.Item label="任务描述" span={2}>
            {task.description || '暂无描述'}
          </Descriptions.Item>
          <Descriptions.Item label="进度">
            <Progress percent={task.progress || 0} />
          </Descriptions.Item>
          <Descriptions.Item label="负责人">
            {task.assignee_name || '未分配'}
          </Descriptions.Item>
          <Descriptions.Item label="开始日期">
            {task.start_date ? dayjs(task.start_date).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="截止日期">
            {task.end_date ? dayjs(task.end_date).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(task.created_at).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {dayjs(task.updated_at).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
