import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Tag, Card, Row, Col, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { riskApi, projectApi } from '../api';
import { Risk, Project, RiskAnalytics } from '../types';

export default function Risks() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [analytics, setAnalytics] = useState<RiskAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [filters, setFilters] = useState({ project_id: '', level: '', status: '' });
  const [form] = Form.useForm();

  useEffect(() => {
    loadProjects();
    loadRisks();
    loadAnalytics();
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

  const loadRisks = async () => {
    setLoading(true);
    try {
      const res = await riskApi.getAll(filters);
      if (res.data.success) {
        setRisks(res.data.data);
      }
    } catch (error) {
      message.error('加载风险失败');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const res = await riskApi.getAll({});
      const analyticsRes = await riskApi.getAll(filters.project_id ? { project_id: filters.project_id } : {});
      if (analyticsRes.data.success) {
        const data = analyticsRes.data.data as Risk[];
        const byLevel: Record<string, number> = {};
        const byType: Record<string, number> = {};
        const byStatus: Record<string, number> = {};
        
        data.forEach(r => {
          byLevel[r.level] = (byLevel[r.level] || 0) + 1;
          byType[r.type] = (byType[r.type] || 0) + 1;
          byStatus[r.status] = (byStatus[r.status] || 0) + 1;
        });

        setAnalytics({ byLevel, byType, byStatus, recommendations: [] });
      }
    } catch (error) {
      console.error('Failed to load analytics');
    }
  };

  const handleCreate = () => {
    setEditingRisk(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (risk: Risk) => {
    setEditingRisk(risk);
    form.setFieldsValue(risk);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await riskApi.delete(id);
      message.success('风险已删除');
      loadRisks();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingRisk) {
        await riskApi.update(editingRisk.id, values);
        message.success('风险已更新');
      } else {
        await riskApi.create(values);
        message.success('风险已创建');
      }
      setModalVisible(false);
      loadRisks();
      loadAnalytics();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      low: 'green',
      medium: 'blue',
      high: 'orange',
      critical: 'red',
    };
    return colors[level] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      identified: 'red',
      mitigating: 'orange',
      resolved: 'green',
      accepted: 'gray',
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: '风险描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: '项目',
      dataIndex: 'project_id',
      key: 'project',
      render: (projectId: string) => projects.find(p => p.id === projectId)?.name || '-',
    },
    {
      title: '风险等级',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => <Tag color={getLevelColor(level)}>{level}</Tag>,
    },
    {
      title: '风险类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: '创建人',
      dataIndex: 'creator_name',
      key: 'creator_name',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Risk) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  const levelChartOption = {
    title: { text: '风险等级分布', left: 'center' },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '50%',
      data: analytics ? Object.entries(analytics.byLevel).map(([name, value]) => ({ name, value })) : [],
    }],
  };

  const typeChartOption = {
    title: { text: '风险类型分布', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: analytics ? Object.keys(analytics.byType) : [] },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: analytics ? Object.values(analytics.byType) : [] }],
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>风险管理</h1>
          <p className="subtitle">识别和管理项目风险</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>添加风险</Button>
      </div>

      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card>{analytics && <ReactECharts option={levelChartOption} style={{ height: 300 }} />}</Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>{analytics && <ReactECharts option={typeChartOption} style={{ height: 300 }} />}</Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="选择项目"
            allowClear
            style={{ width: 200 }}
            value={filters.project_id || undefined}
            onChange={(value) => setFilters({ ...filters, project_id: value || '' })}
          >
            {projects.map(p => (<Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>))}
          </Select>
          <Select
            placeholder="风险等级"
            allowClear
            style={{ width: 120 }}
            value={filters.level || undefined}
            onChange={(value) => setFilters({ ...filters, level: value || '' })}
          >
            <Select.Option value="low">低</Select.Option>
            <Select.Option value="medium">中</Select.Option>
            <Select.Option value="high">高</Select.Option>
            <Select.Option value="critical">严重</Select.Option>
          </Select>
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 120 }}
            value={filters.status || undefined}
            onChange={(value) => setFilters({ ...filters, status: value || '' })}
          >
            <Select.Option value="identified">已识别</Select.Option>
            <Select.Option value="mitigating">处理中</Select.Option>
            <Select.Option value="resolved">已解决</Select.Option>
            <Select.Option value="accepted">已接受</Select.Option>
          </Select>
        </Space>
        <Table columns={columns} dataSource={risks} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title={editingRisk ? '编辑风险' : '添加风险'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="project_id" label="项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select>
              {projects.map(p => (<Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="风险描述" rules={[{ required: true, message: '请输入风险描述' }]}>
            <Input.TextArea rows={3} placeholder="详细描述风险内容" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="level" label="风险等级" initialValue="medium">
                <Select>
                  <Select.Option value="low">低</Select.Option>
                  <Select.Option value="medium">中</Select.Option>
                  <Select.Option value="high">高</Select.Option>
                  <Select.Option value="critical">严重</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="风险类型" initialValue="other">
                <Select>
                  <Select.Option value="technical">技术风险</Select.Option>
                  <Select.Option value="resource">资源风险</Select.Option>
                  <Select.Option value="schedule">进度风险</Select.Option>
                  <Select.Option value="quality">质量风险</Select.Option>
                  <Select.Option value="other">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="mitigation" label="缓解措施">
            <Input.TextArea rows={2} placeholder="建议的风险缓解措施" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="identified">
            <Select>
              <Select.Option value="identified">已识别</Select.Option>
              <Select.Option value="mitigating">处理中</Select.Option>
              <Select.Option value="resolved">已解决</Select.Option>
              <Select.Option value="accepted">已接受</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
