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
  BulbFilled,
  DesktopOutlined,
  TeamOutlined
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
  { key: '/workbench', icon: <DesktopOutlined />, label: '个人工作台' },
  { key: '/team', icon: <TeamOutlined />, label: '团队协作' },
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
        className={`app-sider ${collapsed ? 'sider-collapsed' : ''}`}
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={240}
        collapsedWidth={80}
      >
        <div className="sider-logo">
          <div className="logo-icon">A</div>
          <div className="logo-text">智能项目管理</div>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ flex: 1 }}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
            className="btn-hover-effect"
          />
          <Space size="middle">
            <Tooltip title={theme === 'light' ? '暗色模式' : '亮色模式'}>
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
                items: notifications.slice(0, 5).map((n) => ({
                  key: n.id,
                  label: (
                    <div style={{ maxWidth: 280, padding: '4px 0' }}>
                      <Text strong style={{ fontSize: 13 }}>{n.title}</Text>
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
                <Button type="text" className="btn-hover-effect">
                  <BellOutlined style={{ fontSize: 20 }} />
                </Button>
              </Badge>
            </Dropdown>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }} className="btn-hover-effect">
                <Avatar 
                  size={36} 
                  icon={<UserOutlined />} 
                  src={user?.avatar}
                  style={{ 
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                  }} 
                />
                <Text style={{ fontWeight: 500 }}>{user?.name}</Text>
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
