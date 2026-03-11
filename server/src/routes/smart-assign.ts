import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/database.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/recommend', (req: AuthRequest, res: Response) => {
  try {
    const { task_id, project_id } = req.query;

    if (!task_id && !project_id) {
      return res.status(400).json({ success: false, message: '任务ID或项目ID不能为空' });
    }

    let targetTasks: any[] = [];
    
    if (task_id) {
      const task = db.tasks.findById(task_id as string);
      if (!task) {
        return res.status(404).json({ success: false, message: '任务不存在' });
      }
      targetTasks = [task];
    } else if (project_id) {
      targetTasks = db.tasks.findByProject(project_id as string).filter(t => !t.assignee_id);
    }

    const projectMembers = project_id 
      ? db.project_members.findByProject(project_id as string)
      : (task_id ? db.project_members.findByProject(targetTasks[0].project_id) : []);

    if (projectMembers.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const recommendations = targetTasks.map(task => {
      const memberScores = projectMembers.map(member => {
        const user = db.users.findById(member.user_id);
        if (!user) return null;

        const userSkills = db.userSkills.findByUser(member.user_id);
        const skillMatchScore = calculateSkillMatchScore(task, userSkills);
        
        const workloadScore = calculateWorkloadScore(member.user_id);
        
        const performanceScore = calculatePerformanceScore(member.user_id);
        
        const totalScore = skillMatchScore * 0.4 + workloadScore * 0.35 + performanceScore * 0.25;

        return {
          user_id: member.user_id,
          user_name: user.name,
          user_email: user.email,
          skill_match_score: skillMatchScore,
          workload_score: workloadScore,
          performance_score: performanceScore,
          total_score: totalScore,
          current_tasks: db.tasks.findByAssignee(member.user_id).filter(t => t.status !== 'completed').length,
        };
      }).filter(Boolean).sort((a, b) => b.total_score - a.total_score);

      return {
        task_id: task.id,
        task_title: task.title,
        recommendations: memberScores.slice(0, 5),
      };
    });

    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

function calculateSkillMatchScore(task: any, userSkills: any[]): number {
  if (!userSkills || userSkills.length === 0) return 0;

  const taskKeywords = extractTaskKeywords(task);
  if (taskKeywords.length === 0) return 50;

  let matchCount = 0;
  let totalProficiency = 0;

  userSkills.forEach(skill => {
    const skillName = skill.skill_name.toLowerCase();
    const hasMatch = taskKeywords.some(keyword => 
      skillName.includes(keyword) || keyword.includes(skillName)
    );
    
    if (hasMatch) {
      matchCount++;
      totalProficiency += skill.proficiency_level || 1;
    }
  });

  if (matchCount === 0) return 20;

  const matchRatio = matchCount / Math.max(taskKeywords.length, userSkills.length);
  const avgProficiency = totalProficiency / matchCount;
  
  return Math.min(100, matchRatio * 60 + avgProficiency * 8);
}

function extractTaskKeywords(task: any): string[] {
  const keywords: string[] = [];
  
  if (task.title) {
    keywords.push(...task.title.toLowerCase().split(/\s+/));
  }
  
  if (task.description) {
    keywords.push(...task.description.toLowerCase().split(/\s+/));
  }

  const skillKeywords = [
    'frontend', 'backend', 'fullstack', 'design', 'ui', 'ux',
    'api', 'database', 'testing', 'devops', 'mobile', 'web',
    'react', 'vue', 'angular', 'node', 'python', 'java',
    'javascript', 'typescript', 'css', 'html', 'sql', 'nosql'
  ];

  return keywords.filter(word => 
    word.length > 2 && skillKeywords.some(skill => word.includes(skill))
  );
}

function calculateWorkloadScore(userId: string): number {
  const userTasks = db.tasks.findByAssignee(userId);
  const activeTasks = userTasks.filter(t => 
    t.status === 'pending' || t.status === 'in_progress'
  );

  const taskCount = activeTasks.length;
  
  if (taskCount === 0) return 100;
  if (taskCount === 1) return 90;
  if (taskCount === 2) return 75;
  if (taskCount === 3) return 60;
  if (taskCount === 4) return 40;
  
  return Math.max(10, 40 - (taskCount - 4) * 10);
}

function calculatePerformanceScore(userId: string): number {
  const userTasks = db.tasks.findByAssignee(userId);
  
  if (userTasks.length === 0) return 70;

  const completedTasks = userTasks.filter(t => t.status === 'completed');
  
  if (completedTasks.length === 0) return 50;

  let onTimeCount = 0;
  completedTasks.forEach(task => {
    if (task.end_date && task.updated_at) {
      const endDate = new Date(task.end_date);
      const completedDate = new Date(task.updated_at);
      if (completedDate <= endDate) {
        onTimeCount++;
      }
    }
  });

  const onTimeRate = onTimeCount / completedTasks.length;
  
  return Math.round(onTimeRate * 100);
}

router.get('/workload-balance', (req: AuthRequest, res: Response) => {
  try {
    const { project_id } = req.query;

    if (!project_id) {
      return res.status(400).json({ success: false, message: '项目ID不能为空' });
    }

    const projectMembers = db.project_members.findByProject(project_id as string);
    
    if (projectMembers.length === 0) {
      return res.json({ success: true, data: { is_balanced: true, suggestions: [] } });
    }

    const workloadData = projectMembers.map(member => {
      const user = db.users.findById(member.user_id);
      const userTasks = db.tasks.findByAssignee(member.user_id).filter(
        t => t.project_id === project_id && t.status !== 'completed'
      );

      return {
        user_id: member.user_id,
        user_name: user?.name || 'Unknown',
        active_tasks: userTasks.length,
        task_ids: userTasks.map(t => t.id),
      };
    });

    const taskCounts = workloadData.map(w => w.active_tasks);
    const avgWorkload = taskCounts.reduce((a, b) => a + b, 0) / taskCounts.length;
    const maxWorkload = Math.max(...taskCounts);
    const minWorkload = Math.min(...taskCounts);

    const isBalanced = maxWorkload - minWorkload <= 2;

    const suggestions: any[] = [];

    if (!isBalanced) {
      const overloaded = workloadData.filter(w => w.active_tasks > avgWorkload + 1);
      const underloaded = workloadData.filter(w => w.active_tasks < avgWorkload);

      overloaded.forEach(overUser => {
        underloaded.forEach(underUser => {
          const tasksToTransfer = overUser.task_ids.slice(0, Math.ceil((overUser.active_tasks - avgWorkload) / 2));
          
          tasksToTransfer.forEach(taskId => {
            const task = db.tasks.findById(taskId);
            if (task) {
              suggestions.push({
                type: 'transfer',
                task_id: taskId,
                task_title: task.title,
                from_user_id: overUser.user_id,
                from_user_name: overUser.user_name,
                to_user_id: underUser.user_id,
                to_user_name: underUser.user_name,
                reason: `${overUser.user_name} 负载过高 (${overUser.active_tasks}个任务)，建议转移给 ${underUser.user_name} (${underUser.active_tasks}个任务)`,
              });
            }
          });
        });
      });
    }

    res.json({
      success: true,
      data: {
        is_balanced: isBalanced,
        average_workload: avgWorkload.toFixed(1),
        max_workload: maxWorkload,
        min_workload: minWorkload,
        workload_distribution: workloadData,
        suggestions: suggestions.slice(0, 10),
      },
    });
  } catch (error) {
    console.error('Get workload balance error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/skills', (req: AuthRequest, res: Response) => {
  try {
    const { user_id, skill_name, proficiency_level } = req.body;

    if (!user_id || !skill_name) {
      return res.status(400).json({ success: false, message: '用户ID和技能名称不能为空' });
    }

    const user = db.users.findById(user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const existingSkills = db.userSkills.findByUser(user_id);
    const existingSkill = existingSkills.find(
      s => s.skill_name.toLowerCase() === skill_name.toLowerCase()
    );

    if (existingSkill) {
      return res.status(400).json({ success: false, message: '该用户已拥有此技能' });
    }

    const id = uuidv4();
    const skill = db.userSkills.create({
      id,
      user_id,
      skill_name,
      proficiency_level: proficiency_level || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    res.status(201).json({ success: true, data: skill });
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/skills/:userId', (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = db.users.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const skills = db.userSkills.findByUser(userId);
    
    res.json({ success: true, data: skills });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/skills/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { skill_name, proficiency_level } = req.body;

    const skill = db.userSkills.findById(id);
    if (!skill) {
      return res.status(404).json({ success: false, message: '技能不存在' });
    }

    const updated = db.userSkills.update(id, {
      ...(skill_name && { skill_name }),
      ...(proficiency_level !== undefined && { proficiency_level }),
      updated_at: new Date().toISOString(),
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.delete('/skills/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const skill = db.userSkills.findById(id);
    if (!skill) {
      return res.status(404).json({ success: false, message: '技能不存在' });
    }

    db.userSkills.delete(id);
    res.json({ success: true, message: '技能已删除' });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
