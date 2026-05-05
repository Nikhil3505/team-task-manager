import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  
  const [project, setProject] = useState(null);
  
  // Check if current user is admin of this specific project
  const isProjectAdmin = useCallback(() => {
    if (isAdmin()) return true; // Global admin
    if (!project || !user) return false;
    const membership = project.members?.find(m => m.id === user.id);
    return membership?.role === 'admin';
  }, [isAdmin, user, project]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');
  
  // Task Modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignedTo: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Member Modal
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Edit Project Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProject, setEditProject] = useState({ name: '', description: '', status: 'active' });
  const [updating, setUpdating] = useState(false);

  // Delete Confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchProjectDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data.data.project);
      setError('');
    } catch (err) {
      setError('Failed to load project details');
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const handleUserSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await api.get(`/auth/users/search?q=${encodeURIComponent(query)}&projectId=${projectId}`);
      setSearchResults(response.data.data.users);
    } catch (err) {
      console.error('Error searching users:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId, fetchProjectDetails]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      
      // Convert empty string to null for assignedTo
      const taskData = {
        ...newTask,
        projectId: parseInt(projectId),
        assignedTo: newTask.assignedTo ? parseInt(newTask.assignedTo) : null
      };
      
      await api.post('/tasks', taskData);
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', priority: 'medium', dueDate: '', assignedTo: '' });
      fetchProjectDetails();
    } catch (err) {
      console.error('Create task error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }

    try {
      setAddingMember(true);
      setError('');
      // Find selected user email from search results
      const selectedUser = searchResults.find(u => u.id.toString() === selectedUserId);
      await api.post(`/projects/${projectId}/members`, {
        email: selectedUser.email,
        role: 'member'
      });
      setShowMemberModal(false);
      setSelectedUserId('');
      setSearchQuery('');
      setSearchResults([]);
      fetchProjectDetails();
    } catch (err) {
      console.error('Add member error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      fetchProjectDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!editProject.name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setUpdating(true);
      setError('');
      await api.put(`/projects/${projectId}`, editProject);
      setShowEditModal(false);
      fetchProjectDetails();
    } catch (err) {
      console.error('Update project error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update project');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (deleteConfirmText !== project.name) {
      setError('Project name does not match');
      return;
    }

    try {
      setDeleting(true);
      setError('');
      await api.delete(`/projects/${projectId}`);
      navigate('/projects');
    } catch (err) {
      console.error('Delete project error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete project');
      setDeleting(false);
    }
  };

  const openEditModal = () => {
    setEditProject({
      name: project.name,
      description: project.description || '',
      status: project.status || 'active'
    });
    setError('');
    setShowEditModal(true);
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a column or same column
    if (!destination || source.droppableId === destination.droppableId) {
      return;
    }

    const taskId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    // Optimistic update
    const updatedTasks = project.tasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    );
    setProject({ ...project, tasks: updatedTasks });

    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchProjectDetails();
    } catch (err) {
      // Revert on error
      setError('Failed to update task status');
      fetchProjectDetails();
    }
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
    return <div className="loading">Loading project details...</div>;
  }

  if (!project) {
    return (
      <div className="card empty-state">
        <h3>Project not found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/projects')}>
          Back to Projects
        </button>
      </div>
    );
  }

  // Group tasks by status for Kanban
  const tasksByStatus = {
    todo: project.tasks?.filter(t => t.status === 'todo') || [],
    'in-progress': project.tasks?.filter(t => t.status === 'in-progress') || [],
    done: project.tasks?.filter(t => t.status === 'done') || []
  };

  const columnColors = {
    'todo': '#6c757d',
    'in-progress': '#0d6efd',
    'done': '#198754'
  };

  return (
    <div className="project-detail">
      <button className="back-btn" onClick={() => navigate('/projects')}>
        ← Back to Projects
      </button>

      <div className="project-header-detail">
        <div>
          <h1>{project.name}</h1>
          <p className="project-description">{project.description || 'No description'}</p>
        </div>
        {isProjectAdmin() && (
          <div className="project-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setError('');
                setShowMemberModal(true);
              }}
            >
              + Add Member
            </button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks ({project.tasks?.length || 0})
        </button>
        <button 
          className={`tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Members ({project.members?.length || 0})
        </button>
        {isProjectAdmin() && (
          <button 
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        )}
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="tasks-section">
          {isProjectAdmin() && (
            <div className="section-header">
              <button 
                className="btn btn-primary"
                onClick={async () => {
                  setError('');
                  // Refresh project data to ensure members are loaded
                  await fetchProjectDetails();
                  // Set default assignee to first member if available
                  const defaultAssignee = project.members?.[0]?.id || '';
                  setNewTask({ 
                    title: '', 
                    description: '', 
                    priority: 'medium', 
                    dueDate: '', 
                    assignedTo: defaultAssignee 
                  });
                  setShowTaskModal(true);
                }}
              >
                + Add Task
              </button>
            </div>
          )}

          {project.tasks?.length === 0 ? (
            <div className="card empty-state">
              <p>No tasks yet. Start by creating one!</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="kanban-board">
                {['todo', 'in-progress', 'done'].map((status) => (
                  <Droppable key={status} droppableId={status}>
                    {(provided) => (
                      <div
                        className="kanban-column"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        <div className="kanban-header">
                          <span>
                            <span 
                              className="status-dot" 
                              style={{ backgroundColor: columnColors[status] }}
                            ></span>
                            {status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                          <span className="task-count">{tasksByStatus[status].length}</span>
                        </div>
                        {tasksByStatus[status].map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id.toString()}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                className="kanban-card"
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <h4>{task.title}</h4>
                                <div className="kanban-card-meta">
                                  <span className={`badge ${getPriorityBadge(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                  {task.dueDate && (
                                    <span className={`due-date ${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'overdue' : ''}`}>
                                      {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                {task.assignee && (
                                  <div className="kanban-assignee">
                                    {task.assignee.name}
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="members-section">
          <div className="members-grid">
            {project.members?.map((member) => (
              <div key={member.id} className="member-card">
                <div className="member-avatar-large">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="member-info">
                  <span className="member-name">{member.name}</span>
                  <span className="member-email">{member.email}</span>
                  <span className={`badge badge-${member.role}`}>{member.role}</span>
                </div>
                {isProjectAdmin() && member.id !== project.createdBy && (
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && isProjectAdmin() && (
        <div className="settings-section">
          <div className="card">
            <h3>Project Settings</h3>
            <div className="settings-form">
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={project.name}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={project.description || 'No description'}
                  readOnly
                  rows="2"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <input
                  type="text"
                  className="form-input"
                  value={project.status || 'active'}
                  readOnly
                />
              </div>
            </div>
            <div className="settings-actions">
              <button className="btn btn-primary" onClick={openEditModal}>
                Edit Project
              </button>
            </div>
          </div>

          <div className="card danger-zone">
            <h3>Danger Zone</h3>
            <p className="text-muted">Once you delete a project, there is no going back. Please be certain.</p>
            <button 
              className="btn btn-danger"
              onClick={() => {
                setDeleteConfirmText('');
                setError('');
                setShowDeleteConfirm(true);
              }}
            >
              Delete Project
            </button>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Task</h3>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                {error && <div className="alert alert-error" style={{marginBottom: '20px'}}>{error}</div>}
                <div className="form-group">
                  <label className="form-label">Task Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Enter task title"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Enter task description (optional)"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows="2"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  {console.log('Project members in modal:', project.members)}
                  <select
                    className="form-select"
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                    disabled={!project.members || project.members.length === 0}
                  >
                    <option value="">
                      {project.members && project.members.length > 0 
                        ? "-- Select a member --" 
                        : "No members available - add members first"}
                    </option>
                    {project.members?.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                  {(!project.members || project.members.length === 0) && (
                    <p className="form-hint text-muted">
                      No project members found. Go to the Members tab to add team members first.
                    </p>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowTaskModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Member to Project</h3>
              <button className="modal-close" onClick={() => setShowMemberModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleAddMember}>
              <div className="modal-body">
                {error && <div className="alert alert-error" style={{marginBottom: '20px'}}>{error}</div>}
                <div className="form-group">
                  <label className="form-label">Search Users *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by name or email (min 2 characters)"
                    value={searchQuery}
                    onChange={(e) => handleUserSearch(e.target.value)}
                  />
                </div>
                {searching && <p className="text-muted">Searching...</p>}
                {searchResults.length > 0 && (
                  <div className="user-search-results">
                    {searchResults.map((user) => (
                      <div 
                        key={user.id} 
                        className={`user-result-item ${selectedUserId === user.id.toString() ? 'selected' : ''}`}
                        onClick={() => setSelectedUserId(user.id.toString())}
                      >
                        <div>
                          <strong>{user.name}</strong>
                          <span className="user-email"> ({user.email})</span>
                        </div>
                        <span className={`badge badge-${user.role}`}>{user.role}</span>
                      </div>
                    ))}
                  </div>
                )}
                {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                  <p className="text-muted">No users found</p>
                )}
                {selectedUserId && (
                  <div style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '6px' }}>
                    Selected: {searchResults.find(u => u.id === parseInt(selectedUserId))?.name || 'User'}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => {
                  setShowMemberModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                  setSelectedUserId('');
                }}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={addingMember || !selectedUserId}
                >
                  {addingMember ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Project</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateProject}>
              <div className="modal-body">
                {error && <div className="alert alert-error" style={{marginBottom: '20px'}}>{error}</div>}
                <div className="form-group">
                  <label className="form-label">Project Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editProject.name}
                    onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Enter project description (optional)"
                    value={editProject.description}
                    onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={editProject.status}
                    onChange={(e) => setEditProject({ ...editProject, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title text-danger">Delete Project</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{marginBottom: '20px'}}>{error}</div>}
              <p className="text-danger">
                <strong>Warning:</strong> This action cannot be undone. This will permanently delete the project
                <strong> "{project.name}"</strong> and all its tasks.
              </p>
              <div className="form-group" style={{marginTop: '20px'}}>
                <label className="form-label">
                  Please type <strong>{project.name}</strong> to confirm:
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={`Type "${project.name}" to confirm`}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={handleDeleteProject}
                disabled={deleting || deleteConfirmText !== project.name}
              >
                {deleting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
