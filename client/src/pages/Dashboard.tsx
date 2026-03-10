import { useEffect, useState } from 'react';
import { Row, Col, Card, Progress, List, Tag, Typography, Spin, Space, Select } from 'antd';
import { 
  ClockCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { reportApi, projectApi } from '../api';
import { useProjectStore } from '../stores/projectStore';
import { DashboardStats, Risk, Task, Project } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function Dashboard() {
  const navigate = useNavigate();
  const { dashboardStats, setDashboardStats, projectDashboard, setProjectDashboard } = useProjectStore();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectDashboard(selectedProjectId);
    } else {
      loadDashboard();
    }
  }, [selectedProjectId]);

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

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await reportApi.getDashboard();
      if (res.data.success) {
        setDashboardStats(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDashboard = async (projectId: string) => {
    setLoading(true);
    try {
      const res = await projectApi.getDashboard(projectId);
      if (res.data.success) {
        setProjectDashboard(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load project dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (value: string | undefined) => {
    setSelectedProjectId(value);
  };

  const getTaskStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'default',
      in_progress: 'processing',
      completed: 'success',
      paused: 'warning',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const getRiskLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      low: 'green',
      medium: 'blue',
      high: 'orange',
      critical: 'red',
    };
    return colors[level] || 'default';
  };

  const currentStats = selectedProjectId ? projectDashboard?.stats : dashboardStats;
  const currentRisks = selectedProjectId ? projectDashboard?.riskItems : dashboardStats?.risks;
  const currentTasks = selectedProjectId ? projectDashboard?.upcomingTasks : dashboardStats?.upcomingTasks;

  const chartOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%' },
    series: [
      {
        name: '任务状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data: [
          { value: currentStats?.completedTasks || 0, name: '已完成', itemStyle: { color: '#52c41a' } },
          { value: currentStats?.inProgressTasks || 0, name: '进行中', itemStyle: { color: '#1890ff' } },
          { value: currentStats?.pendingTasks || 0, name: '未开始', itemStyle: { color: '#d9d9d9' } },
        ],
      },
    ],
  };

  const riskChartOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['低', '中', '高', '严重'] },
    yAxis: { type: 'value' },
    series: [
      {
        data: [
          currentRisks?.filter((r: Risk) => r.level === 'low').length || 0,
          currentRisks?.filter((r: Risk) => r.level === 'medium').length || 0,
          currentRisks?.filter((r: Risk) => r.level === 'high').length || 0,
          currentRisks?.filter((r: Risk) => r.level === 'critical').length || 0,
        ],
        type: 'bar',
        itemStyle: { color: '#1890ff' },
      },
    ],
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={2}>仪表盘</Title>
          <Text type="secondary">{selectedProjectId ? '查看项目详情' : '查看项目整体进展和关键指标'}</Text>
        </div>
        <Select
          style={{ width: 250 }}
          placeholder="选择项目查看详情"
          allowClear
          value={selectedProjectId}
          onChange={handleProjectChange}
          options={[
            { value: undefined, label: '全局概览' },
            ...projects.map(p => ({ value: p.id, label: p.name }))
          ]}
        />
      </div>

      <div className="dashboard-grid">
        <Card>
          <div className="stat-card">
            <div className="stat-value">{currentStats?.totalProjects || currentStats?.totalTasks || 0}</div>
            <div className="stat-label">{selectedProjectId ? '总任务数' : '总项目数'}</div>
          </div>
        </Card>
        <Card>
          <div className="stat-card">
            <div className="stat-value">{currentStats?.activeProjects || currentStats?.completedTasks || 0}</div>
            <div className="stat-label">{selectedProjectId ? '已完成任务' : '活跃项目'}</div>
          </div>
        </Card>
        <Card>
          <div className="stat-card">
            <div className="stat-value">{currentStats?.inProgressTasks || currentStats?.pendingTasks || 0}</div>
            <div className="stat-label">{selectedProjectId ? '进行中任务' : '待处理任务'}</div>
          </div>
        </Card>
        <Card>
          <div className="stat-card">
            <div className="stat-value">{currentStats?.completionRate || currentStats?.criticalRisks || 0}{selectedProjectId ? '%' : ''}</div>
            <div className="stat-label">{selectedProjectId ? '完成率' : '关键风险'}</div>
          </div>
        </Card>
      </div>

      {selectedProjectId && projectDashboard?.project && (
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={16} align="middle">
            <Col>
              <Progress type="circle" percent={projectDashboard.stats.completionRate} />
            </Col>
            <Col>
              <div style={{ fontWeight: 'bold' }}>{projectDashboard.project.name}</div>
              <div style={{ color: '#8c8c8c' }}>
                已完成 {projectDashboard.stats.completedTasks} / {projectDashboard.stats.totalTasks} 任务
              </div>
              <div style={{ marginTop: 8 }}>
                <Tag color="green">进行中: {projectDashboard.stats.inProgressTasks}</Tag>
                <Tag color="blue">待处理: {projectDashboard.stats.pendingTasks}</Tag>
                <Tag color="red">延期: {projectDashboard.stats.overdueTasks}</Tag>
                <Tag color="orange">风险: {projectDashboard.stats.criticalRisks}</Tag>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card title="任务完成情况" style={{ marginBottom: 24 }}>
            <ReactECharts option={chartOption} style={{ height: 280 }} />
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Progress 
                type="circle" 
                percent={currentStats?.completionRate || 0} 
                strokeColor="#52c41a"
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="风险分布" style={{ marginBottom: 24 }}>
            <ReactECharts option={riskChartOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card 
            title="待处理任务" 
            extra={<a onClick={() => navigate('/tasks')}>查看全部 <ArrowRightOutlined /></a>}
          >
            <List
              dataSource={currentTasks?.slice(0, 5) || []}
              renderItem={(item: Task) => (
                <List.Item>
                  <List.Item.Meta
                    title={<a onClick={() => navigate(`/tasks/${item.id}`)}>{item.title}</a>}
                    description={
                      <Space>
                        <Tag color={getTaskStatusColor(item.status)}>{item.status}</Tag>
                        {item.end_date && (
                          <Text type="secondary">
                            <ClockCircleOutlined /> {dayjs(item.end_date).format('MM-DD')}
                          </Text>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无待处理任务' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title="关键风险" 
            extra={<a onClick={() => navigate('/risks')}>查看全部 <ArrowRightOutlined /></a>}
          >
            <List
              dataSource={currentRisks?.slice(0, 5) || []}
              renderItem={(item: Risk) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.description}
                    description={
                      <Space>
                        <Tag color={getRiskLevelColor(item.level)}>{item.level}</Tag>
                        <Text type="secondary">{item.type}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无风险记录' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
