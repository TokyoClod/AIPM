import { useEffect, useState } from 'react';
import { Spin, Empty, Card, Row, Col, Tag, Typography } from 'antd';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { taskApi } from '../../api';
import { Task } from '../../types';

const { Text } = Typography;

interface GanttChartProps {
  projectId: string;
}

export default function GanttChart({ projectId }: GanttChartProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await taskApi.getGantt(projectId);
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load tasks for gantt');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div style={{ padding: 50 }}>
        <Empty description="暂无带日期的任务数据" />
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
          请为任务设置开始日期和结束日期以显示甘特图
        </Text>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#d9d9d9',
      in_progress: '#1890ff',
      completed: '#52c41a',
      paused: '#faad14',
      cancelled: '#f5222d',
    };
    return colors[status] || '#d9d9d9';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待处理',
      in_progress: '进行中',
      completed: '已完成',
      paused: '已暂停',
      cancelled: '已取消',
    };
    return labels[status] || status;
  };

  const chartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const task = tasks[params[0].dataIndex];
        if (!task) return '';
        return `
          <div style="font-weight: bold">${task.title}</div>
          <div>状态: ${getStatusLabel(task.status)}</div>
          <div>进度: ${task.progress}%</div>
          <div>优先级: ${task.priority}</div>
          ${task.start_date ? `<div>开始: ${task.start_date}</div>` : ''}
          ${task.end_date ? `<div>结束: ${task.end_date}</div>` : ''}
          ${task.assignee_name ? `<div>负责人: ${task.assignee_name}</div>` : ''}
        `;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      name: '进度 (%)',
      nameLocation: 'middle',
      nameGap: 30,
    },
    yAxis: {
      type: 'category',
      data: tasks.map(t => t.title),
      inverse: true,
      axisLabel: {
        width: 150,
        overflow: 'truncate',
      },
    },
    series: [
      {
        name: '任务进度',
        type: 'bar',
        barWidth: '60%',
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
        },
        itemStyle: {
          color: (params: any) => getStatusColor(tasks[params.dataIndex]?.status || 'pending'),
          borderRadius: [0, 4, 4, 0],
        },
        data: tasks.map(t => t.progress),
      },
    ],
  };

  const timelineOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const task = tasks.find((_, i) => i === params[0].dataIndex);
        if (!task) return '';
        return `
          <div style="font-weight: bold">${task.title}</div>
          <div>状态: ${getStatusLabel(task.status)}</div>
          <div>进度: ${task.progress}%</div>
          ${task.start_date ? `<div>开始: ${task.start_date}</div>` : ''}
          ${task.end_date ? `<div>结束: ${task.end_date}</div>` : ''}
        `;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      name: '工期进度 (%)',
      nameLocation: 'middle',
      nameGap: 30,
    },
    yAxis: {
      type: 'category',
      data: tasks.map(t => t.title),
      inverse: true,
    },
    series: [
      {
        name: '进度',
        type: 'bar',
        barWidth: '60%',
        stack: 'total',
        label: {
          show: false,
        },
        itemStyle: {
          color: '#e8e8e8',
          borderRadius: [0, 4, 4, 0],
        },
        data: tasks.map(t => {
          if (!t.start_date || !t.end_date) return 0;
          const total = dayjs(t.end_date).diff(dayjs(t.start_date), 'day');
          const elapsed = dayjs().diff(dayjs(t.start_date), 'day');
          return Math.min(100, Math.max(0, (elapsed / total) * 100));
        }),
      },
    ],
  };

  return (
    <div className="gantt-container">
      <Row gutter={24}>
        <Col span={12}>
          <Card title="任务进度" size="small" style={{ marginBottom: 16 }}>
            <ReactECharts option={chartOption} style={{ height: Math.max(300, tasks.length * 40) }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="时间线" size="small" style={{ marginBottom: 16 }}>
            <ReactECharts option={timelineOption} style={{ height: Math.max(300, tasks.length * 40) }} />
          </Card>
        </Col>
      </Row>

      <Card title="任务详情" size="small">
        <Row gutter={[16, 16]}>
          {tasks.map(task => (
            <Col span={24} key={task.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                    {task.start_date && task.end_date && (
                      <span>{task.start_date} ~ {task.end_date}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Tag color={getStatusColor(task.status)}>{getStatusLabel(task.status)}</Tag>
                  <span style={{ minWidth: 45 }}>{task.progress}%</span>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, background: '#d9d9d9', borderRadius: 2 }}></span> 待处理
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, background: '#1890ff', borderRadius: 2 }}></span> 进行中
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, background: '#52c41a', borderRadius: 2 }}></span> 已完成
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, background: '#faad14', borderRadius: 2 }}></span> 已暂停
        </span>
      </div>
    </div>
  );
}
