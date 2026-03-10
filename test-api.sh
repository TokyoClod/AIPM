#!/bin/bash

BASE_URL="http://localhost:3001/api"
FRONTEND_URL="http://localhost:5173/api"

echo "========================================="
echo "   AIPM 全功能测试脚本"
echo "========================================="

echo ""
echo ">>> 1. 测试用户注册..."
REGISTER_RESP=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@test.com","password":"123456","name":"Test User"}')
echo "注册响应: $REGISTER_RESP"

echo ""
echo ">>> 2. 测试用户登录..."
LOGIN_RESP=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@test.com","password":"123456"}')
echo "登录响应: $LOGIN_RESP"

TOKEN=$(echo $LOGIN_RESP | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "提取Token: ${TOKEN:0:50}..."

if [ -z "$TOKEN" ]; then
  echo "使用管理员账号..."
  LOGIN_RESP=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@test.com","password":"123456"}')
  TOKEN=$(echo $LOGIN_RESP | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

echo ""
echo ">>> 3. 测试获取当前用户信息..."
ME_RESP=$(curl -s "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")
echo "用户信息: $ME_RESP"

echo ""
echo ">>> 4. 测试获取用户列表..."
USERS_RESP=$(curl -s "$BASE_URL/auth/users" \
  -H "Authorization: Bearer $TOKEN")
echo "用户列表: $USERS_RESP"

echo ""
echo ">>> 5. 测试创建项目..."
PROJECT_RESP=$(curl -s -X POST "$BASE_URL/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"测试项目-功能测试","description":"完整功能测试项目","start_date":"2026-03-01","end_date":"2026-12-31"}')
echo "创建项目响应: $PROJECT_RESP"

PROJECT_ID=$(echo $PROJECT_RESP | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "项目ID: $PROJECT_ID"

echo ""
echo ">>> 6. 测试获取项目列表..."
PROJECTS_RESP=$(curl -s "$BASE_URL/projects" \
  -H "Authorization: Bearer $TOKEN")
echo "项目列表: $PROJECTS_RESP"

if [ -n "$PROJECT_ID" ]; then
  echo ""
  echo ">>> 7. 测试获取项目详情..."
  PROJECT_DETAIL=$(curl -s "$BASE_URL/projects/$PROJECT_ID" \
    -H "Authorization: Bearer $TOKEN")
  echo "项目详情: $PROJECT_DETAIL"

  echo ""
  echo ">>> 8. 测试更新项目..."
  UPDATE_RESP=$(curl -s -X PUT "$BASE_URL/projects/$PROJECT_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"测试项目-已更新","description":"更新描述","status":"active"}')
  echo "更新项目响应: $UPDATE_RESP"

  echo ""
  echo ">>> 9. 测试创建任务..."
  TASK_RESP=$(curl -s -X POST "$BASE_URL/tasks" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"project_id\":\"$PROJECT_ID\",\"title\":\"测试任务1\",\"description\":\"测试任务描述\",\"status\":\"pending\",\"priority\":\"high\"}")
  echo "创建任务响应: $TASK_RESP"

  TASK_ID=$(echo $TASK_RESP | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  echo "任务ID: $TASK_ID"

  if [ -n "$TASK_ID" ]; then
    echo ""
    echo ">>> 10. 测试获取任务列表..."
    TASKS_RESP=$(curl -s "$BASE_URL/tasks?project_id=$PROJECT_ID" \
      -H "Authorization: Bearer $TOKEN")
    echo "任务列表: $TASKS_RESP"

    echo ""
    echo ">>> 11. 测试更新任务..."
    UPDATE_TASK=$(curl -s -X PUT "$BASE_URL/tasks/$TASK_ID" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"status":"in_progress","progress":50}')
    echo "更新任务响应: $UPDATE_TASK"

    echo ""
    echo ">>> 12. 测试创建子任务..."
    SUBTASK_RESP=$(curl -s -X POST "$BASE_URL/tasks" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{\"project_id\":\"$PROJECT_ID\",\"parent_id\":\"$TASK_ID\",\"title\":\"子任务1\",\"description\":\"子任务描述\",\"status\":\"pending\",\"priority\":\"medium\"}")
    echo "创建子任务响应: $SUBTASK_RESP"

    echo ""
    echo ">>> 13. 测试更新任务进度..."
    PROGRESS_RESP=$(curl -s -X PUT "$BASE_URL/tasks/$TASK_ID/progress" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"progress":100,"status":"completed"}')
    echo "更新进度响应: $PROGRESS_RESP"

    echo ""
    echo ">>> 14. 测试删除任务..."
    DELETE_TASK=$(curl -s -X DELETE "$BASE_URL/tasks/$TASK_ID" \
      -H "Authorization: Bearer $TOKEN")
    echo "删除任务响应: $DELETE_TASK"
  fi

  echo ""
  echo ">>> 15. 测试创建风险..."
  RISK_RESP=$(curl -s -X POST "$BASE_URL/risks" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"project_id\":\"$PROJECT_ID\",\"description\":\"测试风险\",\"level\":\"high\",\"type\":\"technical\"}")
  echo "创建风险响应: $RISK_RESP"

  RISK_ID=$(echo $RISK_RESP | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  echo "风险ID: $RISK_ID"

  if [ -n "$RISK_ID" ]; then
    echo ""
    echo ">>> 16. 测试更新风险..."
    UPDATE_RISK=$(curl -s -X PUT "$BASE_URL/risks/$RISK_ID" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"status":"mitigating","mitigation":"已实施缓解措施"}')
    echo "更新风险响应: $UPDATE_RISK"

    echo ""
    echo ">>> 17. 测试获取风险列表..."
    RISKS_RESP=$(curl -s "$BASE_URL/risks?project_id=$PROJECT_ID" \
      -H "Authorization: Bearer $TOKEN")
    echo "风险列表: $RISKS_RESP"

    echo ""
    echo ">>> 18. 测试删除风险..."
    DELETE_RISK=$(curl -s -X DELETE "$BASE_URL/risks/$RISK_ID" \
      -H "Authorization: Bearer $TOKEN")
    echo "删除风险响应: $DELETE_RISK"
  fi

  echo ""
  echo ">>> 19. 测试项目仪表盘..."
  DASHBOARD_RESP=$(curl -s "$BASE_URL/projects/$PROJECT_ID/dashboard" \
    -H "Authorization: Bearer $TOKEN")
  echo "项目仪表盘: $DASHBOARD_RESP"
fi

echo ""
echo ">>> 20. 测试全局仪表盘..."
GLOBAL_DASH=$(curl -s "$BASE_URL/reports/dashboard" \
  -H "Authorization: Bearer $TOKEN")
echo "全局仪表盘: $GLOBAL_DASH"

echo ""
echo ">>> 21. 测试风险分析..."
RISK_ANALYTICS=$(curl -s "$BASE_URL/reports/analytics/risks" \
  -H "Authorization: Bearer $TOKEN")
echo "风险分析: $RISK_ANALYTICS"

echo ""
echo ">>> 22. 测试获取通知..."
NOTIFICATIONS_RESP=$(curl -s "$BASE_URL/notifications" \
  -H "Authorization: Bearer $TOKEN")
echo "通知列表: $NOTIFICATIONS_RESP"

echo ""
echo ">>> 23. 测试通知未读数量..."
UNREAD_COUNT=$(curl -s "$BASE_URL/notifications/unread-count" \
  -H "Authorization: Bearer $TOKEN")
echo "未读数量: $UNREAD_COUNT"

if [ -n "$PROJECT_ID" ]; then
  echo ""
  echo ">>> 24. 测试删除项目..."
  DELETE_PROJECT=$(curl -s -X DELETE "$BASE_URL/projects/$PROJECT_ID" \
    -H "Authorization: Bearer $TOKEN")
  echo "删除项目响应: $DELETE_PROJECT"
fi

echo ""
echo "========================================="
echo "   测试完成!"
echo "========================================="
