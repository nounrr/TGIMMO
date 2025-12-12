import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import BottomMenu from './BottomMenu';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';

export default function Layout() {
  return (
    <>
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">TGI</h1>
          </header>
          <main className="flex-1 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 min-h-screen pb-20 lg:pb-0">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
      {/* Mobile Bottom Menu - Only visible on mobile */}
      <div className="lg:hidden">
        <BottomMenu />
      </div>
    </>
  );
}

