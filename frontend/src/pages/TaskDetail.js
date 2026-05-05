import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './TaskDetail.css';

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/tasks/${taskId}`);
        setTask(response.data.data.task);
        setError('');
      } catch (err) {
        setError('Failed to load task');
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [taskId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const response = await api.post(`/tasks/${taskId}/comments`, { body: newComment });
      setTask({
        ...task,
        comments: [...task.comments, response.data.data.comment]
      });
      setNewComment('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/tasks/${taskId}/comments/${commentId}`);
      setTask({
        ...task,
        comments: task.comments.filter(c => c.id !== commentId)
      });
    } catch (err) {
      setError('Failed to delete comment');
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTask();
    } catch (err) {
      setError('Failed to update status');
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

  if (loading) {
    return <div className="loading">Loading task...</div>;
  }

  if (!task) {
    return (
      <div className="card empty-state">
        <h3>Task not found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/tasks')}>
          Back to Tasks
        </button>
      </div>
    );
  }

  return (
    <div className="task-detail">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="task-detail-header">
        <div className="task-header-content">
          <h1>{task.title}</h1>
          <div className="task-badges">
            <span className={`badge ${getPriorityBadge(task.priority)}`}>
              {task.priority}
            </span>
            <span className={`badge ${getStatusBadge(task.status)}`}>
              {task.status}
            </span>
          </div>
        </div>
        <div className="task-actions">
          <select 
            value={task.status} 
            onChange={(e) => handleStatusUpdate(e.target.value)}
            className="select"
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      <div className="task-detail-grid">
        <div className="task-main">
          <div className="card">
            <h3>Description</h3>
            <p>{task.description || 'No description'}</p>
          </div>

          <div className="card comments-section">
            <h3>Comments ({task.comments?.length || 0})</h3>
            
            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows="3"
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting || !newComment.trim()}
              >
                {submitting ? 'Adding...' : 'Add Comment'}
              </button>
            </form>

            <div className="comments-list">
              {task.comments?.length === 0 ? (
                <div className="empty-state">
                  <p>No comments yet</p>
                </div>
              ) : (
                task.comments.map((comment) => (
                  <div key={comment.id} className="comment">
                    <div className="comment-header">
                      <span className="comment-author">{comment.author.name}</span>
                      <span className="comment-date">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                      {comment.authorId === localStorage.getItem('userId') && (
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="comment-body">{comment.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="task-sidebar">
          <div className="card">
            <h3>Details</h3>
            <div className="detail-row">
              <span className="detail-label">Project:</span>
              <span className="detail-value">{task.project?.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Assignee:</span>
              <span className="detail-value">
                {task.assignee ? task.assignee.name : 'Unassigned'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Created by:</span>
              <span className="detail-value">{task.creator?.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Due date:</span>
              <span className="detail-value">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Created:</span>
              <span className="detail-value">
                {new Date(task.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
