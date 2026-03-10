import { useEffect, useState } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Space, 
  Tag, 
  Card, 
  Row, 
  Col, 
  message, 
  Badge, 
  Descriptions, 
  Statistic, 
  Alert, 
  List, 
  Divider,
  Tooltip,
  Progress
} from 'antd';
import { 
  AlertOutlined, 
  CheckCircleOutlined, 
  EyeOutlined, 
  ReloadOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  ProjectOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { riskApi, projectApi } from '../api';
import { RiskAlert, Project, RiskAnalysisResult } from '../types';

const { TextArea } = Input;

export default function RiskAlerts() {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<RiskAlert | null>(null);
  const [resolveVisible, setResolveVisible] = useState(false);
  const [resolveForm] = Form.useForm();
  const [filters, setFilters] = useState({ severity: '', status: '' });
  const [analysisResult, setAnalysisResult] = useState<RiskAnalysisResult | null>(null);

  useEffect(() => {
    loadProjects();
    loadAlerts();
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

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await riskApi.getAlerts(filters);
      if (res.data.success) {
        setAlerts(res.data.data);
      }
    } catch (error) {
      message.error('加载预警列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedProject) {
      message.warning('请选择要分析的项目');
      return;
    }

    setAnalyzing(true);
    try {
      const res = await riskApi.analyzeProject(selectedProject);
      if (res.data.success) {
        setAnalysisResult(res.data.data);
        message.success('风险分析完成');
        loadAlerts();
      }
    } catch (error) {
      message.error('风险分析失败');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleScan = async () => {
    if (!selectedProject) {
      message.warning('请选择要扫描的项目');
      return;
    }

    try {
      const res = await riskApi.scanProject(selectedProject);
      if (res.data.success) {
        message.success(res.data.message);
        loadAlerts();
      }
    } catch (error) {
      message.error('扫描失败');
    }
  };

  const handleViewDetail = (alert: RiskAlert) => {
    setSelectedAlert(alert);
    setDetailVisible(true);
  };

  const handleResolve = (alert: RiskAlert) => {
    setSelectedAlert(alert);
    resolveForm.resetFields();
    setResolveVisible(true);
  };

  const handleSubmitResolve = async (values: any) => {
    if (!selectedAlert) return;

    try {
      await riskApi.resolveAlert(selectedAlert.id, values.action, values.resolution_note);
      message.success('预警已处理');
      setResolveVisible(false);
      loadAlerts();
    } catch (error) {
      message.error('处理失败');
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'default',
      medium: 'blue',
      high: 'orange',
      critical: 'red',
    };
    return colors[severity] || 'default';
  };

  const getSeverityText = (severity: string) => {
    const texts: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
      critical: '严重',
    };
    return texts[severity] || severity;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'red',
      acknowledged: 'orange',
      resolved: 'green',
      ignored: 'gray',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      active: '活跃',
      acknowledged: '已确认',
      resolved: '已解决',
      ignored: '已忽略',
    };
    return texts[status] || status;
  };

  const getAlertTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      task_delay: <ClockCircleOutlined />,
      resource_conflict: <TeamOutlined />,
      progress_anomaly: <WarningOutlined />,
      deadline_approaching: <AlertOutlined />,
      budget_overrun: <ProjectOutlined />,
      quality_issue: <InfoCircleOutlined />,
    };
    return icons[type] || <AlertOutlined />;
  };

  const getAlertTypeText = (type: string) => {
    const texts: Record<string, string> = {
      task_delay: '任务延期',
      resource_conflict: '资源冲突',
      progress_anomaly: '进度异常',
      deadline_approaching: '即将到期',
      budget_overrun: '预算超支',
      quality_issue: '质量问题',
    };
    return texts[type] || type;
  };

  const columns = [
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => (
        <Tag color={getSeverityColor(severity)} icon={<AlertOutlined />}>
          {getSeverityText(severity)}
        </Tag>
      ),
    },
    {
      title: '预警标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: RiskAlert) => (
        <Space>
          {getAlertTypeIcon(record.alert_type)}
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: '项目',
      dataIndex: 'project_name',
      key: 'project',
      width: 150,
    },
    {
      title: '预警类型',
      dataIndex: 'alert_type',
      key: 'alert_type',
      width: 120,
      render: (type: string) => getAlertTypeText(type),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
    },
    {
      title: '触发时间',
      dataIndex: 'triggered_at',
      key: 'triggered_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: RiskAlert) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />} 
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'active' && (
            <Button 
              type="link" 
              size="small" 
              icon={<CheckCircleOutlined />} 
              onClick={() => handleResolve(record)}
            >
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 统计数据
  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
    high: alerts.filter(a => a.severity === 'high' && a.status === 'active').length,
    active: alerts.filter(a => a.status === 'active').length,
  };

  // 风险趋势图配置
  const trendChartOption = analysisResult ? {
    title: { text: '风险评分趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { 
      type: 'category', 
      data: analysisResult.riskTrend.map(t => t.date),
      axisLabel: { rotate: 45 }
    },
    yAxis: { type: 'value', min: 0, max: 100 },
    series: [{
      type: 'line',
      data: analysisResult.riskTrend.map(t => t.score),
      smooth: true,
      areaStyle: { opacity: 0.3 },
      itemStyle: { color: '#1890ff' },
    }],
  } : null;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1><AlertOutlined /> 风险预警中心</h1>
          <p className="subtitle">实时监控项目风险,及时预警和处理</p>
        </div>
        <Space>
          <Select
            placeholder="选择项目"
            style={{ width: 200 }}
            value={selectedProject || undefined}
            onChange={setSelectedProject}
            allowClear
          >
            {projects.map(p => (
              <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
            ))}
          </Select>
          <Button 
            type="default" 
            icon={<ReloadOutlined />} 
            onClick={handleScan}
            disabled={!selectedProject}
          >
            扫描风险
          </Button>
          <Button 
            type="primary" 
            icon={<AlertOutlined />} 
            onClick={handleAnalyze}
            loading={analyzing}
            disabled={!selectedProject}
          >
            AI分析
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="总预警数" 
              value={stats.total} 
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="活跃预警" 
              value={stats.active} 
              valueStyle={{ color: '#cf1322' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="严重预警" 
              value={stats.critical} 
              valueStyle={{ color: '#d4380d' }}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="高优先级" 
              value={stats.high} 
              valueStyle={{ color: '#fa8c16' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* AI分析结果 */}
      {analysisResult && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="风险评分">
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Progress 
                  type="circle" 
                  percent={analysisResult.overallRiskScore} 
                  strokeColor={analysisResult.overallRiskScore > 70 ? '#f5222d' : 
                               analysisResult.overallRiskScore > 40 ? '#fa8c16' : '#52c41a'}
                  format={percent => `${percent}分`}
                />
              </div>
              <Alert
                message={`项目 "${analysisResult.projectName}" 整体风险评分: ${analysisResult.overallRiskScore}分`}
                description={
                  analysisResult.overallRiskScore > 70 ? '风险较高，建议立即采取措施' :
                  analysisResult.overallRiskScore > 40 ? '风险中等，需要关注' : '风险较低，继续保持'
                }
                type={analysisResult.overallRiskScore > 70 ? 'error' : 
                      analysisResult.overallRiskScore > 40 ? 'warning' : 'success'}
                showIcon
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="风险趋势">
              {trendChartOption && (
                <ReactECharts option={trendChartOption} style={{ height: 250 }} />
              )}
            </Card>
          </Col>
        </Row>
      )}

      {/* AI建议 */}
      {analysisResult && analysisResult.recommendations.length > 0 && (
        <Card title="AI改进建议" style={{ marginBottom: 24 }}>
          <List
            dataSource={analysisResult.recommendations}
            renderItem={(item, index) => (
              <List.Item>
                <Alert
                  message={`建议 ${index + 1}`}
                  description={item}
                  type="info"
                  showIcon
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* 预警列表 */}
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="严重程度"
            allowClear
            style={{ width: 120 }}
            value={filters.severity || undefined}
            onChange={(value) => setFilters({ ...filters, severity: value || '' })}
          >
            <Select.Option value="critical">严重</Select.Option>
            <Select.Option value="high">高</Select.Option>
            <Select.Option value="medium">中</Select.Option>
            <Select.Option value="low">低</Select.Option>
          </Select>
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 120 }}
            value={filters.status || undefined}
            onChange={(value) => setFilters({ ...filters, status: value || '' })}
          >
            <Select.Option value="active">活跃</Select.Option>
            <Select.Option value="acknowledged">已确认</Select.Option>
            <Select.Option value="resolved">已解决</Select.Option>
            <Select.Option value="ignored">已忽略</Select.Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={loadAlerts}>刷新</Button>
        </Space>

        <Table 
          columns={columns} 
          dataSource={alerts} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowClassName={(record) => 
            record.severity === 'critical' && record.status === 'active' ? 'critical-alert-row' : ''
          }
        />
      </Card>

      {/* 预警详情弹窗 */}
      <Modal
        title="预警详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
          selectedAlert?.status === 'active' && (
            <Button 
              key="resolve" 
              type="primary" 
              onClick={() => {
                setDetailVisible(false);
                handleResolve(selectedAlert);
              }}
            >
              处理预警
            </Button>
          ),
        ]}
        width={700}
      >
        {selectedAlert && (
          <div>
            <Alert
              message={selectedAlert.title}
              description={selectedAlert.description}
              type={selectedAlert.severity === 'critical' ? 'error' : 
                    selectedAlert.severity === 'high' ? 'warning' : 'info'}
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Descriptions bordered column={2}>
              <Descriptions.Item label="预警类型">
                <Space>
                  {getAlertTypeIcon(selectedAlert.alert_type)}
                  {getAlertTypeText(selectedAlert.alert_type)}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="严重程度">
                <Tag color={getSeverityColor(selectedAlert.severity)}>
                  {getSeverityText(selectedAlert.severity)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(selectedAlert.status)}>
                  {getStatusText(selectedAlert.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="项目">{selectedAlert.project_name}</Descriptions.Item>
              <Descriptions.Item label="相关任务" span={2}>
                {selectedAlert.task_title || '无'}
              </Descriptions.Item>
              <Descriptions.Item label="影响范围" span={2}>
                {selectedAlert.impact}
              </Descriptions.Item>
              <Descriptions.Item label="建议措施" span={2}>
                {selectedAlert.suggestion}
              </Descriptions.Item>
              <Descriptions.Item label="触发时间">
                {new Date(selectedAlert.triggered_at).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(selectedAlert.created_at).toLocaleString('zh-CN')}
              </Descriptions.Item>
              {selectedAlert.acknowledged_at && (
                <Descriptions.Item label="确认时间">
                  {new Date(selectedAlert.acknowledged_at).toLocaleString('zh-CN')}
                </Descriptions.Item>
              )}
              {selectedAlert.resolved_at && (
                <Descriptions.Item label="解决时间">
                  {new Date(selectedAlert.resolved_at).toLocaleString('zh-CN')}
                </Descriptions.Item>
              )}
              {selectedAlert.resolution_note && (
                <Descriptions.Item label="解决方案" span={2}>
                  {selectedAlert.resolution_note}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* 处理预警弹窗 */}
      <Modal
        title="处理预警"
        open={resolveVisible}
        onCancel={() => setResolveVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={resolveForm} layout="vertical" onFinish={handleSubmitResolve}>
          <Form.Item 
            name="action" 
            label="处理方式" 
            rules={[{ required: true, message: '请选择处理方式' }]}
            initialValue="acknowledge"
          >
            <Select>
              <Select.Option value="acknowledge">确认预警</Select.Option>
              <Select.Option value="resolve">解决预警</Select.Option>
              <Select.Option value="ignore">忽略预警</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item 
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.action !== currentValues.action}
          >
            {({ getFieldValue }) => 
              getFieldValue('action') === 'resolve' && (
                <Form.Item 
                  name="resolution_note" 
                  label="解决方案" 
                  rules={[{ required: true, message: '请输入解决方案' }]}
                >
                  <TextArea rows={4} placeholder="请详细描述解决方案" />
                </Form.Item>
              )
            }
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setResolveVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .critical-alert-row {
          background-color: #fff1f0 !important;
        }
        .critical-alert-row:hover {
          background-color: #ffe7e6 !important;
        }
      `}</style>
    </div>
  );
}
