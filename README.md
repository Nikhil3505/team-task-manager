# Team Task Manager

A complete full-stack web application for managing team tasks and projects with role-based access control.

## Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Sequelize
- **Authentication:** JWT + bcrypt
- **Validation:** express-validator

### Frontend
- **Framework:** React (Functional Components + Hooks)
- **Routing:** React Router
- **HTTP Client:** Axios
- **Styling:** CSS3 with Custom Properties

## Features

### 1. User Authentication
- Secure signup and login with JWT tokens
- Password hashing with bcrypt
- Protected routes with role-based access

### 2. Role-Based Access Control
- **Admin:** Can create projects, add/remove members, create tasks, assign tasks
- **Member:** Can view projects, view assigned tasks, update task status

### 3. Project Management
- Create projects (Admin only)
- Add/remove project members (Admin only)
- View all projects
- Project details with members and tasks

### 4. Task Management
- Create tasks with title, description, priority, and due date (Admin only)
- Assign tasks to project members
- Update task status (todo → in-progress → done)
- Filter tasks by project and status
- Overdue task detection

### 5. Dashboard
- Task statistics overview
- Total, completed, in-progress, and overdue tasks
- Recent tasks list
- Progress visualization
- Admin sees system-wide stats (total users, total projects)

### 6. Notification System
- Real-time notifications for task assignments
- Notifications when added to projects
- Task completion notifications
- Comment notifications
- Bell icon with unread count badge
- Mark as read / delete functionality

## Folder Structure

```
Team Task Manager/
├── backend/
│   ├── config/
│   │   └── database.js          # Sequelize configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── projectController.js   # Project management
│   │   └── taskController.js    # Task management
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   └── validation.js        # Input validation
│   ├── models/
│   │   ├── index.js             # Model exports
│   │   ├── User.js              # User model
│   │   ├── Project.js           # Project model
│   │   ├── Task.js              # Task model
│   │   └── ProjectMember.js     # Junction table model
│   ├── routes/
│   │   ├── authRoutes.js        # Auth endpoints
│   │   ├── projectRoutes.js     # Project endpoints
│   │   └── taskRoutes.js        # Task endpoints
│   ├── .env.example             # Environment variables template
│   ├── .sequelizerc            # Sequelize CLI config
│   ├── package.json            # Dependencies
│   └── server.js               # Express server entry
│
└── frontend/
    ├── public/
    └── src/
        ├── components/
        │   ├── Layout.js         # App layout with sidebar
        │   ├── Layout.css
        │   └── ProtectedRoute.js # Route guard
        ├── context/
        │   └── AuthContext.js   # Authentication state
        ├── pages/
        │   ├── Login.js         # Login page
        │   ├── Signup.js        # Signup page
        │   ├── Dashboard.js     # Dashboard page
        │   ├── Projects.js      # Projects list
        │   ├── ProjectDetail.js # Project details
        │   └── Tasks.js         # Tasks list
        ├── utils/
        │   └── api.js           # Axios configuration
        ├── App.js               # Main app component
        ├── App.css              # Global styles
        └── index.js             # React entry
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Step 1: Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE team_task_manager;
```

2. Create a user (optional, can use default postgres user):
```sql
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE team_task_manager TO your_username;
```

### Step 2: Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Edit `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=team_task_manager
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

5. Start the server:
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The backend will run on `http://localhost:5000`

### Step 3: Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## 🚀 Deployment (Railway)

