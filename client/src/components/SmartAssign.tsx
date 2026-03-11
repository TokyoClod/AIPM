import { useEffect, useState } from 'react';
import { Card, List, Avatar, Button, Space, Tag, Progress, Typography, Spin, Empty, message, Tooltip, Modal, Form, Select, InputNumber } from 'antd';
import { 
  UserOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  InfoCircleOutlined,
  StarOutlined,
  TrophyOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { smartAssignApi, taskApi } from '../api';

const { Text, Title } = Typography;

interface Recommendation {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  score: number;
  reasons: string[];
  currentWorkload: number;
  skillMatch: number;
  availability: number;
}

interface WorkloadBalance {
  userId: string;
  userName: string;
  userAvatar?: string;
  workload: number;
  taskCount: number;
  status: 'overloaded' | 'balanced' | 'available';
}

interface SmartAssignProps {
  taskId: string;
  onAssigned?: () => void;
}

export default function SmartAssign({ taskId, onAssigned }: SmartAssignProps) {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [workloadBalance, setWorkloadBalance] = useState<WorkloadBalance[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [skillModalVisible, setSkillModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [skillForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [taskId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recRes, workloadRes] = await Promise.all([
        smartAssignApi.getRecommendations(taskId),
        smartAssignApi.getWorkloadBalance(),
      ]);
      
      if (recRes.data.success) {
        setRecommendations(recRes.data.data);
      }
      if (workloadRes.data.success) {
        setWorkloadBalance(workloadRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load smart assign data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (userId: string) => {
    setAssigning(true);
    try {
      const res = await taskApi.update(taskId, { assignee_id: userId });
      if (res.data.success) {
        message.success('任务分配成功');
        onAssigned?.();
      }
    } catch (error) {
      message.error('任务分配失败');
    } finally {
      setAssigning(false);
    }
  };

  const handleAddSkill = async () => {
    try {
      const values = await skillForm.validateFields();
      const res = await smartAssignApi.addSkill(selectedUserId!, values.skill, values.level);
      if (res.data.success) {
        message.success('技能添加成功');
        setSkillModalVisible(false);
        skillForm.resetFields();
        loadData();
      }
    } catch (error) {
      message.error('技能添加失败');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#6366f1';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getWorkloadColor = (workload: number) => {
    if (workload >= 90) return '#ef4444';
    if (workload >= 70) return '#f59e0b';
    if (workload >= 50) return '#6366f1';
    return '#10b981';
  };

  const getWorkloadStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      overloaded: 'red',
      balanced: 'blue',
      available: 'green',
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Spin />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <ThunderboltOutlined style={{ fontSize: 20, color: '#6366f1' }} />
          <Title level={4} style={{ margin: 0 }}>智能分配推荐</Title>
        </div>
        <Text type="secondary">基于技能匹配、工作负载和可用性为您推荐最佳人选</Text>
      </div>

      {recommendations.length === 0 ? (
        <Empty description="暂无推荐人选" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          dataSource={recommendations}
          renderItem={(item, index) => (
            <Card
              size="small"
              style={{ 
                marginBottom: 12, 
                borderRadius: 12,
                border: index === 0 ? '2px solid #6366f1' : '1px solid var(--color-border-light)',
                boxShadow: index === 0 ? '0 4px 12px rgba(99, 102, 241, 0.2)' : undefined,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <Avatar 
                    size={48} 
                    src={item.user_avatar} 
                    icon={<UserOutlined />}
                    style={{ 
                      background: 'var(--gradient-primary)',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }}
                  />
                  {index === 0 && (
                    <div style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      background: '#f59e0b',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
                    }}>
                      <TrophyOutlined style={{ color: '#fff', fontSize: 12 }} />
                    </div>
                  )}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Space>
                      <Text strong style={{ fontSize: 15 }}>{item.user_name}</Text>
                      {index === 0 && <Tag color="gold" icon={<StarOutlined />}>最佳匹配</Tag>}
                    </Space>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>匹配度</Text>
                      <Text strong style={{ fontSize: 18, color: getScoreColor(item.score) }}>
                        {item.score}%
                      </Text>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>综合评分</Text>
                    </div>
                    <Progress 
                      percent={item.score} 
                      strokeColor={getScoreColor(item.score)}
                      trailColor="var(--color-border-light)"
                      showInfo={false}
                      strokeWidth={8}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 11 }}>技能匹配</Text>
                      <div style={{ fontWeight: 600, color: '#6366f1' }}>{item.skillMatch}%</div>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 11 }}>当前负载</Text>
                      <div style={{ fontWeight: 600, color: getWorkloadColor(item.currentWorkload) }}>
                        {item.currentWorkload}%
                      </div>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 11 }}>可用性</Text>
                      <div style={{ fontWeight: 600, color: '#10b981' }}>{item.availability}%</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>
                      推荐理由
                    </Text>
                    <Space wrap size={[4, 4]}>
                      {item.reasons.map((reason, idx) => (
                        <Tag 
                          key={idx} 
                          style={{ 
                            margin: 0, 
                            borderRadius: 12,
                            background: 'var(--color-bg-subtle)',
                            border: 'none'
                          }}
                        >
                          {reason}
                        </Tag>
                      ))}
                    </Space>
                  </div>

                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => handleAssign(item.user_id)}
                    loading={assigning}
                    className="btn-primary-gradient"
                    block
                  >
                    一键分配
                  </Button>
                </div>
              </div>
            </Card>
          )}
        />
      )}

      <Card 
        size="small" 
        style={{ marginTop: 24, borderRadius: 12 }}
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#6366f1' }} />
            <span>团队工作负载</span>
          </Space>
        }
        extra={
          <Button 
            type="link" 
            icon={<PlusOutlined />}
            onClick={() => setSkillModalVisible(true)}
          >
            添加技能
          </Button>
        }
      >
        <List
          dataSource={workloadBalance}
          renderItem={(item) => (
            <List.Item style={{ padding: '8px 0' }}>
              <List.Item.Meta
                avatar={
                  <Avatar 
                    size={36} 
                    src={item.userAvatar} 
                    icon={<UserOutlined />}
                    style={{ background: 'var(--gradient-primary)' }}
                  />
                }
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{item.userName}</Text>
                    <Tag color={getWorkloadStatusColor(item.status)}>
                      {item.workload}%
                    </Tag>
                  </div>
                }
                description={
                  <Progress 
                    percent={item.workload} 
                    strokeColor={getWorkloadColor(item.workload)}
                    trailColor="var(--color-border-light)"
                    showInfo={false}
                    size="small"
                  />
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="添加技能"
        open={skillModalVisible}
        onCancel={() => setSkillModalVisible(false)}
        onOk={handleAddSkill}
        okText="添加"
        cancelText="取消"
      >
        <Form form={skillForm} layout="vertical">
          <Form.Item
            name="userId"
            label="选择成员"
            rules={[{ required: true, message: '请选择成员' }]}
          >
            <Select
              placeholder="选择成员"
              value={selectedUserId}
              onChange={setSelectedUserId}
              options={workloadBalance.map(w => ({
                value: w.userId,
                label: w.userName
              }))}
            />
          </Form.Item>
          <Form.Item
            name="skill"
            label="技能名称"
            rules={[{ required: true, message: '请输入技能名称' }]}
          >
            <Select
              placeholder="选择或输入技能"
              options={[
                { value: 'JavaScript', label: 'JavaScript' },
                { value: 'TypeScript', label: 'TypeScript' },
                { value: 'React', label: 'React' },
                { value: 'Vue', label: 'Vue' },
                { value: 'Node.js', label: 'Node.js' },
                { value: 'Python', label: 'Python' },
                { value: 'Java', label: 'Java' },
                { value: 'UI设计', label: 'UI设计' },
                { value: '产品设计', label: '产品设计' },
                { value: '项目管理', label: '项目管理' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="level"
            label="技能等级"
            rules={[{ required: true, message: '请选择技能等级' }]}
          >
            <Select
              placeholder="选择技能等级"
              options={[
                { value: 1, label: '初级 (1-2年经验)' },
                { value: 2, label: '中级 (2-4年经验)' },
                { value: 3, label: '高级 (4-6年经验)' },
                { value: 4, label: '专家 (6年以上经验)' },
                { value: 5, label: '大师 (行业顶尖)' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
