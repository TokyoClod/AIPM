import { useEffect, useState } from 'react';
import { Table, Tag, Button, Modal, Form, Input, Select, DatePicker, Space, message, Popconfirm, Row, Col, Card, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { riskApi, projectApi } from '../api';
import { Risk, Project } from '../types';

const { TextArea } = Input;

export default function Risks() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRisks();
    loadProjects();
  }, []);

  const loadRisks = async () => {
    setLoading(true);
    try {
      const res = await riskApi.getAll();
      if (res.data.success) {
        setRisks(res.data.data);
      }
    } catch (error) {
      message.error('加载风险失败');
    } finally {
      setLoading(false);
    }
  };

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
      const res = await riskApi.delete(id);
      if (res.data.success) {
        message.success('风险已删除');
        loadRisks();
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingRisk) {
        const res = await riskApi.update(editingRisk.id, values);
        if (res.data.success) {
          message.success('风险已更新');
        }
      } else {
        const res = await riskApi.create(values);
        if (res.data.success) {
          message.success('风险已创建');
        }
      }
      setModalVisible(false);
      loadRisks();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
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
      identified: 'error',
      mitigating: 'warning',
      resolved: 'success',
      accepted: 'default',
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: '风险描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '所属项目',
      dataIndex: 'project_id',
      key: 'project_id',
      render: (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        return project?.name || '-';
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => <Tag color={getLevelColor(level)}>{level}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Risk) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除此风险?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const stats = {
    total: risks.length,
    critical: risks.filter(r => r.level === 'critical').length,
    high: risks.filter(r => r.level === 'high').length,
    identified: risks.filter(r => r.status === 'identified').length,
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>风险管理</h1>
          <p className="subtitle" style={{ margin: '4px 0 0' }}>识别和管理项目风险</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} size="large">
          新建风险
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总风险数" value={stats.total} prefix={<WarningOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="严重风险" value={stats.critical} valueStyle={{ color: '#ef4444' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="高风险" value={stats.high} valueStyle={{ color: '#f59e0b' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="未解决" value={stats.identified} valueStyle={{ color: '#ef4444' }} />
          </Card>
        </Col>
      </Row>

      <div className="chart-container">
        <Table columns={columns} dataSource={risks} rowKey="id" loading={loading} />
      </div>

      <Modal
        title={editingRisk ? '编辑风险' : '新建风险'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 24 }}>
          <Form.Item name="description" label="风险描述" rules={[{ required: true, message: '请输入风险描述' }]}>
            <TextArea rows={3} placeholder="请输入风险描述" />
          </Form.Item>
          <Form.Item name="project_id" label="所属项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select placeholder="请选择项目" size="large">
              {projects.map(p => (
                <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="类型" initialValue="technical">
                <Select size="large">
                  <Select.Option value="technical">技术风险</Select.Option>
                  <Select.Option value="schedule">进度风险</Select.Option>
                  <Select.Option value="resource">资源风险</Select.Option>
                  <Select.Option value="external">外部风险</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="level" label="等级" initialValue="medium">
                <Select size="large">
                  <Select.Option value="low">低</Select.Option>
                  <Select.Option value="medium">中</Select.Option>
                  <Select.Option value="high">高</Select.Option>
                  <Select.Option value="critical">严重</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="状态" initialValue="open">
            <Select size="large">
              <Select.Option value="open">未解决</Select.Option>
              <Select.Option value="mitigated">已缓解</Select.Option>
              <Select.Option value="closed">已关闭</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="mitigation_plan" label="缓解措施">
            <TextArea rows={2} placeholder="请输入缓解措施" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">{editingRisk ? '保存' : '创建'}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
