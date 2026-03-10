import { useEffect, useState } from 'react';
import { Row, Col, List, Tag, Typography, Spin, Space, Button, Card, Progress, Empty } from 'antd';
import { 
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  RightOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { workbenchApi } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Todo {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  project_name?: string;
  status: string;
}

interface Schedule {
  id: string;
  title: string;
  time: string;
  type: string;
  project_name?: string;
}

interface Stats {
  weeklyCompleted: number;
  onTimeRate: number;
  avgResponseTime: number;
}

export default function Workbench() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [todosRes, scheduleRes, statsRes] = await Promise.all([
        workbenchApi.getTodos(),
        workbenchApi.getSchedule(),
        workbenchApi.getStats(),
      ]);
      
      if (todosRes.data.success) {
        setTodos(todosRes.data.data);
      }
      if (scheduleRes.data.success) {
        setSchedule(scheduleRes.data.data);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load workbench data');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTodo = async (id: string) => {
    try {
      const res = await workbenchApi.completeTodo(id);
      if (res.data.success) {
        setTodos(todos.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to complete todo');
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'default',
      medium: 'blue',
      high: 'orange',
      urgent: 'red',
    };
    return colors[priority] || 'default';
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
      urgent: '紧急',
    };
    return labels[priority] || priority;
  };

  const sortedTodos = [...todos].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    return 0;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <Title level={2} style={{ margin: 0 }}>个人工作台</Title>
        <Text type="secondary">管理您的待办事项和日程安排</Text>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircleOutlined />
          </div>
          <div className="stat-value">{stats?.weeklyCompleted || 0}</div>
          <div className="stat-label">本周完成</div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-icon">
            <TrophyOutlined />
          </div>
          <div className="stat-value">{stats?.onTimeRate || 0}%</div>
          <div className="stat-label">按时完成率</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <ThunderboltOutlined />
          </div>
          <div className="stat-value">{stats?.avgResponseTime || 0}h</div>
          <div className="stat-label">平均响应时间</div>
        </div>
        <div className="stat-card stat-warning">
          <div className="stat-icon">
            <ClockCircleOutlined />
          </div>
          <div className="stat-value">{todos.length}</div>
          <div className="stat-label">待办事项</div>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <div className="chart-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="chart-title" style={{ margin: 0 }}>待办事项</span>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/tasks')}
                className="btn-primary-gradient"
              >
                新建任务
              </Button>
            </div>
            {sortedTodos.length > 0 ? (
              <List
                dataSource={sortedTodos}
                renderItem={(item) => (
                  <List.Item 
                    style={{ 
                      padding: '12px 16px', 
                      borderRadius: 8, 
                      marginBottom: 8,
                      background: 'var(--color-bg-subtle)',
                      transition: 'all 200ms'
                    }}
                    actions={[
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleCompleteTodo(item.id)}
                        style={{ color: 'var(--color-success)' }}
                      />
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                            {item.title}
                          </span>
                          <Tag color={getPriorityColor(item.priority)} style={{ margin: 0 }}>
                            {getPriorityLabel(item.priority)}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space size="small">
                          {item.project_name && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.project_name}
                            </Text>
                          )}
                          {item.due_date && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <ClockCircleOutlined style={{ marginRight: 4 }} />
                              {dayjs(item.due_date).format('MM-DD HH:mm')}
                            </Text>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty 
                description="暂无待办事项" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        </Col>

        <Col xs={24} lg={12}>
          <div className="chart-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="chart-title" style={{ margin: 0 }}>今日日程</span>
              <Text type="secondary">{dayjs().format('YYYY年MM月DD日')}</Text>
            </div>
            {schedule.length > 0 ? (
              <List
                dataSource={schedule}
                renderItem={(item) => (
                  <List.Item 
                    style={{ 
                      padding: '12px 16px', 
                      borderRadius: 8, 
                      marginBottom: 8,
                      background: 'var(--color-bg-subtle)',
                      transition: 'all 200ms'
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          background: 'var(--gradient-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 600
                        }}>
                          {item.time}
                        </div>
                      }
                      title={
                        <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                          {item.title}
                        </span>
                      }
                      description={
                        <Space size="small">
                          <Tag color="blue" style={{ margin: 0 }}>{item.type}</Tag>
                          {item.project_name && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.project_name}
                            </Text>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty 
                description="今日暂无日程安排" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        </Col>
      </Row>

      <div className="chart-container" style={{ marginTop: 24 }}>
        <div className="chart-title">快捷操作</div>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={6}>
            <Card 
              hoverable 
              className="btn-hover-effect"
              onClick={() => navigate('/tasks')}
              style={{ textAlign: 'center', borderRadius: 12 }}
            >
              <div style={{ fontSize: 32, marginBottom: 8, color: 'var(--color-primary)' }}>
                <CheckCircleOutlined />
              </div>
              <Text strong>任务管理</Text>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card 
              hoverable 
              className="btn-hover-effect"
              onClick={() => navigate('/projects')}
              style={{ textAlign: 'center', borderRadius: 12 }}
            >
              <div style={{ fontSize: 32, marginBottom: 8, color: 'var(--color-secondary)' }}>
                <CalendarOutlined />
              </div>
              <Text strong>项目管理</Text>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card 
              hoverable 
              className="btn-hover-effect"
              onClick={() => navigate('/risks')}
              style={{ textAlign: 'center', borderRadius: 12 }}
            >
              <div style={{ fontSize: 32, marginBottom: 8, color: 'var(--color-warning)' }}>
                <TrophyOutlined />
              </div>
              <Text strong>风险管理</Text>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card 
              hoverable 
              className="btn-hover-effect"
              onClick={() => navigate('/team')}
              style={{ textAlign: 'center', borderRadius: 12 }}
            >
              <div style={{ fontSize: 32, marginBottom: 8, color: 'var(--color-success)' }}>
                <ThunderboltOutlined />
              </div>
              <Text strong>团队协作</Text>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
