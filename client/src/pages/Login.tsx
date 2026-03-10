import { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs } from 'antd';
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
        message.success('登录成功');
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
        message.success('注册成功');
        navigate('/');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const LoginForm = () => (
    <Form onFinish={handleLogin} layout="vertical">
      <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }]}>
        <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
          登录
        </Button>
      </Form.Item>
    </Form>
  );

  const RegisterForm = () => (
    <Form onFinish={handleRegister} layout="vertical">
      <Form.Item name="name" rules={[{ required: true, message: '请输入用户名' }]}>
        <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
      </Form.Item>
      <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效邮箱' }]}>
        <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
          注册
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <h2>AIPM 项目管理平台</h2>
        <Tabs items={[
          { key: 'login', label: '登录', children: <LoginForm /> },
          { key: 'register', label: '注册', children: <RegisterForm /> },
        ]} />
      </Card>
    </div>
  );
}
