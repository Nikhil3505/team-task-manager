import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import './Tasks.css';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    projectId: '',
    status: ''
  });

  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.data.projects);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.projectId) queryParams.append('projectId', filters.projectId);
      if (filters.status) queryParams.append('status', filters.status);
      
      const response = await api.get(`/tasks?${queryParams}`);
      setTasks(response.data.data.tasks);
      setError('');
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.projectId, filters.status]);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [fetchTasks, fetchProjects]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const applyFilters = () => {
    fetchTasks();
  };

  const clearFilters = () => {
    setFilters({ projectId: '', status: '' });
    setTimeout(fetchTasks, 0);
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      setError('Failed to update task status');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'todo': 'badge-todo',
      'in-progress': 'badge-in-progress',
      'done': 'badge-done'
    };
    return statusMap[status] || 'badge-secondary';
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      'low': 'badge-low',
      'medium': 'badge-medium',
      'high': 'badge-high'
    };
    return priorityMap[priority] || 'badge-secondary';
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'done') return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  return (
    <div className="tasks">
      <div className="page-header">
        <h1>Tasks</h1>
        <p className="subtitle">View and manage all your tasks</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filters */}
      <div className="card filters-card">
        <div className="filters">
          <div className="filter-group">
            <label>Project</label>
            <select
              name="projectId"
              value={filters.projectId}
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">All Status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          
          <div className="filter-actions">
            <button className="btn btn-primary" onClick={applyFilters}>
              Apply Filters
            </button>
            <button className="btn btn-outline" onClick={clearFilters}>
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      {tasks.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No Tasks Found</h3>
          <p>Try adjusting your filters or create a new task from a project.</p>
        </div>
      ) : (
        <div className="card tasks-table-card">
          <div className="tasks-table-container">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <div className="task-title-cell">
                        <span className="task-title">{task.title}</span>
                        {task.description && (
                          <span className="task-desc-preview">
                            {task.description.substring(0, 50)}...
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{task.project?.name}</td>
                    <td>
                      <span className={`badge ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td>
                      {task.assignee ? task.assignee.name : (
                        <span className="unassigned">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <span className={isOverdue(task.dueDate, task.status) ? 'overdue-text' : ''}>
                        {task.dueDate 
                          ? new Date(task.dueDate).toLocaleDateString() 
                          : '-'
                        }
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {task.status !== 'todo' && (
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => handleUpdateStatus(task.id, 'todo')}
                          >
                            Todo
                          </button>
                        )}
                        {task.status !== 'in-progress' && (
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => handleUpdateStatus(task.id, 'in-progress')}
                          >
                            Progress
                          </button>
                        )}
                        {task.status !== 'done' && (
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={() => handleUpdateStatus(task.id, 'done')}
                          >
                            Done
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
