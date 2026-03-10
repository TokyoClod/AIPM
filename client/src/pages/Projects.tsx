import { useEffect, useState } from 'react';
import { Button, Modal, Form, Input, DatePicker, Select, Space, Tag, message, Popconfirm, Row, Col, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ProjectOutlined, CalendarOutlined, UserOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { projectApi, authApi } from '../api';
import { useProjectStore } from '../stores/projectStore';
import { Project, User } from '../types';

const { TextArea } = Input;

export default function Projects() {
  const navigate = useNavigate();
  const { projects, setProjects } = useProjectStore();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadProjects();
    loadUsers();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await projectApi.getAll();
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (error) {
      message.error('加载项目失败');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await authApi.getUsers();
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const handleCreate = () => {
    setEditingProject(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    form.setFieldsValue({
      ...project,
      start_date: project.start_date ? dayjs(project.start_date) : null,
      end_date: project.end_date ? dayjs(project.end_date) : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await projectApi.delete(id);
      if (res.data.success) {
        message.success('项目已删除');
        loadProjects();
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        start_date: values.start_date?.format('YYYY-MM-DD'),
        end_date: values.end_date?.format('YYYY-MM-DD'),
      };

      if (editingProject) {
        const res = await projectApi.update(editingProject.id, data);
        if (res.data.success) {
          message.success('项目已更新');
        } else {
          message.error(res.data.message || '更新失败');
        }
      } else {
        const res = await projectApi.create(data);
        if (res.data.success) {
          message.success('项目已创建');
        } else {
          message.error(res.data.message || '创建失败');
        }
      }
      setModalVisible(false);
      loadProjects();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'green',
      completed: 'blue',
      suspended: 'orange',
      archived: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: '进行中',
      completed: '已完成',
      suspended: '已暂停',
      archived: '已归档',
    };
    return labels[status] || status;
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>项目管理</h1>
          <p className="subtitle" style={{ margin: '4px 0 0' }}>创建和管理您的项目</p>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleCreate}
          size="large"
        >
          新建项目
        </Button>
      </div>

      {projects.length === 0 && !loading ? (
        <Empty 
          description="暂无项目" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ marginTop: 80 }}
        >
          <Button type="primary" onClick={handleCreate}>
            创建第一个项目
          </Button>
        </Empty>
      ) : (
        <Row gutter={[20, 20]}>
          {projects.map((project) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
              <div 
                className="project-card" 
                onClick={() => navigate(`/projects/${project.id}`)}
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div 
                    style={{ 
                      width: 44, 
                      height: 44, 
                      borderRadius: 10, 
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 18,
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }}
                  >
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <Tag color={getStatusColor(project.status)} style={{ margin: 0 }}>
                    {getStatusLabel(project.status)}
                  </Tag>
                </div>
                
                <h3 className="project-name" style={{ marginBottom: 8, fontSize: 16, fontWeight: 600 }}>
                  {project.name}
                </h3>
                
                <p className="project-desc" style={{ flex: 1, marginBottom: 16 }}>
                  {project.description || '暂无描述'}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13 }}>
                    <CalendarOutlined />
                    <span>{project.start_date ? dayjs(project.start_date).format('MM-DD') : '-'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13 }}>
                    <UserOutlined />
                    <span>{project.owner_name || '未分配'}</span>
                  </div>
                </div>
                
                <div 
                  style={{ 
                    display: 'flex', 
                    gap: 8, 
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid #f1f5f9'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<EditOutlined />}
                    onClick={(e) => handleEdit(project, e)}
                    className="btn-hover-effect"
                  >
                    编辑
                  </Button>
                  <Popconfirm title="确认删除此项目?" onConfirm={() => handleDelete(project.id)}>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<RightOutlined />}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    style={{ marginLeft: 'auto' }}
                  >
                    详情
                  </Button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={editingProject ? '编辑项目' : '新建项目'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={560}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 24 }}>
          <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="请输入项目名称" size="large" />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <TextArea rows={3} placeholder="请输入项目描述" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select size="large">
              <Select.Option value="active">进行中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="suspended">已暂停</Select.Option>
              <Select.Option value="archived">已归档</Select.Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_date" label="开始日期">
                <DatePicker style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_date" label="结束日期">
                <DatePicker style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end', gap: 12 }}>
              <Button size="large" onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" size="large">
                {editingProject ? '保存修改' : '创建项目'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
