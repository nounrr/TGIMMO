import { NavLink } from 'react-router-dom';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';
import { LayoutDashboard, Users, Key, Home, UserCircle, Shield, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomMenu() {
  const { can } = useAuthz();

  const navItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard'
    },
    {
      path: '/employes',
      icon: Users,
      label: 'Employés'
    },
    {
      path: '/locataires',
      icon: Users, // Using Users for both for now, or maybe User for single?
      label: 'Locataires'
    },
    {
      path: '/unites',
      icon: Building2,
      label: 'Unités'
    },
    {
      path: '/proprietaires',
      icon: Key,
      label: 'Proprios'
    },
    {
      path: '/profile',
      icon: UserCircle,
      label: 'Profil'
    },
    {
      path: '/roles-permissions',
      icon: Shield,
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

  // Limit to 5 items for bottom menu to avoid overcrowding
  const displayItems = allowedNavItems.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16">
        {displayItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center w-full h-full text-xs gap-1 transition-colors",
                  isActive 
                    ? "text-primary font-medium" 
                    : "text-muted-foreground hover:text-primary"
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
