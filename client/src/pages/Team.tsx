import { useEffect, useState } from 'react';
import { Row, Col, Card, Avatar, Progress, Typography, Spin, Tag, Space, Badge, Empty, List, Input, Button, message } from 'antd';
import { 
  UserOutlined,
  TeamOutlined,
  MessageOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { teamApi } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  workload: number;
  currentTask?: string;
  projectCount: number;
  taskCount: number;
}

interface WorkloadSummary {
  totalMembers: number;
  onlineMembers: number;
  avgWorkload: number;
  overloadedMembers: number;
}

interface Message {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

export default function Team() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [workloadSummary, setWorkloadSummary] = useState<WorkloadSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statusRes, workloadRes, messagesRes] = await Promise.all([
        teamApi.getStatus(),
        teamApi.getWorkloadSummary(),
        teamApi.getMessages(),
      ]);
      
      if (statusRes.data.success) {
        setMembers(statusRes.data.data);
      }
      if (workloadRes.data.success) {
        setWorkloadSummary(workloadRes.data.data);
      }
      if (messagesRes.data.success) {
        setMessages(messagesRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      const res = await teamApi.sendMessage({ content: newMessage });
      if (res.data.success) {
        setMessages([res.data.data, ...messages]);
        setNewMessage('');
        message.success('消息发送成功');
      }
    } catch (error) {
      message.error('消息发送失败');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      online: '#10b981',
      busy: '#ef4444',
      away: '#f59e0b',
      offline: '#94a3b8',
    };
    return colors[status] || '#94a3b8';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      online: '在线',
      busy: '忙碌',
      away: '离开',
      offline: '离线',
    };
    return labels[status] || status;
  };

  const getWorkloadColor = (workload: number) => {
    if (workload >= 90) return '#ef4444';
    if (workload >= 70) return '#f59e0b';
    if (workload >= 50) return '#6366f1';
    return '#10b981';
  };

  const isOverloaded = (workload: number) => workload >= 90;

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
        <Title level={2} style={{ margin: 0 }}>团队协作</Title>
        <Text type="secondary">实时查看团队成员状态与工作负载</Text>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <TeamOutlined />
          </div>
          <div className="stat-value">{workloadSummary?.totalMembers || 0}</div>
          <div className="stat-label">团队成员</div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-icon">
            <CheckCircleOutlined />
          </div>
          <div className="stat-value">{workloadSummary?.onlineMembers || 0}</div>
          <div className="stat-label">在线成员</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <ThunderboltOutlined />
          </div>
          <div className="stat-value">{workloadSummary?.avgWorkload || 0}%</div>
          <div className="stat-label">平均负载</div>
        </div>
        <div className="stat-card stat-danger">
          <div className="stat-icon">
            <ExclamationCircleOutlined />
          </div>
          <div className="stat-value">{workloadSummary?.overloadedMembers || 0}</div>
          <div className="stat-label">过载成员</div>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <div className="chart-container">
            <div className="chart-title">团队成员状态</div>
            <Row gutter={[16, 16]}>
              {members.map((member) => (
                <Col xs={24} sm={12} md={8} key={member.id}>
                  <Card
                    hoverable
                    className="btn-hover-effect"
                    style={{
                      borderRadius: 12,
                      border: isOverloaded(member.workload) ? '2px solid #ef4444' : '1px solid var(--color-border-light)',
                      boxShadow: isOverloaded(member.workload) ? '0 4px 12px rgba(239, 68, 68, 0.2)' : undefined,
                    }}
                  >
                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                      <Badge
                        dot
                        color={getStatusColor(member.status)}
                        offset={[-8, 8]}
                      >
                        <Avatar
                          size={64}
                          src={member.avatar}
                          icon={<UserOutlined />}
                          style={{
                            background: 'var(--gradient-primary)',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                          }}
                        />
                      </Badge>
                    </div>
                    
                    <div style={{ textAlign: 'center', marginBottom: 8 }}>
                      <Text strong style={{ fontSize: 15 }}>{member.name}</Text>
                      <br />
                      <Tag 
                        color={getStatusColor(member.status)} 
                        style={{ margin: '4px 0', borderRadius: 12 }}
                      >
                        {getStatusLabel(member.status)}
                      </Tag>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>工作负载</Text>
                        <Text strong style={{ fontSize: 12, color: getWorkloadColor(member.workload) }}>
                          {member.workload}%
                        </Text>
                      </div>
                      <Progress
                        percent={member.workload}
                        strokeColor={getWorkloadColor(member.workload)}
                        trailColor="var(--color-border-light)"
                        showInfo={false}
                        strokeWidth={6}
                        style={{ borderRadius: 8 }}
                      />
                    </div>

                    {member.currentTask && (
                      <div style={{ 
                        padding: '8px 12px', 
                        background: 'var(--color-bg-subtle)', 
                        borderRadius: 8,
                        marginBottom: 8 
                      }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>当前任务</Text>
                        <br />
                        <Text style={{ fontSize: 12, fontWeight: 500 }}>{member.currentTask}</Text>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: 8, borderTop: '1px solid var(--color-border-light)' }}>
                      <div style={{ textAlign: 'center' }}>
                        <Text strong style={{ display: 'block', fontSize: 16, color: 'var(--color-primary)' }}>
                          {member.projectCount}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>项目</Text>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <Text strong style={{ display: 'block', fontSize: 16, color: 'var(--color-success)' }}>
                          {member.taskCount}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>任务</Text>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
            {members.length === 0 && (
              <Empty description="暂无团队成员" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        </Col>

        <Col xs={24} lg={8}>
          <div className="chart-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="chart-title">
              <MessageOutlined style={{ marginRight: 8 }} />
              团队消息
            </div>
            
            <div style={{ flex: 1, overflow: 'auto', marginBottom: 16, maxHeight: 400 }}>
              {messages.length > 0 ? (
                <List
                  dataSource={messages}
                  renderItem={(item) => (
                    <List.Item style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            size={36} 
                            src={item.user_avatar} 
                            icon={<UserOutlined />}
                            style={{ background: 'var(--gradient-primary)' }}
                          />
                        }
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong style={{ fontSize: 13 }}>{item.user_name}</Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {dayjs(item.created_at).format('HH:mm')}
                            </Text>
                          </div>
                        }
                        description={
                          <Text style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>
                            {item.content}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无消息" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 16 }}>
              <Space.Compact style={{ width: '100%' }}>
                <TextArea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="输入消息..."
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  style={{ borderRadius: '8px 0 0 8px' }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  style={{ borderRadius: '0 8px 8px 0', height: 'auto' }}
                  className="btn-primary-gradient"
                />
              </Space.Compact>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}
