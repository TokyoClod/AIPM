import { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Spin, Input, Select, Button, Table, Tag, Space, Modal, Form, message, Empty, Drawer, Descriptions, List, Divider } from 'antd';
import { 
  BookOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  TagsOutlined,
  LinkOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { knowledgeApi, projectApi } from '../api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Knowledge {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
  project_links?: { id: string; name: string }[];
}

interface Category {
  id: string;
  name: string;
  count: number;
}

export default function Knowledge() {
  const [loading, setLoading] = useState(true);
  const [knowledgeList, setKnowledgeList] = useState<Knowledge[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentKnowledge, setCurrentKnowledge] = useState<Knowledge | null>(null);
  const [editingKnowledge, setEditingKnowledge] = useState<Knowledge | null>(null);
  const [form] = Form.useForm();
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>();

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedTag]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCategory) params.category = selectedCategory;
      if (selectedTag) params.tag = selectedTag;

      const [listRes, categoriesRes, tagsRes, projectsRes] = await Promise.all([
        knowledgeApi.getList(params),
        knowledgeApi.getCategories(),
        knowledgeApi.getTags(),
        projectApi.getAll(),
      ]);
      
      if (listRes.data.success) {
        setKnowledgeList(listRes.data.data);
      }
      if (categoriesRes.data.success) {
        setCategories(categoriesRes.data.data);
      }
      if (tagsRes.data.success) {
        setTags(tagsRes.data.data);
      }
      if (projectsRes.data.success) {
        setProjects(projectsRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load knowledge data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      loadData();
      return;
    }
    
    setLoading(true);
    try {
      const res = await knowledgeApi.search(searchKeyword);
      if (res.data.success) {
        setKnowledgeList(res.data.data);
      }
    } catch (error) {
      message.error('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingKnowledge(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Knowledge) => {
    setEditingKnowledge(record);
    form.setFieldsValue({
      title: record.title,
      content: record.content,
      category: record.category,
      tags: record.tags,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这篇文档吗？此操作不可恢复。',
      okText: '删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await knowledgeApi.delete(id);
          if (res.data.success) {
            message.success('删除成功');
            loadData();
          }
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        tags: values.tags || [],
      };

      if (editingKnowledge) {
        const res = await knowledgeApi.update(editingKnowledge.id, data);
        if (res.data.success) {
          message.success('更新成功');
          setModalVisible(false);
          loadData();
        }
      } else {
        const res = await knowledgeApi.create(data);
        if (res.data.success) {
          message.success('创建成功');
          setModalVisible(false);
          loadData();
        }
      }
    } catch (error) {
      message.error(editingKnowledge ? '更新失败' : '创建失败');
    }
  };

  const handleView = async (id: string) => {
    try {
      const res = await knowledgeApi.getDetail(id);
      if (res.data.success) {
        setCurrentKnowledge(res.data.data);
        setDrawerVisible(true);
      }
    } catch (error) {
      message.error('获取详情失败');
    }
  };

  const handleLinkProject = async () => {
    if (!currentKnowledge || !selectedProject) return;
    
    try {
      const res = await knowledgeApi.linkProject(currentKnowledge.id, selectedProject);
      if (res.data.success) {
        message.success('关联项目成功');
        setLinkModalVisible(false);
        handleView(currentKnowledge.id);
      }
    } catch (error) {
      message.error('关联项目失败');
    }
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Knowledge) => (
        <a onClick={() => handleView(record.id)} style={{ fontWeight: 500, color: '#6366f1' }}>
          {text}
        </a>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag icon={<FolderOutlined />} color="blue">{category}</Tag>
      )
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <Space wrap size={[4, 4]}>
          {tags.slice(0, 3).map(tag => (
            <Tag key={tag} style={{ margin: 0, borderRadius: 12 }}>{tag}</Tag>
          ))}
          {tags.length > 3 && <Tag>+{tags.length - 3}</Tag>}
        </Space>
      )
    },
    {
      title: '作者',
      dataIndex: 'author_name',
      key: 'author_name'
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Knowledge) => (
        <Space>
          <Button 
            type="text" 
            icon={<EyeOutlined />}
            onClick={() => handleView(record.id)}
          />
          <Button 
            type="text" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button 
            type="text" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
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
          <Title level={2} style={{ margin: 0 }}>知识库</Title>
          <Text type="secondary">团队知识文档管理与共享</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleCreate}
          className="btn-primary-gradient"
        >
          创建文档
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={6}>
          <div className="chart-container">
            <div className="chart-title">
              <FolderOutlined style={{ marginRight: 8 }} />
              分类
            </div>
            <List
              dataSource={categories}
              renderItem={(item) => (
                <List.Item 
                  style={{ 
                    padding: '8px 12px', 
                    cursor: 'pointer',
                    background: selectedCategory === item.name ? 'var(--color-primary-light)' : 'transparent',
                    borderRadius: 8,
                    marginBottom: 4
                  }}
                  onClick={() => setSelectedCategory(selectedCategory === item.name ? undefined : item.name)}
                >
                  <Space>
                    <FolderOutlined style={{ color: '#6366f1' }} />
                    <Text>{item.name}</Text>
                  </Space>
                  <Tag>{item.count}</Tag>
                </List.Item>
              )}
            />
          </div>

          <div className="chart-container" style={{ marginTop: 24 }}>
            <div className="chart-title">
              <TagsOutlined style={{ marginRight: 8 }} />
              热门标签
            </div>
            <Space wrap size={[8, 8]}>
              {tags.map(tag => (
                <Tag 
                  key={tag}
                  style={{ 
                    cursor: 'pointer',
                    padding: '4px 12px',
                    borderRadius: 16,
                    background: selectedTag === tag ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                    color: selectedTag === tag ? '#fff' : 'var(--color-text-primary)',
                    border: 'none'
                  }}
                  onClick={() => setSelectedTag(selectedTag === tag ? undefined : tag)}
                >
                  {tag}
                </Tag>
              ))}
            </Space>
          </div>
        </Col>

        <Col xs={24} lg={18}>
          <div className="chart-container">
            <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
              <Input.Search
                placeholder="搜索文档..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onSearch={handleSearch}
                enterButton={<SearchOutlined />}
                style={{ flex: 1 }}
                allowClear
              />
              <Select
                placeholder="选择分类"
                value={selectedCategory}
                onChange={setSelectedCategory}
                allowClear
                style={{ width: 150 }}
                options={categories.map(c => ({ value: c.name, label: c.name }))}
              />
            </div>

            <Table
              columns={columns}
              dataSource={knowledgeList}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: <Empty description="暂无文档" /> }}
            />
          </div>
        </Col>
      </Row>

      <Modal
        title={editingKnowledge ? '编辑文档' : '创建文档'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={700}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入文档标题" />
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select
              placeholder="选择分类"
              options={categories.map(c => ({ value: c.name, label: c.name }))}
            />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={10} placeholder="请输入文档内容" />
          </Form.Item>
          <Form.Item
            name="tags"
            label="标签"
          >
            <Select
              mode="tags"
              placeholder="输入标签后按回车添加"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={currentKnowledge?.title}
        placement="right"
        width={720}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          <Space>
            <Button 
              icon={<LinkOutlined />}
              onClick={() => setLinkModalVisible(true)}
            >
              关联项目
            </Button>
            <Button 
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setDrawerVisible(false);
                handleEdit(currentKnowledge!);
              }}
              className="btn-primary-gradient"
            >
              编辑
            </Button>
          </Space>
        }
      >
        {currentKnowledge && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="分类">
                <Tag icon={<FolderOutlined />} color="blue">{currentKnowledge.category}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="标签">
                <Space wrap size={[4, 4]}>
                  {currentKnowledge.tags.map(tag => (
                    <Tag key={tag} style={{ borderRadius: 12 }}>{tag}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="作者">{currentKnowledge.author_name}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(currentKnowledge.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(currentKnowledge.updated_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <Divider>文档内容</Divider>

            <div style={{ 
              padding: 16, 
              background: 'var(--color-bg-subtle)', 
              borderRadius: 8,
              whiteSpace: 'pre-wrap',
              lineHeight: 1.8
            }}>
              {currentKnowledge.content}
            </div>

            {currentKnowledge.project_links && currentKnowledge.project_links.length > 0 && (
              <>
                <Divider>关联项目</Divider>
                <Space wrap>
                  {currentKnowledge.project_links.map(project => (
                    <Tag key={project.id} color="purple" icon={<LinkOutlined />}>
                      {project.name}
                    </Tag>
                  ))}
                </Space>
              </>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title="关联项目"
        open={linkModalVisible}
        onCancel={() => setLinkModalVisible(false)}
        onOk={handleLinkProject}
        okText="关联"
        cancelText="取消"
      >
        <Select
          placeholder="选择要关联的项目"
          style={{ width: '100%' }}
          value={selectedProject}
          onChange={setSelectedProject}
          options={projects.map(p => ({ value: p.id, label: p.name }))}
        />
      </Modal>
    </div>
  );
}
