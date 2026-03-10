import { useEffect, useState } from 'react';
import { Row, Col, List, Tag, Typography, Spin, Space, Select, Progress as AntProgress } from 'antd';
import { 
  ClockCircleOutlined,
  ArrowRightOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  ExclamationCircleOutlined
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
    tooltip: { 
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b' }
    },
    legend: { bottom: '5%', itemWidth: 12, itemHeight: 12 },
    series: [
      {
        name: '任务状态',
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
        label: { show: false },
        emphasis: { 
          label: { show: true, fontSize: 16, fontWeight: 'bold' },
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.2)' }
        },
        data: [
          { value: currentStats?.completedTasks || 0, name: '已完成', itemStyle: { color: '#10b981' } },
          { value: currentStats?.inProgressTasks || 0, name: '进行中', itemStyle: { color: '#6366f1' } },
          { value: currentStats?.pendingTasks || 0, name: '未开始', itemStyle: { color: '#cbd5e1' } },
        ],
      },
    ],
  };

  const riskChartOption = {
    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: ['低', '中', '高', '严重'],
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b' }
    },
    yAxis: { 
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#64748b' }
    },
    series: [
      {
        data: [
          { value: currentRisks?.filter((r: Risk) => r.level === 'low').length || 0, itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] } },
          { value: currentRisks?.filter((r: Risk) => r.level === 'medium').length || 0, itemStyle: { color: '#6366f1', borderRadius: [4, 4, 0, 0] } },
          { value: currentRisks?.filter((r: Risk) => r.level === 'high').length || 0, itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] } },
          { value: currentRisks?.filter((r: Risk) => r.level === 'critical').length || 0, itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] } },
        ],
        type: 'bar',
        barWidth: '50%',
        itemStyle: { borderRadius: [4, 4, 0, 0] },
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>仪表盘</Title>
          <Text type="secondary">{selectedProjectId ? '项目详情与进度' : '全面了解项目整体进展'}</Text>
        </div>
        <Select
          style={{ width: 220 }}
          placeholder="选择项目"
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
        <div className="stat-card">
          <div className="stat-icon">
            <ProjectOutlined />
          </div>
          <div className="stat-value">{currentStats?.totalProjects || currentStats?.totalTasks || 0}</div>
          <div className="stat-label">{selectedProjectId ? '总任务数' : '总项目数'}</div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-icon">
            <CheckCircleOutlined />
          </div>
          <div className="stat-value">{currentStats?.activeProjects || currentStats?.completedTasks || 0}</div>
          <div className="stat-label">{selectedProjectId ? '已完成任务' : '活跃项目'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <SyncOutlined spin />
          </div>
          <div className="stat-value">{currentStats?.inProgressTasks || currentStats?.pendingTasks || 0}</div>
          <div className="stat-label">{selectedProjectId ? '进行中任务' : '待处理任务'}</div>
        </div>
        <div className="stat-card stat-danger">
          <div className="stat-icon">
            <ExclamationCircleOutlined />
          </div>
          <div className="stat-value">{currentStats?.completionRate || currentStats?.criticalRisks || 0}{selectedProjectId ? '%' : ''}</div>
          <div className="stat-label">{selectedProjectId ? '完成率' : '关键风险'}</div>
        </div>
      </div>

      {selectedProjectId && projectDashboard?.project && (
        <div className="chart-container" style={{ marginBottom: 24 }}>
          <Row gutter={24} align="middle">
            <Col>
              <AntProgress 
                type="circle" 
                percent={projectDashboard.stats.completionRate} 
                strokeColor={{ '0%': '#6366f1', '100%': '#8b5cf6' }}
                trailColor="#e2e8f0"
                size={100}
              />
            </Col>
            <Col flex={1}>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{projectDashboard.project.name}</div>
              <div style={{ color: '#64748b', marginBottom: 12 }}>
                已完成 <span style={{ color: '#10b981', fontWeight: 600 }}>{projectDashboard.stats.completedTasks}</span> / {projectDashboard.stats.totalTasks} 任务
              </div>
              <Space wrap>
                <Tag color="green">进行中: {projectDashboard.stats.inProgressTasks}</Tag>
                <Tag color="default">待处理: {projectDashboard.stats.pendingTasks}</Tag>
                <Tag color="red">延期: {projectDashboard.stats.overdueTasks}</Tag>
                <Tag color="orange">风险: {projectDashboard.stats.criticalRisks}</Tag>
              </Space>
            </Col>
          </Row>
        </div>
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <div className="chart-container">
            <div className="chart-title">任务完成情况</div>
            <ReactECharts option={chartOption} style={{ height: 260 }} />
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <div className="chart-container">
            <div className="chart-title">风险等级分布</div>
            <ReactECharts option={riskChartOption} style={{ height: 260 }} />
          </div>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <div className="chart-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="chart-title" style={{ margin: 0 }}>待处理任务</span>
              <a onClick={() => navigate('/tasks')} className="btn-hover-effect" style={{ color: '#6366f1', fontWeight: 500 }}>
                查看全部 <ArrowRightOutlined />
              </a>
            </div>
            <List
              dataSource={currentTasks?.slice(0, 5) || []}
              renderItem={(item: Task) => (
                <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <List.Item.Meta
                    title={
                      <a 
                        onClick={() => navigate(`/tasks/${item.id}`)} 
                        style={{ fontWeight: 500, color: '#1e293b' }}
                      >
                        {item.title}
                      </a>
                    }
                    description={
                      <Space>
                        <Tag color={getTaskStatusColor(item.status)} style={{ margin: 0 }}>{item.status}</Tag>
                        {item.end_date && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
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
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <div className="chart-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="chart-title" style={{ margin: 0 }}>关键风险</span>
              <a onClick={() => navigate('/risks')} className="btn-hover-effect" style={{ color: '#6366f1', fontWeight: 500 }}>
                查看全部 <ArrowRightOutlined />
              </a>
            </div>
            <List
              dataSource={currentRisks?.slice(0, 5) || []}
              renderItem={(item: Risk) => (
                <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <List.Item.Meta
                    title={<span style={{ fontWeight: 500, color: '#1e293b' }}>{item.description}</span>}
                    description={
                      <Space>
                        <Tag color={getRiskLevelColor(item.level)} style={{ margin: 0 }}>{item.level}</Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>{item.type}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无风险记录' }}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
}
