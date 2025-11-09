import { NavLink } from 'react-router-dom';
import { useLogoutMutation, useMeQuery } from '../features/auth/authApi';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useSidebar } from '../contexts/SidebarContext';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';

export default function Sidebar() {
  const [logout, { isLoading }] = useLogoutMutation();
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth.user);
  const { data: me } = useMeQuery();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { can } = useAuthz();

  // Resolve current user (same as Profile.jsx)
  const user = me || authUser;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const navItems = [
    {
      path: '/dashboard',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 4a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V4.5A.5.5 0 0 1 8 4zM3.732 5.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707zM2 10a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 10zm9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5zm.754-4.246a.389.389 0 0 0-.527-.02L7.547 9.31a.91.91 0 1 0 1.302 1.258l3.434-4.297a.389.389 0 0 0-.029-.518z"/>
          <path fillRule="evenodd" d="M0 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0zm8-7a7 7 0 0 0-2.219 13.657 8.932 8.932 0 0 1-.264-5.36c.185-.718.39-1.367.615-1.942.23-.585.478-1.098.733-1.535.253-.436.517-.794.79-1.064.274-.27.562-.427.85-.427.287 0 .576.157.85.427.273.27.537.628.79 1.064.255.437.503.95.733 1.535.225.575.43 1.224.615 1.942a8.932 8.932 0 0 1-.264 5.36A7 7 0 0 0 8 3z"/>
        </svg>
      ),
      label: 'Dashboard'
    },
    {
      path: '/mandats',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6l4-4V2a2 2 0 0 0-2-2H4z"/>
          <path d="M10 16v-3a1 1 0 0 1 1-1h3"/>
        </svg>
      ),
      label: 'Mandats'
    },
    {
      path: '/avenants',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4 1h8a1 1 0 0 1 1 1v9.5a.5.5 0 0 1-.146.354l-3.5 3.5A.5.5 0 0 1 9 15H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
          <path d="M9 15v-3a1 1 0 0 1 1-1h3"/>
        </svg>
      ),
      label: 'Avenants'
    },
    {
      path: '/baux',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8.5 1.866a1 1 0 0 0-1 0l-6 3.464A1 1 0 0 0 1 6.196v6.608a1 1 0 0 0 .5.866l6 3.464a1 1 0 0 0 1 0l6-3.464a1 1 0 0 0 .5-.866V6.196a1 1 0 0 0-.5-.866l-6-3.464z"/>
          <path d="M8.5 4.134 13.5 7 8.5 9.866 3.5 7l5-2.866z" />
        </svg>
      ),
      label: 'Baux'
    },
    {
      path: '/remises-cles',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M3 11a5 5 0 1 1 9.584 1.99.5.5 0 0 0 .342.622l.326.094a1.5 1.5 0 0 1 1.044 1.423V16a.5.5 0 0 1-.5.5H11v-.5A1.5 1.5 0 0 0 9.5 14h-1A1.5 1.5 0 0 0 7 15.5v.5H1.5a.5.5 0 0 1-.5-.5v-2.17A1.5 1.5 0 0 1 2.044 11.9l.326-.094a.5.5 0 0 0 .342-.622A5.002 5.002 0 0 1 3 11Zm5-4a4 4 0 0 0-3.995 3.8 1.5 1.5 0 0 1-.997 1.868l-.326.094a.5.5 0 0 0-.342.622l.062.186a.5.5 0 0 0 .474.33H6v-1a2.5 2.5 0 0 1 2.5-2.5h1A2.5 2.5 0 0 1 12 13v1h2.124a.5.5 0 0 0 .474-.33l.062-.186a.5.5 0 0 0-.342-.622l-.326-.094a1.5 1.5 0 0 1-.997-1.868A4 4 0 0 0 8 7Z"/>
          <path d="M8 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/>
        </svg>
      ),
      label: 'Remises clés'
    },
    {
      path: '/prestataires',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
        </svg>
      ),
      label: 'Prestataires'
    },
    {
      path: '/employes',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
        </svg>
      ),
      label: 'Employés'
    },
    {
      path: '/locataires',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
        </svg>
      ),
      label: 'Locataires'
    },
    {
      path: '/proprietaires',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1h-3zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5z"/>
        </svg>
      ),
      label: 'Propriétaires'
    },
    {
      path: '/unites',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4 2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zM4 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zM7.5 5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zM4.5 8a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1z"/>
          <path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V1zm11 0H3v14h3v-2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V15h3V1z"/>
        </svg>
      ),
      label: 'Unités'
    },
    {
      path: '/roles-permissions',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M5.5 9.5a3.5 3.5 0 1 1 4.243 3.41l-.243.09V14a1 1 0 0 1-1 1H7.5a1 1 0 0 1-1-1v-1a3.5 3.5 0 0 1-1-3.5zm3.5-2.5a2.5 2.5 0 0 0-2.45 2H6a2 2 0 1 0 0 4h.55c.212.58.59 1.08 1.086 1.44L7.5 15h2l-.136-.56A2.5 2.5 0 0 0 9 11.5 2.5 2.5 0 0 0 9 7z"/>
          <path d="M11.5 1a.5.5 0 0 1 .5.5V3h1.5a.5.5 0 0 1 0 1H12v1.5a.5.5 0 0 1-1 0V4h-1.5a.5.5 0 0 1 0-1H11V1.5a.5.5 0 0 1 .5-.5z"/>
        </svg>
      ),
      label: 'Rôles & Permissions'
    }
  ];

  // Obtenir les initiales de l'utilisateur
  const getUserInitials = () => {
    if (!user) return '??';
    const name = (user.name || '').trim();
    if (name) {
      const parts = name.split(/\s+/);
      const first = parts[0]?.charAt(0) || '';
      const last = parts[1]?.charAt(0) || '';
      return `${first}${last}`.toUpperCase() || (user.email?.slice(0, 2)?.toUpperCase()) || 'US';
    }
    return (user.email?.slice(0, 2)?.toUpperCase()) || 'US';
  };

  // Obtenir le nom complet
  const getFullName = () => {
    if (!user) return 'Utilisateur';
    return (user.name || '').trim() || user.email || 'Utilisateur';
  };

  // Obtenir le rôle (supporte tableaux de chaînes ou d'objets)
  const getUserRole = () => {
    const roles = user?.roles;
    if (!Array.isArray(roles) || roles.length === 0) return 'Utilisateur';
    const first = roles[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && first.name) return first.name;
    return 'Utilisateur';
  };

  const allowedNavItems = navItems.filter((item) => {
    switch (item.path) {
      case '/locataires':
        return can(PERMS.locataires.view);
      case '/proprietaires':
        return can(PERMS.proprietaires.view);
      case '/unites':
        return can(PERMS.unites.view);
      case '/prestataires':
        return can(PERMS.prestataires.view);
      case '/roles-permissions':
        return can(PERMS.roles.view);
      case '/employes':
        return can(PERMS.users.view);
      case '/mandats':
        return can(PERMS.mandats.view);
      case '/avenants':
        return can(PERMS.avenants.view);
      case '/baux':
        return can(PERMS.baux.view);
      case '/remises-cles':
        return can(PERMS.remises_cles.view);
      default:
        return true; // dashboard, profile, etc.
    }
  });

  return (
    <aside className="d-none d-lg-flex flex-column position-fixed top-0 start-0 vh-100 shadow-lg"
           style={{
             width: isCollapsed ? '80px' : '280px',
             background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
             borderRight: '1px solid rgba(0,0,0,0.05)',
             zIndex: 1000,
             transition: 'width 0.3s ease'
           }}>
      {/* Logo & Toggle Button */}
      <div className="p-4 border-bottom d-flex align-items-center justify-content-between" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
        {!isCollapsed && (
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                 style={{
                   width: '48px',
                   height: '48px',
                   background: 'linear-gradient(135deg, #2563eb, #7c3aed)'
                 }}>
              <svg className="text-white" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="h5 fw-bold mb-0" style={{
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>TGI</h1>
              <p className="small text-muted mb-0">Gestion Immobilière</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="btn btn-sm rounded-circle p-2 border-0"
          style={{
            background: 'rgba(37, 99, 235, 0.08)',
            transition: 'all 0.3s ease',
            marginLeft: isCollapsed ? 'auto' : '0',
            marginRight: isCollapsed ? 'auto' : '0'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(37, 99, 235, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(37, 99, 235, 0.08)';
          }}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" style={{
            transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}>
            <path fillRule="evenodd" d="M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5a.5.5 0 0 1 .5.5z"/>
          </svg>
        </button>
      </div>

      {/* User Profile Section */}
      <NavLink 
        to="/profile"
        className="text-decoration-none"
      >
        <div className="p-3 border-bottom" style={{ 
          borderColor: 'rgba(0,0,0,0.05)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(37, 99, 235, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}>
          <div className={`d-flex align-items-center ${isCollapsed ? 'justify-content-center' : 'gap-3'}`}>
            {/* Avatar */}
            <div className="position-relative flex-shrink-0">
              {user?.photo_url ? (
                <img 
                  src={user.photo_url} 
                  alt={getFullName()}
                  className="rounded-circle border border-2"
                  style={{
                    width: isCollapsed ? '40px' : '56px',
                    height: isCollapsed ? '40px' : '56px',
                    objectFit: 'cover',
                    borderColor: '#e5e7eb !important',
                    transition: 'all 0.3s ease'
                  }}
                />
              ) : (
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white border border-2"
                  style={{
                    width: isCollapsed ? '40px' : '56px',
                    height: isCollapsed ? '40px' : '56px',
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    borderColor: '#e5e7eb !important',
                    fontSize: isCollapsed ? '0.9rem' : '1.1rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {getUserInitials()}
                </div>
              )}
              {/* Online indicator */}
              <div 
                className="position-absolute rounded-circle border border-2 border-white"
                style={{
                  width: '12px',
                  height: '12px',
                  background: '#10b981',
                  bottom: '0',
                  right: '0'
                }}
              />
            </div>
            
            {/* User Info */}
            {!isCollapsed && (
              <div className="flex-grow-1 overflow-hidden">
                <p className="mb-0 fw-semibold text-dark text-truncate" style={{ fontSize: '0.95rem' }}>
                  {getFullName()}
                </p>
                <p className="mb-0 text-muted text-truncate" style={{ fontSize: '0.8rem' }}>
                  {getUserRole()}
                </p>
              </div>
            )}
          </div>
        </div>
      </NavLink>

      {/* Navigation */}
      <nav className="flex-grow-1 p-3 overflow-auto">
        <div className="d-flex flex-column gap-1">
          {allowedNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `d-flex align-items-center ${isCollapsed ? 'justify-content-center' : 'gap-3'} px-3 py-3 rounded-3 text-decoration-none transition-all ${
                  isActive 
                    ? 'text-white shadow-sm' 
                    : 'text-dark hover-item'
                }`
              }
              style={({ isActive }) => ({
                background: isActive 
                  ? 'linear-gradient(135deg, #2563eb, #4f46e5)' 
                  : 'transparent',
                transition: 'all 0.3s ease',
                fontWeight: isActive ? '600' : '500'
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.classList.contains('text-white')) {
                  e.currentTarget.style.background = 'rgba(37, 99, 235, 0.08)';
                  e.currentTarget.style.transform = isCollapsed ? 'scale(1.05)' : 'translateX(4px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.classList.contains('text-white')) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0) scale(1)';
                }
              }}
            >
              {item.icon}
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Logout button */}
      <div className="p-3 border-top" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className={`btn w-100 d-flex align-items-center ${isCollapsed ? 'justify-content-center' : 'justify-content-center gap-2'} py-3 rounded-3 text-danger border-0`}
          style={{
            background: 'rgba(220, 38, 38, 0.08)',
            transition: 'all 0.3s ease',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(220, 38, 38, 0.15)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(220, 38, 38, 0.08)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm" />
              {!isCollapsed && <span>Déconnexion...</span>}
            </>
          ) : (
            <>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
                <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
              </svg>
              {!isCollapsed && <span>Déconnexion</span>}
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
