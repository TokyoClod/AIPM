import { useState } from 'react';
import { Form, Input, Button, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(values.email, values.password);
      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.token);
        message.success('欢迎回来');
        navigate('/');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: { email: string; password: string; name: string }) => {
    setLoading(true);
    try {
      const res = await authApi.register(values.email, values.password, values.name);
      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.token);
        message.success('注册成功，欢迎加入');
        navigate('/');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const LoginForm = () => (
    <Form onFinish={handleLogin} layout="vertical" size="large">
      <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱地址' }]}>
        <Input 
          prefix={<MailOutlined style={{ color: '#6366f1' }} />} 
          placeholder="邮箱地址" 
          style={{ height: 48 }}
        />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
        <Input.Password 
          prefix={<LockOutlined style={{ color: '#6366f1' }} />} 
          placeholder="密码" 
          style={{ height: 48 }}
        />
      </Form.Item>
      <Form.Item style={{ marginBottom: 16 }}>
        <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ height: 48 }}>
          登录
        </Button>
      </Form.Item>
    </Form>
  );

  const RegisterForm = () => (
    <Form onFinish={handleRegister} layout="vertical" size="large">
      <Form.Item name="name" rules={[{ required: true, message: '请输入用户名' }]}>
        <Input 
          prefix={<UserOutlined style={{ color: '#6366f1' }} />} 
          placeholder="用户名" 
          style={{ height: 48 }}
        />
      </Form.Item>
      <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效邮箱' }]}>
        <Input 
          prefix={<MailOutlined style={{ color: '#6366f1' }} />} 
          placeholder="邮箱地址" 
          style={{ height: 48 }}
        />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}>
        <Input.Password 
          prefix={<LockOutlined style={{ color: '#6366f1' }} />} 
          placeholder="设置密码" 
          style={{ height: 48 }}
        />
      </Form.Item>
      <Form.Item style={{ marginBottom: 16 }}>
        <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ height: 48 }}>
          创建账号
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="brand-logo">
          <h1>AIPM</h1>
          <p>智能项目管理平台</p>
        </div>
        <Tabs 
          items={[
            { key: 'login', label: '登录', children: <LoginForm /> },
            { key: 'register', label: '注册', children: <RegisterForm /> },
          ]} 
          centered
        />
      </div>
    </div>
  );
}
