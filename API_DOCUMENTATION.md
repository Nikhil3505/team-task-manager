# Team Task Manager API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST /auth/signup
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "member"
}
```

**Validation:**
- `name`: Required, 2-100 characters
- `email`: Required, valid email format, unique
- `password`: Required, minimum 6 characters
- `role`: Optional, must be "admin" or "member" (defaults to "member")

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "member"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### POST /auth/login
Login existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "member"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### GET /auth/me
Get current authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "member",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### GET /auth/users
Get all users (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "Admin User",
        "email": "admin@test.com",
        "role": "admin"
      },
      {
        "id": 2,
        "name": "Member User",
        "email": "member@test.com",
        "role": "member"
      }
    ]
  }
}
```

---

## Project Endpoints

### GET /projects
Get all projects for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": 1,
        "name": "Website Redesign",
        "description": "Redesign company website",
        "status": "active",
        "createdBy": 1,
        "creator": {
          "id": 1,
          "name": "Admin User",
          "email": "admin@test.com"
        },
        "members": [
          {
            "id": 1,
            "name": "Admin User",
            "email": "admin@test.com"
          },
          {
            "id": 2,
            "name": "Member User",
            "email": "member@test.com"
          }
        ],
        "tasks": []
      }
    ]
  }
}
```

---

### POST /projects
Create a new project (Admin only).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description here"
}
```

**Validation:**
- `name`: Required, 2-200 characters
- `description`: Optional

**Response:**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "project": {
      "id": 2,
      "name": "New Project",
      "description": "Project description here",
      "status": "active",
      "createdBy": 1,
      "creator": { ... },
      "members": [ ... ]
    }
  }
}
```

---

### GET /projects/:projectId
Get project details.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": 1,
      "name": "Website Redesign",
      "description": "Redesign company website",
      "status": "active",
      "createdBy": 1,
      "creator": { ... },
      "members": [ ... ],
      "tasks": [
        {
          "id": 1,
          "title": "Create mockups",
          "status": "in-progress",
          "priority": "high",
          "assignee": { ... }
        }
      ]
    }
  }
}
```

---

### PUT /projects/:projectId
Update project details.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "status": "completed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "project": { ... }
  }
}
```

---

### DELETE /projects/:projectId
Delete a project (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

### POST /projects/:projectId/members
Add a member to project (Admin only).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Member added to project successfully"
}
```

---

### DELETE /projects/:projectId/members/:userId
Remove a member from project (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Member removed from project successfully"
}
```

---

## Task Endpoints

### GET /tasks/dashboard/stats
Get dashboard statistics for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 10,
      "completed": 4,
      "inProgress": 3,
      "todo": 3,
      "overdue": 1,
      "highPriority": 2
    }
  }
}
```

---

### GET /tasks
Get all tasks for the authenticated user with optional filters.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `projectId` - Filter by project ID
- `status` - Filter by status (todo, in-progress, done)

**Example:**
```
GET /api/tasks?projectId=1&status=in-progress
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": 1,
        "title": "Create mockups",
        "description": "Design initial mockups",
        "status": "in-progress",
        "priority": "high",
        "dueDate": "2024-12-31T00:00:00.000Z",
        "projectId": 1,
        "project": {
          "id": 1,
          "name": "Website Redesign"
        },
        "assignedTo": 2,
        "assignee": {
          "id": 2,
          "name": "Member User",
          "email": "member@test.com"
        },
        "createdBy": 1,
        "creator": { ... },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

### POST /tasks
Create a new task (Admin only).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "priority": "medium",
  "status": "todo",
  "dueDate": "2024-12-31",
  "projectId": 1,
  "assignedTo": 2
}
```

**Validation:**
- `title`: Required, 2-200 characters
- `description`: Optional
- `priority`: Optional, must be "low", "medium", or "high" (default: "medium")
- `status`: Optional, must be "todo", "in-progress", or "done" (default: "todo")
- `dueDate`: Optional, must be valid ISO date
- `projectId`: Required, must be valid project ID
- `assignedTo`: Optional, must be valid user ID

**Response:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "task": { ... }
  }
}
```

---

### GET /tasks/:taskId
Get task details.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": 1,
      "title": "Task title",
      "description": "Task description",
      "status": "in-progress",
      "priority": "high",
      "dueDate": "2024-12-31T00:00:00.000Z",
      "project": { ... },
      "assignee": { ... },
      "creator": { ... }
    }
  }
}
```

---

### PUT /tasks/:taskId
Update task details or status.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "done",
  "priority": "low",
  "dueDate": "2024-12-25",
  "assignedTo": 3
}
```

**Permissions:**
- **Admin/Creator:** Can update all fields
- **Assignee:** Can only update status field

**Response:**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "task": { ... }
  }
}
```

---

### DELETE /tasks/:taskId
Delete a task.

**Headers:**
```
Authorization: Bearer <token>
```

**Permissions:**
- Only task creator or admin can delete

**Response:**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

## Error Responses

### 400 - Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email address"
    }
  ]
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 403 - Forbidden
```json
{
  "success": false,
  "message": "Access denied. Admin role required."
}
```

### 404 - Not Found
```json
{
  "success": false,
  "message": "Project not found"
}
```

### 409 - Conflict
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

### 500 - Internal Server Error
```json
{
  "success": false,
  "message": "Error creating user",
  "error": "Detailed error message"
}
```

---

## Status Codes Reference

### Task Status
- `todo` - Task is pending
- `in-progress` - Task is being worked on
- `done` - Task is completed

### Task Priority
- `low` - Low priority
- `medium` - Medium priority
- `high` - High priority

### Project Status
- `active` - Project is active
- `completed` - Project is completed
- `archived` - Project is archived

### User Roles
- `admin` - Full access to all features
- `member` - Limited access (can view projects, update assigned tasks)
