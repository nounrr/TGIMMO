import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomMenu from './BottomMenu';
import { SidebarProvider, useSidebar } from '../contexts/SidebarContext';

function LayoutContent() {
  const { isCollapsed } = useSidebar();

  return (
    <div>
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main 
        style={{
          marginLeft: '0',
          marginBottom: '80px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #ddd6fe 100%)',
          transition: 'all 0.3s ease',
          minHeight: '100vh',
          boxSizing: 'border-box'
        }}
        className="main-content"
      >
        <Outlet />
      </main>
      
      {/* Mobile Bottom Menu */}
      <BottomMenu />
      
      <style>{`
        * {
          box-sizing: border-box;
        }
        
        @media (min-width: 992px) {
          .main-content {
            margin-left: ${isCollapsed ? '80px' : '280px'} !important;
            margin-bottom: 0 !important;
            width: calc(100% - ${isCollapsed ? '80px' : '280px'}) !important;
          }
        }
        
        @media (max-width: 991px) {
          .main-content {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function Layout() {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
}
