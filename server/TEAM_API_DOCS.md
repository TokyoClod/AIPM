# Team Collaboration API Documentation

## Overview
Team collaboration backend API for AIPM project management system.

## Base URL
```
http://localhost:3001/api/team
```

## Authentication
All endpoints require JWT authentication via Bearer token in the Authorization header.

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. GET /api/team/status
Get team member status list with workload information.

**Query Parameters:**
- `project_id` (optional): Filter by project ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "user": {
        "id": "string",
        "name": "string",
        "email": "string",
        "avatar": "string | null",
        "role": "admin | manager | leader | member"
      },
      "taskCount": 5,
      "completedTaskCount": 3,
      "workloadPercentage": 50,
      "loadLevel": "low | normal | high | overloaded",
      "isOnline": true,
      "lastActivity": "2026-03-10T12:00:00Z",
      "warningStatus": false
    }
  ]
}
```

### 2. GET /api/team/:userId/workload
Get detailed workload information for a specific team member.

**Query Parameters:**
- `project_id` (optional): Filter by project ID

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "name": "string",
      "email": "string",
      "avatar": "string | null",
      "role": "string"
    },
    "summary": {
      "totalTasks": 10,
      "activeTasks": 5,
      "completedTasks": 3,
      "pausedTasks": 2,
      "highPriorityTasks": 2,
      "overdueTasks": 1,
      "workloadPercentage": 50,
      "loadLevel": "normal",
      "warningStatus": false
    },
    "tasks": {
      "active": [...],
      "completed": [...]
    }
  }
}
```

### 3. GET /api/team/workload-summary
Get team workload summary and statistics.

**Query Parameters:**
- `project_id` (optional): Filter by project ID

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMembers": 5,
    "onlineMembers": 3,
    "totalActiveTasks": 25,
    "totalCompletedTasks": 15,
    "averageWorkload": 45,
    "loadDistribution": {
      "low": 2,
      "normal": 2,
      "high": 1,
      "overloaded": 0
    },
    "members": [...]
  }
}
```

### 4. POST /api/team/messages
Send a team message.

**Request Body:**
```json
{
  "project_id": "string (optional)",
  "content": "string (required)",
  "message_type": "general | announcement | alert (optional, default: general)",
  "recipients": ["user_id1", "user_id2"] (optional)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "project_id": "string | null",
    "sender_id": "string",
    "content": "string",
    "message_type": "string",
    "recipients": [],
    "created_at": "2026-03-10T12:00:00Z",
    "sender_name": "string",
    "sender_email": "string"
  }
}
```

### 5. GET /api/team/messages
Get team messages list with pagination.

**Query Parameters:**
- `project_id` (optional): Filter by project ID
- `limit` (optional): Number of messages to return (default: 50)
- `offset` (optional): Number of messages to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "project_id": "string | null",
      "sender_id": "string",
      "content": "string",
      "message_type": "string",
      "recipients": [],
      "created_at": "2026-03-10T12:00:00Z",
      "sender_name": "string",
      "sender_email": "string",
      "sender_avatar": "string | null"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

## Load Level Calculation

Workload percentage is calculated based on active task count:
- **Low**: 0-40% (0-4 active tasks)
- **Normal**: 40-70% (4-7 active tasks)
- **High**: 70-80% (7-8 active tasks)
- **Overloaded**: >80% (9+ active tasks)

Maximum task capacity is set to 10 tasks (100% workload).

## Online Status

A user is considered online if their last activity was within the last hour.

## Warning Status

Warning status is triggered when workload percentage exceeds 80%.

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Files Created

1. **Route File**: `/Users/abner/Documents/trae_projects/AIPM/server/src/routes/team.ts`
   - Implements all 5 API endpoints
   - Includes authentication middleware
   - Error handling for all scenarios

2. **Database Updates**: `/Users/abner/Documents/trae_projects/AIPM/server/src/models/database.ts`
   - Added `team_messages` table to DataStore
   - Implemented `teamMessages` CRUD operations

3. **Server Configuration**: `/Users/abner/Documents/trae_projects/AIPM/server/src/index.ts`
   - Registered team routes at `/api/team`

## Testing

Integration test file created at:
`/Users/abner/Documents/trae_projects/AIPM/server/tests/integration/team.test.ts`

## Usage Example

```bash
# Get team status
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/team/status

# Get user workload
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/team/user-id/workload

# Send a message
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello team!"}' \
  http://localhost:3001/api/team/messages
```
