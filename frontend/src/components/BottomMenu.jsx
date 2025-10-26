import { NavLink } from 'react-router-dom';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';

export default function BottomMenu() {
  const { can } = useAuthz();

  const navItems = [
    {
      path: '/dashboard',
      icon: (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 4a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V4.5A.5.5 0 0 1 8 4zM3.732 5.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707zM2 10a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 10zm9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5zm.754-4.246a.389.389 0 0 0-.527-.02L7.547 9.31a.91.91 0 1 0 1.302 1.258l3.434-4.297a.389.389 0 0 0-.029-.518z"/>
          <path fillRule="evenodd" d="M0 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0zm8-7a7 7 0 0 0-2.219 13.657 8.932 8.932 0 0 1-.264-5.36c.185-.718.39-1.367.615-1.942.23-.585.478-1.098.733-1.535.253-.436.517-.794.79-1.064.274-.27.562-.427.85-.427.287 0 .576.157.85.427.273.27.537.628.79 1.064.255.437.503.95.733 1.535.225.575.43 1.224.615 1.942a8.932 8.932 0 0 1-.264 5.36A7 7 0 0 0 8 3z"/>
        </svg>
      ),
      label: 'Dashboard'
    },
    {
      path: '/employes',
      icon: (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
        </svg>
      ),
      label: 'Employés'
    },
    {
      path: '/locataires',
      icon: (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
        </svg>
      ),
      label: 'Locataires'
    },
    {
      path: '/unites',
      icon: (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4 2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zM4 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zM7.5 5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zM4.5 8a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1z"/>
          <path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V1zm11 0H3v14h3v-2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V15h3V1z"/>
        </svg>
      ),
      label: 'Unités'
    },
    {
      path: '/proprietaires',
      icon: (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1h-3zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5z"/>
        </svg>
      ),
      label: 'Proprios'
    },
    {
      path: '/profile',
      icon: (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"/>
        </svg>
      ),
      label: 'Profil'
    },
    {
      path: '/roles-permissions',
      icon: (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path d="M5.5 9.5a3.5 3.5 0 1 1 4.243 3.41l-.243.09V14a1 1 0 0 1-1 1H7.5a1 1 0 0 1-1-1v-1a3.5 3.5 0 0 1-1-3.5zm3.5-2.5a2.5 2.5 0 0 0-2.45 2H6a2 2 0 1 0 0 4h.55c.212.58.59 1.08 1.086 1.44L7.5 15h2l-.136-.56A2.5 2.5 0 0 0 9 11.5 2.5 2.5 0 0 0 9 7z"/>
          <path d="M11.5 1a.5.5 0 0 1 .5.5V3h1.5a.5.5 0 0 1 0 1H12v1.5a.5.5 0 0 1-1 0V4h-1.5a.5.5 0 0 1 0-1H11V1.5a.5.5 0 0 1 .5-.5z"/>
        </svg>
      ),
      label: 'Rôles'
    }
  ];

  const allowedNavItems = navItems.filter((item) => {
    switch (item.path) {
      case '/locataires':
        return can(PERMS.locataires.view);
      case '/proprietaires':
        return can(PERMS.proprietaires.view);
      case '/unites':
        return can(PERMS.unites.view);
      case '/roles-permissions':
        return can(PERMS.roles.view);
      case '/employes':
        return can(PERMS.users.view);
      default:
        return true; // dashboard, profile
    }
  });

  return (
    <nav className="d-lg-none position-fixed bottom-0 start-0 end-0 shadow-lg"
         style={{
           background: 'rgba(255, 255, 255, 0.95)',
           backdropFilter: 'blur(20px)',
           borderTop: '1px solid rgba(0,0,0,0.08)',
           zIndex: 1000,
           paddingBottom: 'env(safe-area-inset-bottom)'
         }}>
      <div className="d-flex justify-content-around align-items-center px-2 py-2">
        {allowedNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="text-decoration-none d-flex flex-column align-items-center gap-1 px-3 py-2 rounded-3"
            style={({ isActive }) => ({
              color: isActive ? '#2563eb' : '#6b7280',
              transition: 'all 0.3s ease',
              flex: 1,
              maxWidth: '80px'
            })}
          >
            {({ isActive }) => (
              <>
                <div className="position-relative">
                  {item.icon}
                  {isActive && (
                    <div className="position-absolute top-0 start-50 translate-middle"
                         style={{
                           width: '4px',
                           height: '4px',
                           borderRadius: '50%',
                           background: '#2563eb',
                           marginTop: '-8px'
                         }} />
                  )}
                </div>
                <span className="small fw-medium" style={{ fontSize: '0.7rem' }}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
