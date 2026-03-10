import { useState, useEffect } from 'react';
import { Card, Button, Tag, Progress, Modal, Form, Input, Select, DatePicker, Slider, Row, Col, message, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import dayjs from 'dayjs';
import { taskApi } from '../../api';
import { Task } from '../../types';

const { TextArea } = Input;

interface KanbanBoardProps {
  projectId: string;
  onTaskUpdate: () => void;
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

function SortableTaskCard({ task, onEdit }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'green',
      medium: 'blue',
      high: 'orange',
      urgent: 'red',
    };
    return colors[priority] || 'default';
  };

  const getRiskColor = (level?: string) => {
    const colors: Record<string, string> = {
      low: 'green',
      medium: 'blue',
      high: 'orange',
      critical: 'red',
    };
    return level ? colors[level] : undefined;
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div 
        className={`task-card priority-${task.priority} ${task.status === 'completed' ? 'status-completed' : ''}`}
        onClick={() => onEdit(task)}
      >
        <div className="task-title">{task.title}</div>
        {task.description && (
          <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>
            {task.description.length > 50 ? task.description.substring(0, 50) + '...' : task.description}
          </div>
        )}
        <div className="task-meta">
          <span>
            <Tag color={getPriorityColor(task.priority)} style={{ margin: 0 }}>{task.priority}</Tag>
          </span>
          {task.risk_level && (
            <Tag color={getRiskColor(task.risk_level)} style={{ margin: 0 }}>风险</Tag>
          )}
        </div>
        <div style={{ marginTop: 8 }}>
          <Progress percent={task.progress} size="small" />
        </div>
        <div className="task-meta" style={{ marginTop: 8 }}>
          {task.assignee_name && <span>👤 {task.assignee_name}</span>}
          {task.end_date && <span>📅 {dayjs(task.end_date).format('MM-DD')}</span>}
        </div>
      </div>
    </div>
  );
}

const COLUMNS = [
  { id: 'pending', title: '待处理', color: '#d9d9d9' },
  { id: 'in_progress', title: '进行中', color: '#1890ff' },
  { id: 'completed', title: '已完成', color: '#52c41a' },
  { id: 'paused', title: '已暂停', color: '#faad14' },
];

export default function KanbanBoard({ projectId, onTaskUpdate }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await taskApi.getAll({ project_id: projectId });
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (error) {
      message.error('加载任务失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    if (COLUMNS.some(c => c.id === newStatus)) {
      try {
        await taskApi.update(taskId, { status: newStatus });
        onTaskUpdate();
        loadTasks();
      } catch (error) {
        message.error('更新失败');
      }
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    form.setFieldsValue({
      ...task,
      start_date: task.start_date ? dayjs(task.start_date) : null,
      end_date: task.end_date ? dayjs(task.end_date) : null,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        project_id: projectId,
        start_date: values.start_date?.format('YYYY-MM-DD'),
        end_date: values.end_date?.format('YYYY-MM-DD'),
      };

      if (editingTask) {
        await taskApi.update(editingTask.id, data);
        message.success('任务已更新');
      } else {
        await taskApi.create(data);
        message.success('任务已创建');
      }
      setModalVisible(false);
      onTaskUpdate();
      loadTasks();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getTasksByStatus = (status: string) => {
    const flatTasks = flattenTasks(tasks);
    return flatTasks.filter(t => t.status === status);
  };

  const flattenTasks = (taskList: Task[]): Task[] => {
    return taskList.reduce((acc: Task[], task) => {
      acc.push(task);
      if (task.children && task.children.length > 0) {
        acc.push(...flattenTasks(task.children));
      }
      return acc;
    }, []);
  };

  return (
    <div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {COLUMNS.map(column => (
            <div key={column.id} className="kanban-column">
              <div className="column-header" style={{ borderColor: column.color }}>
                <span>{column.title}</span>
                <span className="column-count">{getTasksByStatus(column.id).length}</span>
              </div>
              <SortableContext 
                items={getTasksByStatus(column.id).map(t => t.id)} 
                strategy={verticalListSortingStrategy}
              >
                <div className="task-list">
                  {getTasksByStatus(column.id).map(task => (
                    <SortableTaskCard key={task.id} task={task} onEdit={handleEdit} />
                  ))}
                  {getTasksByStatus(column.id).length === 0 && (
                    <Empty description="暂无任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </div>
              </SortableContext>
              <Button 
                type="dashed" 
                block 
                icon={<PlusOutlined />}
                onClick={() => {
                  form.resetFields();
                  setEditingTask(null);
                  setModalVisible(true);
                }}
                style={{ marginTop: 8 }}
              >
                添加任务
              </Button>
            </div>
          ))}
        </div>
      </DndContext>

      <Modal
        title={editingTask ? '编辑任务' : '新建任务'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="任务标题" rules={[{ required: true, message: '请输入任务标题' }]}>
            <Input placeholder="请输入任务标题" />
          </Form.Item>
          <Form.Item name="description" label="任务描述">
            <TextArea rows={3} placeholder="请输入任务描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="状态" initialValue="pending">
                <Select>
                  {COLUMNS.map(c => (
                    <Select.Option key={c.id} value={c.id}>{c.title}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" initialValue="medium">
                <Select>
                  <Select.Option value="low">低</Select.Option>
                  <Select.Option value="medium">中</Select.Option>
                  <Select.Option value="high">高</Select.Option>
                  <Select.Option value="urgent">紧急</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_date" label="开始日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_date" label="结束日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="progress" label="进度" initialValue={0}>
            <Slider marks={{ 0: '0%', 50: '50%', 100: '100%' }} />
          </Form.Item>
          <Form.Item>
            <div style={{ textAlign: 'right' }}>
              <Button onClick={() => setModalVisible(false)} style={{ marginRight: 8 }}>取消</Button>
              <Button type="primary" htmlType="submit">提交</Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
