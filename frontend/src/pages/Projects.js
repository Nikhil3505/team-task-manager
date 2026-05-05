import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Projects.css';

const Projects = () => {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      setProjects(response.data.data.projects);
      setError('');
    } catch (err) {
      setError('Failed to load projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.post('/projects', newProject);
      setShowModal(false);
      setNewProject({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      console.error('Create project error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': 'badge-success',
      'completed': 'badge-info',
      'archived': 'badge-secondary'
    };
    return statusMap[status] || 'badge-secondary';
  };

  if (loading) {
    return <div className="loading">Loading projects...</div>;
  }

  return (
    <div className="projects">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Projects</h1>
            <p className="subtitle">Manage your projects and teams</p>
          </div>
          {isAdmin() && (
            <button 
              className="btn btn-primary"
              onClick={() => {
                setError('');
                setShowModal(true);
              }}
            >
              + New Project
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {projects.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">📁</div>
          <h3>No Projects Yet</h3>
          <p>Get started by creating your first project</p>
          {isAdmin() && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <Link 
              to={`/projects/${project.id}`} 
              key={project.id}
              className="project-card"
            >
              <div className="project-header">
                <h3 className="project-name">{project.name}</h3>
                <span className={`badge ${getStatusBadge(project.status)}`}>
                  {project.status}
                </span>
              </div>
              
              <p className="project-description">
                {project.description || 'No description'}
              </p>
              
              <div className="project-stats">
                <div className="stat">
                  <span className="stat-icon">✅</span>
                  <span>{project.tasks?.length || 0} tasks</span>
                </div>
                <div className="stat">
                  <span className="stat-icon">👥</span>
                  <span>{project.members?.length || 0} members</span>
                </div>
              </div>
              
              <div className="project-footer">
                <div className="creator">
                  Created by {project.creator?.name}
                </div>
                <div className="members-preview">
                  {project.members?.slice(0, 3).map((member, index) => (
                    <div 
                      key={member.id} 
                      className="member-avatar"
                      title={member.name}
                      style={{ zIndex: 3 - index }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {project.members?.length > 3 && (
                    <div className="member-avatar more">
                      +{project.members.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Project</h3>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                {error && <div className="alert alert-error" style={{marginBottom: '20px'}}>{error}</div>}
                <div className="form-group">
                  <label className="form-label">Project Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter project name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Enter project description (optional)"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    rows="3"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
