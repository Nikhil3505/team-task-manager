import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import './Layout.css';

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="logo">
            <span className="logo-icon">📋</span>
            Task Manager
          </h1>
        </div>

        <nav className="sidebar-nav">
          <Link 
            to="/dashboard" 
            className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </Link>
          <Link 
            to="/projects" 
            className={`nav-item ${isActive('/projects') || location.pathname.includes('/projects/') ? 'active' : ''}`}
          >
            <span className="nav-icon">📁</span>
            Projects
          </Link>
          <Link 
            to="/tasks" 
            className={`nav-item ${isActive('/tasks') ? 'active' : ''}`}
          >
            <span className="nav-icon">✅</span>
            Tasks
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className={`user-role badge-${user?.role}`}>
                {user?.role}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-spacer"></div>
          <div className="header-actions">
            <NotificationBell />
          </div>
        </header>
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
