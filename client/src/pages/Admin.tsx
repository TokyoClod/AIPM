import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, message, Tabs, Row, Col } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { authApi, reportApi } from '../api';
import { useAuthStore } from '../stores/authStore';
import { User } from '../types';

export default function Admin() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      message.error('仅管理员可访问此页面');
      return;
    }
    loadUsers();
  }, [currentUser]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await authApi.getUsers();
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (error) {
      message.error('加载用户失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setUserModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    if (editingUser) {
      try {
        await authApi.updateUserRole(editingUser.id, values.role);
        message.success('用户已更新');
        setUserModalVisible(false);
        loadUsers();
      } catch (error) {
        message.error('更新失败');
      }
    }
  };

  const handleGenerateReport = async () => {
    try {
      const res = await reportApi.generateDailyReport();
      if (res.data.success) {
        message.success('报告已生成并发送');
      }
    } catch (error) {
      message.error('生成报告失败');
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'red',
      manager: 'orange',
      leader: 'blue',
      member: 'green',
    };
    return colors[role] || 'default';
  };

  const roleOptions = [
    { value: 'admin', label: '超级管理员' },
    { value: 'manager', label: '项目经理' },
    { value: 'leader', label: '团队负责人' },
    { value: 'member', label: '普通成员' },
  ];

  const columns = [
    {
      title: '用户名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color={getRoleColor(role)}>{role}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>编辑角色</Button>
        </Space>
      ),
    },
  ];

  if (currentUser?.role !== 'admin') {
    return <Card>仅管理员可访问此页面</Card>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>系统管理</h1>
        <p className="subtitle">管理用户和系统配置</p>
      </div>

      <Tabs items={[
        {
          key: 'users',
          label: '用户管理',
          children: (
            <Card>
              <Table
                columns={columns}
                dataSource={users}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            </Card>
          ),
        },
        {
          key: 'reports',
          label: '报告管理',
          children: (
            <Row gutter={24}>
              <Col span={12}>
                <Card title="每日报告">
                  <p>生成并发送每日项目状态报告</p>
                  <Button 
                    type="primary" 
                    icon={<ReloadOutlined />} 
                    onClick={handleGenerateReport}
                  >
                    生成并发送报告
                  </Button>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="系统信息">
                  <p>环境: {import.meta.env.MODE || 'development'}</p>
                  <p>版本: 1.0.0</p>
                </Card>
              </Col>
            </Row>
          ),
        },
        {
          key: 'settings',
          label: '系统设置',
          children: (
            <Card>
              <p>系统设置功能开发中...</p>
            </Card>
          ),
        },
      ]} />

      <Modal
        title="编辑用户角色"
        open={userModalVisible}
        onCancel={() => setUserModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="用户名">
            <Input disabled />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input disabled />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select options={roleOptions} />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setUserModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
