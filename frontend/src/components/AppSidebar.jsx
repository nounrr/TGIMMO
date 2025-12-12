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
  BookOpen,
  CircleDollarSign
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
      title: 'Prospection',
      icon: UserCheck,
      items: [
        { title: 'Propriétaires', url: '/approches/proprietaires', icon: UserCog, permission: PERMS.approches_proprietaires.view },
        { title: 'Locataires', url: '/approches/locataires', icon: Users, permission: PERMS.approches_locataires.view },
      ],
    },
    {
      title: 'Gestion Locative',
      icon: Home,
      items: [
        { title: 'Propriétaires', url: '/proprietaires', icon: UserCog, permission: PERMS.proprietaires.view },
        {
          title: 'Mandats',
          url: '/mandats',
          icon: FileText,
          permission: PERMS.mandats.view,
          subItems: [
             { title: 'Avenants', url: '/avenants', icon: FilePlus, permission: PERMS.avenants.view },
          ]
        },
        { title: 'Unités', url: '/unites', icon: Building2, permission: PERMS.unites.view },
        { title: 'Locataires', url: '/locataires', icon: Users, permission: PERMS.locataires.view },
        {
          title: 'Baux',
          url: '/baux',
          icon: Briefcase,
          permission: PERMS.baux.view,
          subItems: [
             { title: 'Avenants', url: '/baux/avenants', icon: FilePlus, permission: PERMS.avenants.view },
             { title: 'Remises clés', url: '/remises-cles', icon: Key, permission: PERMS.remises_cles.view },
          ]
        },
      ],
    },
    {
      title: 'Finance',
      icon: Receipt,
      items: [
        { title: 'Liquidations', url: '/liquidations', icon: FileText, permission: PERMS.liquidations.view },
        { title: 'Charges', url: '/charges', icon: CreditCard, permission: PERMS.charges.view },
        { title: 'Baux - Paiements', url: '/paiements-locataires', icon: CircleDollarSign, permission: PERMS.paiements.view },
      ],
    },
    {
      title: 'Maintenance',
      icon: Wrench,
      items: [
        { title: 'Préstataires', url: '/prestataires', icon: UserCog, permission: PERMS.prestataires.view },
        {
            title: 'Réclamations',
            url: '/reclamations',
            icon: ClipboardList,
            permission: PERMS.reclamations.view,
            subItems: [
                { title: 'Types réclamations', url: '/reclamations/types', icon: Tag, permission: PERMS.reclamations.view },
            ]
        },
        { title: 'Interventions', url: '/interventions', icon: Wrench, permission: PERMS.interventions.view },
        { title: 'Devis', url: '/devis', icon: FileCheck, permission: PERMS.devis.view },
        { title: 'Factures', url: '/factures', icon: Receipt, permission: PERMS.factures.view },
      ],
    },
    {
      title: 'GED',
      url: '/ged',
      icon: FileText,
    },
    {
      title: 'Utilisateur',
      icon: Users,
      items: [
        { title: 'Employés', url: '/employes', icon: Users, permission: PERMS.users.view },
        { title: 'Rôles & Permissions', url: '/roles-permissions', icon: Settings, permission: PERMS.roles.view },
      ],
    },
    {
      title: 'Guide',
      url: '/guide',
      icon: BookOpen,
    }
  ];

  const filterMenuItems = (items) => {
    return items
      .map((item) => {
        if (item.items) {
          const filteredItems = item.items.map(subItem => {
             if (subItem.subItems) {
                 const filteredSubSubItems = subItem.subItems.filter(ssi => {
                     if (ssi.permission) return can(ssi.permission);
                     return true;
                 });
                 if (subItem.permission && !can(subItem.permission)) return null;
                 return { ...subItem, subItems: filteredSubSubItems };
             }
             
             if (subItem.permission) {
                 return can(subItem.permission) ? subItem : null;
             }
             return subItem;
          }).filter(Boolean);

          if (filteredItems.length === 0) return null;
          return { ...item, items: filteredItems };
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
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#001f3f] text-white shrink-0">
            <img src="/logo.png" alt="TGI" className="h-6 w-6 object-contain" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-lg font-semibold text-[#001f3f]">TGI</h2>
            <p className="text-xs text-muted-foreground">Gestion Immobilière</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {filteredMenuItems.map((item) => (
          <SidebarGroup key={item.title}>
            {item.items ? (
              <Collapsible defaultOpen={true} className="group/collapsible">
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
                          {subItem.subItems && subItem.subItems.length > 0 ? (
                            <Collapsible className="group/subcollapsible">
                                <SidebarMenuButton asChild>
                                    <CollapsibleTrigger className="flex w-full items-center justify-between">
                                        <div className="flex items-center gap-2" onClick={(e) => { if(subItem.url) { e.stopPropagation(); navigate(subItem.url); } }}>
                                            {subItem.icon && <subItem.icon className="h-4 w-4" />}
                                            <span>{subItem.title}</span>
                                        </div>
                                        <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]/subcollapsible:rotate-90" />
                                    </CollapsibleTrigger>
                                </SidebarMenuButton>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {subItem.subItems.map(ssi => (
                                            <SidebarMenuSubItem key={ssi.title}>
                                                <SidebarMenuSubButton asChild isActive={location.pathname === ssi.url}>
                                                    <a href={ssi.url} onClick={(e) => { e.preventDefault(); navigate(ssi.url); }}>
                                                        {ssi.icon && <ssi.icon className="h-3 w-3 mr-2" />}
                                                        <span>{ssi.title}</span>
                                                    </a>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </Collapsible>
                          ) : (
                            <SidebarMenuButton
                                asChild
                                isActive={location.pathname === subItem.url}
                                className={location.pathname === subItem.url ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'hover:bg-slate-100'}
                            >
                                <a href={subItem.url} onClick={(e) => { e.preventDefault(); navigate(subItem.url); }} className="flex items-center gap-2 py-2 rounded-md">
                                    {subItem.icon && <subItem.icon className="h-4 w-4" />}
                                    <span className="text-sm">{subItem.title}</span>
                                </a>
                            </SidebarMenuButton>
                          )}
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
