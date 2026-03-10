import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import MainLayout from './components/Layout/MainLayout';
import AIAssistant from './components/AI/AIAssistant';
import QuickInput from './components/AI/QuickInput';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Risks from './pages/Risks';
import RiskAlerts from './pages/RiskAlerts';
import Admin from './pages/Admin';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
}

function App() {
  const [loading, setLoading] = useState(true);
  const [quickInputVisible, setQuickInputVisible] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // 初始化主题
  useEffect(() => {
    // 应用保存的主题
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // 全局快捷键监听 - Cmd+K (Mac) / Ctrl+K (Windows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检查是否按下 Cmd+K (Mac) 或 Ctrl+K (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // 只有在已登录状态下才触发
        if (isAuthenticated) {
          setQuickInputVisible(true);
        }
      }
    };

    // 添加全局键盘事件监听
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f5f7fa'
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:id" element={<ProjectDetail />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/tasks/:id" element={<TaskDetail />} />
                  <Route path="/risks" element={<Risks />} />
                  <Route path="/risk-alerts" element={<RiskAlerts />} />
                  <Route path="/admin" element={<Admin />} />
                </Routes>
              </MainLayout>
            </PrivateRoute>
          }
        />
      </Routes>
      <AIAssistant />
      <QuickInput
        visible={quickInputVisible}
        onClose={() => setQuickInputVisible(false)}
      />
    </>
  );
}

export default App;
