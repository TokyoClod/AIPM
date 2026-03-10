import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../../stores/projectStore';

describe('projectStore', () => {
  beforeEach(() => {
    // 重置 store 状态
    useProjectStore.setState({
      projects: [],
      currentProject: null,
      projectDashboard: null,
      tasks: [],
      risks: [],
      dashboardStats: null,
      loading: false,
    });
  });

  it('初始状态应该是正确的', () => {
    const state = useProjectStore.getState();
    
    expect(state.projects).toEqual([]);
    expect(state.currentProject).toBeNull();
    expect(state.projectDashboard).toBeNull();
    expect(state.tasks).toEqual([]);
    expect(state.risks).toEqual([]);
    expect(state.dashboardStats).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('setProjects 应该设置项目列表', () => {
    const mockProjects = [
      { id: '1', name: '项目A' },
      { id: '2', name: '项目B' },
    ];
    
    const { setProjects } = useProjectStore.getState();
    setProjects(mockProjects);
    
    expect(useProjectStore.getState().projects).toEqual(mockProjects);
  });

  it('setCurrentProject 应该设置当前项目', () => {
    const mockProject = { id: '1', name: '项目A' };
    
    const { setCurrentProject } = useProjectStore.getState();
    setCurrentProject(mockProject);
    
    expect(useProjectStore.getState().currentProject).toEqual(mockProject);
  });

  it('setCurrentProject 应该能够设置为 null', () => {
    useProjectStore.setState({ currentProject: { id: '1', name: '项目A' } });
    
    const { setCurrentProject } = useProjectStore.getState();
    setCurrentProject(null);
    
    expect(useProjectStore.getState().currentProject).toBeNull();
  });

  it('setProjectDashboard 应该设置项目仪表盘数据', () => {
    const mockDashboard = {
      project: { id: '1', name: '项目A' },
      stats: { totalTasks: 10, completedTasks: 5 },
    };
    
    const { setProjectDashboard } = useProjectStore.getState();
    setProjectDashboard(mockDashboard);
    
    expect(useProjectStore.getState().projectDashboard).toEqual(mockDashboard);
  });

  it('setTasks 应该设置任务列表', () => {
    const mockTasks = [
      { id: '1', title: '任务1', status: 'pending' },
      { id: '2', title: '任务2', status: 'completed' },
    ];
    
    const { setTasks } = useProjectStore.getState();
    setTasks(mockTasks);
    
    expect(useProjectStore.getState().tasks).toEqual(mockTasks);
  });

  it('setRisks 应该设置风险列表', () => {
    const mockRisks = [
      { id: '1', description: '风险1', level: 'high' },
      { id: '2', description: '风险2', level: 'low' },
    ];
    
    const { setRisks } = useProjectStore.getState();
    setRisks(mockRisks);
    
    expect(useProjectStore.getState().risks).toEqual(mockRisks);
  });

  it('setDashboardStats 应该设置仪表盘统计', () => {
    const mockStats = {
      totalProjects: 10,
      activeProjects: 5,
      completionRate: 75,
    };
    
    const { setDashboardStats } = useProjectStore.getState();
    setDashboardStats(mockStats);
    
    expect(useProjectStore.getState().dashboardStats).toEqual(mockStats);
  });

  it('setLoading 应该设置加载状态', () => {
    const { setLoading } = useProjectStore.getState();
    
    setLoading(true);
    expect(useProjectStore.getState().loading).toBe(true);
    
    setLoading(false);
    expect(useProjectStore.getState().loading).toBe(false);
  });

  it('多次调用 setProjects 应该更新列表', () => {
    const { setProjects } = useProjectStore.getState();
    
    setProjects([{ id: '1', name: '项目A' }]);
    expect(useProjectStore.getState().projects).toHaveLength(1);
    
    setProjects([{ id: '1', name: '项目A' }, { id: '2', name: '项目B' }]);
    expect(useProjectStore.getState().projects).toHaveLength(2);
    
    setProjects([]);
    expect(useProjectStore.getState().projects).toHaveLength(0);
  });

  it('所有 setter 应该能够独立工作', () => {
    const { setProjects, setTasks, setRisks, setLoading } = useProjectStore.getState();
    
    setProjects([{ id: '1', name: '项目' }]);
    setTasks([{ id: '1', title: '任务' }]);
    setRisks([{ id: '1', description: '风险' }]);
    setLoading(true);
    
    const state = useProjectStore.getState();
    expect(state.projects).toHaveLength(1);
    expect(state.tasks).toHaveLength(1);
    expect(state.risks).toHaveLength(1);
    expect(state.loading).toBe(true);
  });

  it('应该能够同时更新多个状态', () => {
    useProjectStore.setState({
      projects: [{ id: '1', name: '项目' }],
      tasks: [{ id: '1', title: '任务' }],
      loading: true,
    });
    
    const state = useProjectStore.getState();
    expect(state.projects).toHaveLength(1);
    expect(state.tasks).toHaveLength(1);
    expect(state.loading).toBe(true);
  });

  it('状态更新应该是不可变的', () => {
    const { setProjects } = useProjectStore.getState();
    const projects1 = [{ id: '1', name: '项目A' }];
    const projects2 = [{ id: '2', name: '项目B' }];
    
    setProjects(projects1);
    const state1 = useProjectStore.getState();
    
    setProjects(projects2);
    const state2 = useProjectStore.getState();
    
    // 旧状态不应该被修改
    expect(state1.projects[0].id).toBe('1');
    expect(state2.projects[0].id).toBe('2');
  });
});
