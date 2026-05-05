import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [tasksByStatus, setTasksByStatus] = useState([]);
  const [tasksByPriority, setTasksByPriority] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const statsResponse = await api.get('/tasks/dashboard/stats');
      const data = statsResponse.data.data;
      setStats(data.stats);
      setTasksByStatus(data.tasksByStatus || []);
      setTasksByPriority(data.tasksByPriority || []);
      setRecentTasks(data.recentTasks || []);
      
      setError('');
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done': return '✅';
      case 'in-progress': return '🔄';
      default: return '📋';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      default: return '🟢';
    }
  };

  // Chart colors
  const statusColors = {
    'todo': '#6c757d',
    'in-progress': '#0d6efd',
    'done': '#198754'
  };

  const priorityColors = {
    'low': '#198754',
    'medium': '#fd7e14',
    'high': '#dc3545'
  };

  // Format chart data
  const chartDataByStatus = tasksByStatus.map(item => ({
    name: item.status === 'in-progress' ? 'In Progress' : item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: parseInt(item.count),
    status: item.status
  }));

  const chartDataByPriority = tasksByPriority.map(item => ({
    name: item.priority.charAt(0).toUpperCase() + item.priority.slice(1),
    value: parseInt(item.count),
    priority: item.priority
  }));

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="subtitle">Overview of your tasks and progress</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">📊</div>
          <div className="stat-content">
            <span className="stat-value">{stats?.total || 0}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completed">✅</div>
          <div className="stat-content">
            <span className="stat-value">{stats?.completed || 0}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon progress">🔄</div>
          <div className="stat-content">
            <span className="stat-value">{stats?.inProgress || 0}</span>
            <span className="stat-label">In Progress</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon todo">📋</div>
          <div className="stat-content">
            <span className="stat-value">{stats?.todo || 0}</span>
            <span className="stat-label">To Do</span>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon overdue">⚠️</div>
          <div className="stat-content">
            <span className="stat-value">{stats?.overdue || 0}</span>
            <span className="stat-label">Overdue</span>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon priority">🔴</div>
          <div className="stat-content">
            <span className="stat-value">{stats?.highPriority || 0}</span>
            <span className="stat-label">High Priority</span>
          </div>
        </div>

        {isAdmin() && stats?.totalProjects !== null && (
          <div className="stat-card info">
            <div className="stat-icon projects">📁</div>
            <div className="stat-content">
              <span className="stat-value">{stats?.totalProjects || 0}</span>
              <span className="stat-label">Total Projects</span>
            </div>
          </div>
        )}

        {isAdmin() && stats?.totalUsers !== null && (
          <div className="stat-card secondary">
            <div className="stat-icon users">👥</div>
            <div className="stat-content">
              <span className="stat-value">{stats?.totalUsers || 0}</span>
              <span className="stat-label">Total Users</span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Overview */}
      {stats && stats.total > 0 && (
        <div className="card progress-overview">
          <h3>Task Completion Progress</h3>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${(stats.completed / stats.total) * 100}%` 
              }}
            >
              {Math.round((stats.completed / stats.total) * 100)}%
            </div>
          </div>
          <p className="progress-text">
            {stats.completed} of {stats.total} tasks completed
          </p>
        </div>
      )}

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Tasks by Status - Pie Chart */}
        <div className="card">
          <h3>Tasks by Status</h3>
          {chartDataByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartDataByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartDataByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.status]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <p>No data available</p>
            </div>
          )}
        </div>

        {/* Tasks by Priority - Bar Chart */}
        <div className="card">
          <h3>Tasks by Priority</h3>
          {chartDataByPriority.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartDataByPriority}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {chartDataByPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={priorityColors[entry.priority]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <p>No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card recent-tasks">
        <h3>Recent Tasks</h3>
        {recentTasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks yet. Start by creating a project!</p>
          </div>
        ) : (
          <div className="task-list">
            {recentTasks.map((task) => (
              <div key={task.id} className="task-item">
                <div className="task-status">
                  {getStatusIcon(task.status)}
                </div>
                <div className="task-info">
                  <span className="task-title">{task.title}</span>
                  <span className="task-project">{task.project?.name}</span>
                </div>
                <div className="task-meta">
                  <span className="task-priority">
                    {getPriorityIcon(task.priority)}
                  </span>
                  <span className={`badge badge-${task.status}`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
