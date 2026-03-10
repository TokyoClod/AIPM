import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Space, Typography, Button, Tooltip } from 'antd';
import { 
  DashboardOutlined, 
  ProjectOutlined, 
  FileTextOutlined, 
  AlertOutlined,
  WarningOutlined,
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BulbOutlined,
  BulbFilled
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { notificationApi } from '../../api';
import { useEffect } from 'react';
import { Notification } from '../../types';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/projects', icon: <ProjectOutlined />, label: '项目管理' },
  { key: '/tasks', icon: <FileTextOutlined />, label: '任务管理' },
  { key: '/risks', icon: <AlertOutlined />, label: '风险管理' },
  { key: '/risk-alerts', icon: <WarningOutlined />, label: '风险预警' },
  { key: '/admin', icon: <SettingOutlined />, label: '系统管理' },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await notificationApi.getAll();
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.data.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error('Failed to load notifications');
    }
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人资料' },
    { key: 'settings', icon: <SettingOutlined />, label: '设置' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ];

  return (
    <Layout className="app-layout">
      <Sider 
        className="app-sider" 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={240}
        collapsedWidth={80}
      >
        <div style={{ padding: collapsed ? '16px 8px' : '16px 24px', textAlign: 'center' }}>
          <Text strong style={{ fontSize: collapsed ? 14 : 18 }}>
            {collapsed ? 'AIPM' : '项目管理平台'}
          </Text>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          />
          <Space size="large">
            <Tooltip title={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}>
              <Button
                type="text"
                icon={theme === 'light' ? <BulbOutlined /> : <BulbFilled />}
                onClick={toggleTheme}
                style={{ fontSize: 18 }}
                className="btn-hover-effect"
              />
            </Tooltip>
            <Dropdown
              menu={{ 
                items: notifications.slice(0, 5).map((n, i) => ({
                  key: n.id,
                  label: (
                    <div style={{ maxWidth: 280 }}>
                      <Text strong>{n.title}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>{n.content}</Text>
                    </div>
                  ),
                }))
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Badge count={unreadCount} size="small">
                <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
              </Badge>
            </Dropdown>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} src={user?.avatar} />
                <Text>{user?.name}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content className="app-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
