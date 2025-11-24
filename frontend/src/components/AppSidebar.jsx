import { useNavigate, useLocation } from 'react-router-dom';
import { useLogoutMutation, useMeQuery } from '../features/auth/authApi';
import { useSelector } from 'react-redux';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  Home,
  Key,
  UserCheck,
  Users,
  Wrench,
  UserCog,
  Building2,
  Settings,
  LogOut,
  ChevronRight,
  Briefcase,
  ClipboardList,
  Tag,
  FileCheck,
  Receipt,
  CreditCard,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [logout] = useLogoutMutation();
  const authUser = useSelector((state) => state.auth.user);
  const { data: me } = useMeQuery();
  const { can } = useAuthz();

  const user = me || authUser;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

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

  const getFullName = () => {
    if (!user) return 'Utilisateur';
    return (user.name || '').trim() || user.email || 'Utilisateur';
  };

  const getUserRole = () => {
    const roles = user?.roles;
    if (!Array.isArray(roles) || roles.length === 0) return 'Utilisateur';
    const first = roles[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && first.name) return first.name;
    return 'Utilisateur';
  };

  const menuItems = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Liquidations',
      url: '/liquidations',
      icon: FileText,
      permission: PERMS.liquidations.view,
    },
    {
      title: 'Gestion Locative',
      icon: Home,
      items: [
        { title: 'Mandats', url: '/mandats', icon: FileText, permission: PERMS.mandats.view },
        { title: 'Avenants', url: '/avenants', icon: FilePlus, permission: PERMS.avenants.view },
        { title: 'Baux', url: '/baux', icon: Briefcase, permission: PERMS.baux.view },
        { title: 'Remises clés', url: '/remises-cles', icon: Key, permission: PERMS.remises_cles.view },
      ],
    },
    {
      title: 'Approches',
      icon: UserCheck,
      items: [
        { title: 'Propriétaires', url: '/approches/proprietaires', icon: UserCog, permission: PERMS.approches_proprietaires.view },
        { title: 'Locataires', url: '/approches/locataires', icon: Users, permission: PERMS.approches_locataires.view },
      ],
    },
    {
      title: 'Maintenance',
      icon: Wrench,
      items: [
        { title: 'Préstataires', url: '/prestataires', icon: UserCog, permission: PERMS.prestataires.view },
        { title: 'Réclamations', url: '/reclamations', icon: ClipboardList, permission: PERMS.reclamations.view },
        { title: 'Types réclamations', url: '/reclamations/types', icon: Tag, permission: PERMS.reclamations.view },
        { title: 'Interventions', url: '/interventions', icon: Wrench, permission: PERMS.interventions.view },
        { title: 'Devis', url: '/devis', icon: FileCheck, permission: PERMS.devis.view },
        { title: 'Factures', url: '/factures', icon: Receipt, permission: PERMS.factures.view },
        { title: 'Charges', url: '/charges', icon: CreditCard, permission: PERMS.charges.view },
      ],
    },
    {
      title: 'Contacts',
      icon: Users,
      items: [
        { title: 'Locataires', url: '/locataires', icon: Users, permission: PERMS.locataires.view },
        { title: 'Propriétaires', url: '/proprietaires', icon: UserCog, permission: PERMS.proprietaires.view },
      ],
    },
    {
      title: 'Paramètres',
      icon: Settings,
      items: [
        { title: 'Unités', url: '/unites', icon: Building2, permission: PERMS.unites.view },
        { title: 'Employés', url: '/employes', icon: Users, permission: PERMS.users.view },
        { title: 'Rôles & Permissions', url: '/roles-permissions', icon: Settings, permission: PERMS.roles.view },
      ],
    },
  ];

  const filterMenuItems = (items) => {
    return items
      .map((item) => {
        if (item.items) {
          const filteredSubItems = item.items.filter((subItem) => {
            if (subItem.permission) {
              return can(subItem.permission);
            }
            return true;
          });
          if (filteredSubItems.length === 0) return null;
          return { ...item, items: filteredSubItems };
        }
        if (item.permission) {
          return can(item.permission) ? item : null;
        }
        return item;
      })
      .filter(Boolean);
  };

  const filteredMenuItems = filterMenuItems(menuItems);

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">TGI</h2>
            <p className="text-xs text-muted-foreground">Gestion Immobilière</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {filteredMenuItems.map((item) => (
          <SidebarGroup key={item.title}>
            {item.items ? (
              <Collapsible defaultOpen={false} className="group/collapsible">
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-2 hover:bg-accent rounded-md transition-colors">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm text-slate-700">{item.title}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent className="ml-2 mt-1">
                    <SidebarMenu>
                      {item.items.map((subItem) => (
                        <SidebarMenuItem key={subItem.title}>
                          <SidebarMenuButton
                            asChild
                            isActive={location.pathname === subItem.url}
                            className={location.pathname === subItem.url ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'hover:bg-slate-100'}
                          >
                            <a href={subItem.url} onClick={(e) => { e.preventDefault(); navigate(subItem.url); }} className="flex items-center gap-2 py-2 px-3 rounded-md">
                              <subItem.icon className="h-4 w-4" />
                              <span className="text-sm">{subItem.title}</span>
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.url}
                        className={location.pathname === item.url ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'hover:bg-slate-100'}
                      >
                        <a href={item.url} onClick={(e) => { e.preventDefault(); navigate(item.url); }} className="flex items-center gap-2 py-2 px-3 rounded-md">
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </>
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start text-left text-sm">
                <span className="font-medium">{getFullName()}</span>
                <span className="text-xs text-muted-foreground">{getUserRole()}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <Users className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