### Prerequisites
- [Railway](https://railway.app/) account
- GitHub repository with your code

### Step 1: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### Step 2: Add PostgreSQL Database

1. In your Railway project, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically create the database and provide connection details

### Step 3: Configure Environment Variables

In your Railway project settings, add these environment variables:

```env
NODE_ENV=production
PORT=5000
DB_HOST=${{Postgres.HOSTNAME}}
DB_PORT=${{Postgres.PORT}}
DB_NAME=${{Postgres.DATABASE}}
DB_USER=${{Postgres.USERNAME}}
DB_PASSWORD=${{Postgres.PASSWORD}}
JWT_SECRET=your_super_secret_key_here_change_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret_key_here_change_in_production
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend-url.railway.app
```

### Step 4: Deploy Backend

The `railway.json` file is already configured. Railway will automatically:
1. Install dependencies
2. Start the backend server
3. Run health checks

### Step 5: Deploy Frontend (Optional - for separate frontend hosting)

If you want to deploy frontend separately:

1. Create a new Railway project for frontend
2. Set build command: `npm run build`
3. Set start command: `npx serve -s build -l 3000`
4. Add environment variable: `REACT_APP_API_URL=https://your-backend-url.railway.app/api`

### Step 6: Database Migrations

After first deployment, run migrations in Railway:

1. Go to your backend service in Railway
2. Click "Logs" → "New Command"
3. Run: `cd backend && npx sequelize-cli db:migrate`

Or use the deployed API health check endpoint to verify:
`GET https://your-app.railway.app/api/health`

## 🌐 Live Demo

**Live URL:** https://your-app.railway.app (Replace with your actual Railway URL)

**GitHub Repo:** https://github.com/yourusername/team-task-manager

## Demo Credentials

Use these credentials to test the application:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | password123 |
| Member | member@test.com | password123 |

### Default Demo Accounts

After starting the app, you can create accounts or use these for testing:

1. Create an Admin account by signing up with `role: admin`
2. Create Member accounts by signing up with `role: member`

## API Documentation

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/auth/users` | Get all users (Admin only) | Yes |

**Signup Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@test.com",
  "password": "password123",
  "role": "admin"  // or "member"
}
```

### Projects

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/projects` | Get all user's projects | Yes | Any |
| POST | `/api/projects` | Create project | Yes | Admin |
| GET | `/api/projects/:id` | Get project details | Yes | Member |
| PUT | `/api/projects/:id` | Update project | Yes | Creator/Admin |
| DELETE | `/api/projects/:id` | Delete project | Yes | Admin |
| POST | `/api/projects/:id/members` | Add member | Yes | Admin |
| DELETE | `/api/projects/:id/members/:userId` | Remove member | Yes | Admin |

**Create Project Request Body:**
```json
{
  "name": "Project Name",
  "description": "Project description"
}
```

### Tasks

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/tasks` | Get tasks (filtered) | Yes | Any |
| POST | `/api/tasks` | Create task | Yes | Admin |
| GET | `/api/tasks/:id` | Get task details | Yes | Member |
| PUT | `/api/tasks/:id` | Update task | Yes | Any |
| DELETE | `/api/tasks/:id` | Delete task | Yes | Creator/Admin |
| GET | `/api/tasks/dashboard/stats` | Get dashboard stats | Yes | Any |

**Create Task Request Body:**
```json
{
  "title": "Task title",
  "description": "Task description",
  "priority": "high",      // "low" | "medium" | "high"
  "status": "todo",        // "todo" | "in-progress" | "done"
  "dueDate": "2024-12-31",
  "projectId": 1,
  "assignedTo": 2          // user ID (optional)
}
```

**Query Parameters for GET /api/tasks:**
- `projectId` - Filter by project
- `status` - Filter by status

## Database Schema

### Users
- id (PK)
- name
- email (unique)
- password (hashed)
- role (admin/member)
- created_at
- updated_at

### Projects
- id (PK)
- name
- description
- status (active/completed/archived)
- created_by (FK → Users)
- created_at
- updated_at

### Tasks
- id (PK)
- title
- description
- status (todo/in-progress/done)
- priority (low/medium/high)
- due_date
- project_id (FK → Projects)
- assigned_to (FK → Users, nullable)
- created_by (FK → Users)
- created_at
- updated_at

### ProjectMembers (Junction Table)
- id (PK)
- project_id (FK → Projects)
- user_id (FK → Users)
- role (admin/member)
- created_at
- updated_at

### Notifications
- id (PK)
- user_id (FK → Users) - recipient
- type (task_assigned, task_updated, project_invite, member_added, task_completed, comment_added)
- title
- message
- is_read (boolean)
- related_id (optional - linked task/project ID)
- related_type (optional - 'task' or 'project')
- created_by (FK → Users) - actor who triggered notification
- created_at
- updated_at

## Available Scripts

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Environment Variables

Create `.env` file in `/backend` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=team_task_manager
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_key_here_min_32_chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Note:** For production, use strong, unique secrets for JWT.

## License

MIT License
