import { useMemo, useState } from 'react';
import {
  useGetRolesQuery,
  useDeleteRoleMutation,
  useGetPermissionsQuery,
} from '../features/roles/rolesApi';
import { useGetUsersQuery } from '../features/users/usersApi';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Plus, Edit, Trash2, Shield, Users, Key, ChevronDown } from 'lucide-react';
import PermissionsModal from '../components/modals/PermissionsModal';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';

export default function RolesPermissionsShadcn() {
  const { can } = useAuthz();
  const [activeTab, setActiveTab] = useState('roles');

  // Roles state
  const [searchRole, setSearchRole] = useState('');
  const [paginationRoles, setPaginationRoles] = useState({ pageIndex: 0, pageSize: 10 });
  const rolesParams = useMemo(() => ({
    page: paginationRoles.pageIndex + 1,
    per_page: paginationRoles.pageSize,
    q: searchRole || undefined,
    withPermissions: true,
  }), [paginationRoles, searchRole]);
  const { data: rolesResp, isLoading: isLoadingRoles } = useGetRolesQuery(rolesParams);

  // Permissions state
  const [searchPerm, setSearchPerm] = useState('');
  const [paginationPerms, setPaginationPerms] = useState({ pageIndex: 0, pageSize: 1000 });
  const permsParams = useMemo(() => ({
    page: paginationPerms.pageIndex + 1,
    per_page: paginationPerms.pageSize,
    q: searchPerm || undefined,
  }), [paginationPerms, searchPerm]);
  const { data: permsResp, isLoading: isLoadingPerms } = useGetPermissionsQuery(permsParams, { skip: activeTab !== 'permissions' });

  const permissions = permsResp?.data || [];
  const groupedPermissions = useMemo(() => {
    const groups = {};
    permissions.forEach(perm => {
      const parts = perm.name.split('.');
      const groupName = parts.length > 1 ? parts[0] : 'Autres';
      
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(perm);
    });
    return groups;
  }, [permissions]);

  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'role' or 'user'
  const [modalData, setModalData] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // Users state
  const [searchUser, setSearchUser] = useState('');
  const [paginationUsers, setPaginationUsers] = useState({ pageIndex: 0, pageSize: 10 });
  const usersParams = useMemo(() => ({
    page: paginationUsers.pageIndex + 1,
    per_page: paginationUsers.pageSize,
    q: searchUser || undefined,
  }), [paginationUsers, searchUser]);
  const { data: usersResp, isLoading: isLoadingUsers } = useGetUsersQuery(usersParams, { skip: activeTab !== 'users' || !can(PERMS.users.view) });
  
  const users = usersResp?.data || [];
  const usersPagination = {
    page: usersResp?.current_page || 1,
    lastPage: usersResp?.last_page || 1,
    total: usersResp?.total || 0,
  };

  const roles = rolesResp?.data || [];
  const rolesPagination = {
    page: rolesResp?.current_page || 1,
    lastPage: rolesResp?.last_page || 1,
    total: rolesResp?.total || 0,
  };

  const permsPagination = {
    page: permsResp?.current_page || 1,
    lastPage: permsResp?.last_page || 1,
    total: permsResp?.total || 0,
  };

  const handleAddRole = () => {
    setModalType('role');
    setModalData(null);
    setShowModal(true);
  };

  const handleEditRole = (role) => {
    setModalType('role');
    setModalData(role);
    setShowModal(true);
  };

  const handleDeleteClick = (role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  const handleManageUserAccess = (user) => {
    setModalType('user');
    setModalData(user);
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteRole(selectedRole.id).unwrap();
      setShowDeleteModal(false);
      setSelectedRole(null);
    } catch (err) {
      console.error('Erreur suppression rôle:', err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900">Rôles & Permissions</h1>
        <p className="text-slate-500">Gérez les rôles, les permissions et leurs affectations</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          {can(PERMS.roles.view) && (
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Rôles
            </TabsTrigger>
          )}
          {can(PERMS.permissions.view) && (
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Permissions
            </TabsTrigger>
          )}
          {can(PERMS.users.view) && (
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs
            </TabsTrigger>
          )}
        </TabsList>

        {/* Roles Tab */}
        {can(PERMS.roles.view) && (
          <TabsContent value="roles" className="space-y-4 mt-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Filtres
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="search-role" className="text-sm font-medium mb-1.5 block text-left">
                        Recherche
                      </Label>
                      <Input
                        id="search-role"
                        placeholder="Rechercher un rôle..."
                        value={searchRole}
                        onChange={(e) => setSearchRole(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end">
              {can(PERMS.roles.create) && (
                <Button onClick={handleAddRole} size="sm" className="h-8 gap-2">
                  <Plus className="h-4 w-4" />
                  Nouveau rôle
                </Button>
              )}
            </div>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Nom</TableHead>
                      <TableHead className="text-center">Permissions</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingRoles ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8">
                          Chargement...
                        </TableCell>
                      </TableRow>
                    ) : roles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          Aucun rôle trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      roles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell className="font-semibold">{role.name}</TableCell>
                          <TableCell className="text-center">
                            {role.permissions?.length ? (
                              <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                                {role.permissions.length} permission(s)
                              </Badge>
                            ) : (
                              <Badge variant="outline">0</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              {can(PERMS.roles.update) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 hover:bg-slate-100 hover:text-blue-600"
                                  onClick={() => handleEditRole(role)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {can(PERMS.roles.delete) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 hover:bg-slate-100 hover:text-red-600"
                                  onClick={() => handleDeleteClick(role)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {rolesPagination.total} rôle(s) au total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginationRoles((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}
                  disabled={rolesPagination.page <= 1}
                >
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {rolesPagination.page} / {rolesPagination.lastPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginationRoles((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}
                  disabled={rolesPagination.page >= rolesPagination.lastPage}
                >
                  Suivant
                </Button>
              </div>
            </div>
          </TabsContent>
        )}

        {/* Permissions Tab */}
        {can(PERMS.permissions.view) && (
          <TabsContent value="permissions" className="space-y-4 mt-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Filtres
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="search-perm" className="text-sm font-medium mb-1.5 block text-left">
                        Recherche
                      </Label>
                      <Input
                        id="search-perm"
                        placeholder="Rechercher une permission..."
                        value={searchPerm}
                        onChange={(e) => setSearchPerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Permissions List */}
            <Card>
              <CardContent className="p-4">
                {isLoadingPerms ? (
                  <div className="text-center py-8">Chargement...</div>
                ) : permissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune permission trouvée
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(groupedPermissions).map(([group, perms]) => (
                      <Collapsible key={group} className="border rounded-md bg-white">
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 font-medium hover:bg-slate-50 [&[data-state=open]>svg]:rotate-180">
                          <div className="flex items-center gap-2">
                             <span className="capitalize">{group.replace(/-/g, ' ')}</span>
                             <Badge variant="outline" className="ml-2 bg-indigo-50 text-indigo-700 border-indigo-200">{perms.length}</Badge>
                          </div>
                          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-0 border-t">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50">
                                <TableHead>Nom</TableHead>
                                <TableHead>Guard</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {perms.map((perm) => (
                                <TableRow key={perm.id}>
                                  <TableCell className="font-medium">{perm.name}</TableCell>
                                  <TableCell className="text-muted-foreground">{perm.guard_name}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {permsPagination.total} permission(s) au total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginationPerms((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}
                  disabled={permsPagination.page <= 1}
                >
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {permsPagination.page} / {permsPagination.lastPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginationPerms((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}
                  disabled={permsPagination.page >= permsPagination.lastPage}
                >
                  Suivant
                </Button>
              </div>
            </div>
          </TabsContent>
        )}

        {/* Users Tab */}
        {can(PERMS.users.view) && (
          <TabsContent value="users" className="space-y-4 mt-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Filtres
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="search-user" className="text-sm font-medium mb-1.5 block text-left">
                        Recherche
                      </Label>
                      <Input
                        id="search-user"
                        placeholder="Rechercher un utilisateur..."
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingUsers ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8">
                          Chargement...
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          Aucun utilisateur trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-semibold">{user.name || '-'}</TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 gap-2 hover:bg-slate-100 hover:text-blue-600"
                                onClick={() => handleManageUserAccess(user)}
                              >
                                <Users className="h-4 w-4" />
                                Gérer accès
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {usersPagination.total} utilisateur(s) au total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginationUsers((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}
                  disabled={usersPagination.page <= 1}
                >
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {usersPagination.page} / {usersPagination.lastPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginationUsers((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}
                  disabled={usersPagination.page >= usersPagination.lastPage}
                >
                  Suivant
                </Button>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Modals */}
      <PermissionsModal
        show={showModal}
        onHide={() => { setShowModal(false); setModalData(null); setModalType(null); }}
        type={modalType}
        data={modalData}
      />

      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le rôle</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRole 
                ? `Êtes-vous sûr de vouloir supprimer le rôle "${selectedRole.name}" ?` 
                : 'Confirmer la suppression du rôle.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="w-full md:w-1/2">Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="w-full md:w-1/2 bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
