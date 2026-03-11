import { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Spin, Select, Table, Avatar, Progress, Space, Tag, Button, Modal, message, Empty } from 'antd';
import { 
  TrophyOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  BarChartOutlined,
  LineChartOutlined,
  SwapOutlined,
  CompareOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { performanceApi } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface TeamPerformance {
  completionRate: number;
  avgTasksPerUser: number;
  onTimeDeliveryRate: number;
  avgResponseTime: number;
  riskResolutionRate: number;
  summary: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    totalRisks: number;
    resolvedRisks: number;
    criticalRisks: number;
  };
}

interface MemberPerformance {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  taskCompletionCount: number;
  totalTasks: number;
  onTimeCompletionRate: number;
  avgResponseTime: number;
  riskHandlingCount: number;
  riskResolutionRate: number;
  collaborationScore: number;
  performanceScore: number;
}

interface TrendData {
  period: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  inProgressTasks: number;
}

export default function Performance() {
  const [loading, setLoading] = useState(true);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance | null>(null);
  const [members, setMembers] = useState<MemberPerformance[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [compareModalVisible, setCompareModalVisible] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [teamRes, membersRes, trendsRes] = await Promise.all([
        performanceApi.getTeamPerformance(),
        performanceApi.getMembersPerformance(),
        performanceApi.getTeamTrends(period),
      ]);
      
      if (teamRes.data.success) {
        setTeamPerformance(teamRes.data.data);
      }
      if (membersRes.data.success) {
        setMembers(membersRes.data.data);
      }
      if (trendsRes.data.success) {
        setTrends(trendsRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (selectedMembers.length < 2) {
      message.warning('请至少选择2名成员进行对比');
      return;
    }
    
    try {
      const res = await performanceApi.compareMembers(selectedMembers);
      if (res.data.success) {
        setCompareData(res.data.data);
        setCompareModalVisible(true);
      }
    } catch (error) {
      message.error('获取对比数据失败');
    }
  };

  const trendChartOption = {
    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b' }
    },
    legend: { 
      data: ['完成率', '任务数量'],
      bottom: 0 
    },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: trends.map(t => t.period ? dayjs(t.period).format(period === 'week' ? 'MM-DD' : 'YYYY-MM') : ''),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b' }
    },
    yAxis: [
      {
        type: 'value',
        name: '完成率(%)',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#64748b' }
      },
      {
        type: 'value',
        name: '任务数量',
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#64748b' }
      }
    ],
    series: [
      {
        name: '完成率',
        type: 'line',
        smooth: true,
        data: trends.map(t => t.completionRate),
        itemStyle: { color: '#6366f1' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(99, 102, 241, 0.3)' },
              { offset: 1, color: 'rgba(99, 102, 241, 0)' }
            ]
          }
        }
      },
      {
        name: '任务数量',
        type: 'bar',
        yAxisIndex: 1,
        data: trends.map(t => t.totalTasks),
        itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] }
      }
    ]
  };

  const compareChartOption = {
    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b' }
    },
    legend: { bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: ['完成任务数', '完成率', '按时交付率'],
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b' }
    },
    yAxis: { 
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#64748b' }
    },
    series: compareData.map((member, index) => ({
      name: member.name,
      type: 'bar',
      data: [member.completedTasks, member.completionRate, member.onTimeRate],
      itemStyle: { 
        color: index === 0 ? '#6366f1' : index === 1 ? '#10b981' : '#f59e0b',
        borderRadius: [4, 4, 0, 0] 
      }
    }))
  };

  const columns = [
    {
      title: '成员',
      key: 'member',
      render: (_: any, record: MemberPerformance) => (
        <Space>
          <Avatar 
            size={36} 
            src={record.user.avatar} 
            icon={<UserOutlined />}
            style={{ background: 'var(--gradient-primary)' }}
          />
          <div>
            <Text strong>{record.user.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{record.user.email}</Text>
          </div>
        </Space>
      )
    },
    {
      title: '任务完成情况',
      key: 'tasks',
      render: (_: any, record: MemberPerformance) => (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>完成进度</Text>
            <Text strong style={{ fontSize: 12 }}>{record.taskCompletionCount}/{record.totalTasks}</Text>
          </div>
          <Progress 
            percent={record.totalTasks > 0 ? Math.round((record.taskCompletionCount / record.totalTasks) * 100) : 0} 
            strokeColor={{
              '0%': '#6366f1',
              '100%': '#8b5cf6',
            }}
            trailColor="var(--color-border-light)"
            showInfo={false}
            strokeWidth={6}
          />
        </div>
      )
    },
    {
      title: '按时交付率',
      dataIndex: 'onTimeCompletionRate',
      key: 'onTimeCompletionRate',
      render: (rate: number) => (
        <Tag color={rate >= 80 ? 'green' : rate >= 60 ? 'orange' : 'red'}>
          {rate}%
        </Tag>
      )
    },
    {
      title: '平均响应时长',
      dataIndex: 'avgResponseTime',
      key: 'avgResponseTime',
      render: (duration: number) => `${duration.toFixed(1)}天`
    },
    {
      title: '绩效评分',
      dataIndex: 'performanceScore',
      key: 'performanceScore',
      render: (score: number) => (
        <Tag color={score >= 80 ? 'green' : score >= 60 ? 'blue' : 'orange'}>
          {score.toFixed(1)}
        </Tag>
      )
    }
  ];

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
          <Title level={2} style={{ margin: 0 }}>绩效仪表盘</Title>
          <Text type="secondary">团队绩效分析与成员表现评估</Text>
        </div>
        <Space>
          <Select
            value={period}
            onChange={setPeriod}
            style={{ width: 120 }}
            options={[
              { value: 'week', label: '本周' },
              { value: 'month', label: '本月' }
            ]}
          />
        </Space>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircleOutlined />
          </div>
          <div className="stat-value">{teamPerformance?.completionRate?.toFixed(1) || 0}%</div>
          <div className="stat-label">任务完成率</div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-icon">
            <TrophyOutlined />
          </div>
          <div className="stat-value">{teamPerformance?.avgTasksPerUser?.toFixed(1) || 0}</div>
          <div className="stat-label">人均任务数</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <ClockCircleOutlined />
          </div>
          <div className="stat-value">{teamPerformance?.onTimeDeliveryRate?.toFixed(1) || 0}%</div>
          <div className="stat-label">按时交付率</div>
        </div>
        <div className="stat-card stat-danger">
          <div className="stat-icon">
            <TeamOutlined />
          </div>
          <div className="stat-value">{teamPerformance?.summary?.totalTasks || 0}</div>
          <div className="stat-label">总任务数</div>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <div className="chart-container">
            <div className="chart-title">
              <LineChartOutlined style={{ marginRight: 8 }} />
              绩效趋势
            </div>
            <ReactECharts option={trendChartOption} style={{ height: 320 }} />
          </div>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <div className="chart-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="chart-title" style={{ margin: 0 }}>
                <BarChartOutlined style={{ marginRight: 8 }} />
                成员绩效列表
              </span>
              <Button 
                type="primary"
                icon={<CompareOutlined />}
                onClick={handleCompare}
                disabled={selectedMembers.length < 2}
                className="btn-primary-gradient"
              >
                对比选中成员 ({selectedMembers.length})
              </Button>
            </div>
            <Table
              columns={columns}
              dataSource={members}
              rowKey={(record) => record.user.id}
              rowSelection={{
                selectedRowKeys: selectedMembers,
                onChange: (keys) => setSelectedMembers(keys as string[])
              }}
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: <Empty description="暂无成员绩效数据" /> }}
            />
          </div>
        </Col>
      </Row>

      <Modal
        title="成员绩效对比"
        open={compareModalVisible}
        onCancel={() => setCompareModalVisible(false)}
        footer={null}
        width={800}
      >
        <ReactECharts option={compareChartOption} style={{ height: 400 }} />
      </Modal>
    </div>
  );
}
