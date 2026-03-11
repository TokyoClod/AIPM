import { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, message, Card, Typography } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { notificationApi } from '../api';
import { Notification } from '../types';

const { Title, Text } = Typography;

export default function RiskAlerts() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getAll();
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (error) {
      message.error('加载通知失败');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await notificationApi.markRead(id);
      if (res.data.success) {
        message.success('已标记为已读');
        loadNotifications();
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      risk: 'red',
      task: 'blue',
      system: 'green',
      mention: 'orange',
    };
    return colors[type] || 'default';
  };

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag color={getTypeColor(type)}>{type}</Tag>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '状态',
      dataIndex: 'read',
      key: 'read',
      width: 100,
      render: (read: boolean) => (
        <Tag color={read ? 'default' : 'processing'}>{read ? '已读' : '未读'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: Notification) => (
        !record.read && (
          <Button type="link" icon={<CheckOutlined />} onClick={() => handleMarkAsRead(record.id)}>
            标记已读
          </Button>
        )
      ),
    },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BellOutlined style={{ fontSize: 24, color: '#6366f1' }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>风险预警</Title>
            <Text type="secondary">共 {notifications.length} 条通知，{unreadCount} 条未读</Text>
          </div>
        </div>
      </div>

      <Card>
        <Table columns={columns} dataSource={notifications} rowKey="id" loading={loading} />
      </Card>
    </div>
  );
}
