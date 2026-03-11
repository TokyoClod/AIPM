import { useEffect, useState } from 'react';
import { Card, Button, Space, Tag, Modal, Form, Input, Select, message, Spin, Empty, DatePicker, Progress } from 'antd';
import { 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HolderOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { stagesApi } from '../api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface Stage {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  start_date?: string;
  end_date?: string;
  order: number;
  progress?: number;
}

interface ProjectStagesProps {
  projectId: string;
}

const statusConfig = {
  pending: { label: '待开始', color: 'default', icon: <ClockCircleOutlined /> },
  in_progress: { label: '进行中', color: 'processing', icon: <ClockCircleOutlined spin /> },
  completed: { label: '已完成', color: 'success', icon: <CheckCircleOutlined /> },
  paused: { label: '已暂停', color: 'warning', icon: <PauseCircleOutlined /> },
  cancelled: { label: '已取消', color: 'error', icon: <CloseCircleOutlined /> },
};

export default function ProjectStages({ projectId }: ProjectStagesProps) {
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<Stage[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadStages();
  }, [projectId]);

  const loadStages = async () => {
    setLoading(true);
    try {
      const res = await stagesApi.getProjectStages(projectId);
      if (res.data.success) {
        setStages(res.data.data.sort((a: Stage, b: Stage) => a.order - b.order));
      }
    } catch (error) {
      console.error('Failed to load stages');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingStage(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (stage: Stage) => {
    setEditingStage(stage);
    form.setFieldsValue({
      name: stage.name,
      description: stage.description,
      status: stage.status,
      dateRange: stage.start_date && stage.end_date 
        ? [dayjs(stage.start_date), dayjs(stage.end_date)] 
        : undefined,
    });
    setModalVisible(true);
  };

  const handleDelete = async (stageId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个阶段吗？',
      okText: '删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await stagesApi.deleteStage(projectId, stageId);
          if (res.data.success) {
            message.success('删除成功');
            loadStages();
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
        name: values.name,
        description: values.description,
        status: values.status || 'pending',
        start_date: values.dateRange?.[0]?.toISOString(),
        end_date: values.dateRange?.[1]?.toISOString(),
      };

      if (editingStage) {
        const res = await stagesApi.updateStage(projectId, editingStage.id, data);
        if (res.data.success) {
          message.success('更新成功');
          setModalVisible(false);
          loadStages();
        }
      } else {
        const res = await stagesApi.createStage(projectId, data);
        if (res.data.success) {
          message.success('创建成功');
          setModalVisible(false);
          loadStages();
        }
      }
    } catch (error) {
      message.error(editingStage ? '更新失败' : '创建失败');
    }
  };

  const handleStatusChange = async (stageId: string, status: string) => {
    try {
      const res = await stagesApi.updateStageStatus(projectId, stageId, status);
      if (res.data.success) {
        message.success('状态更新成功');
        loadStages();
      }
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newStages = [...stages];
    const draggedItem = newStages[draggedIndex];
    newStages.splice(draggedIndex, 1);
    newStages.splice(index, 0, draggedItem);
    
    newStages.forEach((stage, idx) => {
      stage.order = idx;
    });
    
    setStages(newStages);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;
    
    try {
      const stageIds = stages.map(s => s.id);
      const res = await stagesApi.reorderStages(projectId, stageIds);
      if (res.data.success) {
        message.success('排序已保存');
      }
    } catch (error) {
      message.error('保存排序失败');
      loadStages();
    } finally {
      setDraggedIndex(null);
    }
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
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 16 }}>项目阶段</span>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleCreate}
          size="small"
          className="btn-primary-gradient"
        >
          添加阶段
        </Button>
      </div>

      {stages.length === 0 ? (
        <Empty description="暂无阶段，点击添加阶段开始" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {stages.map((stage, index) => (
            <Card
              key={stage.id}
              size="small"
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                borderRadius: 12,
                cursor: 'move',
                border: draggedIndex === index ? '2px dashed #6366f1' : '1px solid var(--color-border-light)',
                opacity: draggedIndex === index ? 0.5 : 1,
              }}
              hoverable
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <HolderOutlined style={{ color: '#94a3b8', fontSize: 16, marginTop: 4 }} />
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{stage.name}</span>
                      <Tag 
                        icon={statusConfig[stage.status].icon}
                        color={statusConfig[stage.status].color}
                      >
                        {statusConfig[stage.status].label}
                      </Tag>
                    </div>
                    <Space size={4}>
                      <Button 
                        type="text" 
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(stage)}
                      />
                      <Button 
                        type="text" 
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(stage.id)}
                      />
                    </Space>
                  </div>

                  {stage.description && (
                    <div style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>
                      {stage.description}
                    </div>
                  )}

                  {stage.start_date && stage.end_date && (
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                      {dayjs(stage.start_date).format('YYYY-MM-DD')} ~ {dayjs(stage.end_date).format('YYYY-MM-DD')}
                    </div>
                  )}

                  {stage.progress !== undefined && (
                    <Progress 
                      percent={stage.progress} 
                      size="small"
                      strokeColor={{
                        '0%': '#6366f1',
                        '100%': '#8b5cf6',
                      }}
                    />
                  )}

                  <div style={{ marginTop: 8 }}>
                    <Select
                      size="small"
                      value={stage.status}
                      onChange={(value) => handleStatusChange(stage.id, value)}
                      style={{ width: 120 }}
                      options={Object.entries(statusConfig).map(([key, config]) => ({
                        value: key,
                        label: config.label,
                      }))}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        title={editingStage ? '编辑阶段' : '添加阶段'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="阶段名称"
            rules={[{ required: true, message: '请输入阶段名称' }]}
          >
            <Input placeholder="请输入阶段名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="阶段描述"
          >
            <Input.TextArea rows={3} placeholder="请输入阶段描述" />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            initialValue="pending"
          >
            <Select
              options={Object.entries(statusConfig).map(([key, config]) => ({
                value: key,
                label: config.label,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="dateRange"
            label="时间范围"
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
