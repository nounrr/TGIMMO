import { Eye, PlusCircle, Edit3, Trash2 } from 'lucide-react';

const COMMON_STATUSES = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'en_validation', label: 'En validation' },
  { value: 'signe', label: 'Signé' },
  { value: 'actif', label: 'Actif' },
  { value: 'modifier', label: 'Modifier (Historique)' },
  { value: 'resilie', label: 'Résilié' },
  { value: 'archive', label: 'Archivé' },
  { value: 'cloture', label: 'Clôturé' },
];

export default function PermissionsModal({ show, onHide, type, data }) {
  const { can } = useAuthz();
  const [saving, setSaving] = useState(false);

  // Type: 'role' ou 'user'
  const isRole = type === 'role';
  const isUser = type === 'user';
  const isEdit = isRole ? !!data?.id : false;

  // States pour Role
  const [roleName, setRoleName] = useState('');
  const [selectedRolePermissions, setSelectedRolePermissions] = useState([]);

  // States pour User
  const [selectedUserRoleIds, setSelectedUserRoleIds] = useState([]);
  const [selectedUserPermIds, setSelectedUserPermIds] = useState([]);

  // Status Permissions State
  // Structure: { resource: { add: '', edit: '', view: '', delete: '' } }
  const [statusConfig, setStatusConfig] = useState({});

  const userId = isUser ? data?.id : null;

  // Fetch all permissions
  const { data: permsResp, isLoading: isLoadingPerms } = useGetPermissionsQuery({ per_page: 1000 }, { skip: !show });
  const allPermissions = useMemo(() => Array.isArray(permsResp) ? permsResp : (permsResp?.data || []), [permsResp]);

  const groupedPermissions = useMemo(() => {
    const groups = {};
    allPermissions.forEach(perm => {
      const permName = perm.name || perm.title || perm.display_name;
      const parts = permName.split('.');
      const groupName = parts.length > 1 ? parts[0] : 'Autres';
      
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(perm);
    });
    return groups;
  }, [allPermissions]);

  // Initialize status config from data
  useEffect(() => {
    if (!show || !data) return;
    
    const parseJSON = (str) => {
      try { return str ? JSON.parse(str) : {}; } catch (e) { return {}; }
    };

    const add = parseJSON(data.status_add_allowed);
    const edit = parseJSON(data.status_edit_allowed);
    const view = parseJSON(data.status_view_allowed);
    const del = parseJSON(data.status_delete_allowed);

    // Merge into resource-centric structure
    const resources = new Set([
      ...Object.keys(add), 
      ...Object.keys(edit), 
      ...Object.keys(view), 
      ...Object.keys(del),
      ...Object.keys(groupedPermissions) // Also include all known resources
    ]);

    const newConfig = {};
    resources.forEach(res => {
      newConfig[res] = {
        add: add[res] || '',
        edit: edit[res] || '',
        view: view[res] || '',
        delete: del[res] || ''
      };
    });
    setStatusConfig(newConfig);
  }, [show, data, groupedPermissions]);

  const toggleStatus = (resource, type, statusValue) => {
    setStatusConfig(prev => {
      const currentStr = prev[resource]?.[type] || '';
      const currentList = currentStr ? currentStr.split(',').map(s => s.trim()).filter(Boolean) : [];
      
      let newList;
      if (currentList.includes(statusValue)) {
        newList = currentList.filter(s => s !== statusValue);
      } else {
        newList = [...currentList, statusValue];
      }
      
      return {
        ...prev,
        [resource]: {
          ...prev[resource],
          [type]: newList.join(',')
        }
      };
    });
  };

  // Fetch roles (for user assignment)
  const { data: rolesResp } = useGetRolesQuery({ per_page: 200, withPermissions: true }, { skip: !show || isRole });
  const roles = useMemo(() => rolesResp?.data || [], [rolesResp]);

  // Fetch user data
  const { data: userRolesResp, isFetching: loadingUserRoles } = useGetUserRolesQuery(userId, { skip: !show || !isUser || !userId });
  const userRoles = useMemo(() => {
    if (!isUser) return [];
    if (Array.isArray(userRolesResp)) return userRolesResp;
    if (Array.isArray(userRolesResp?.data)) return userRolesResp.data;
    if (Array.isArray(userRolesResp?.roles)) return userRolesResp.roles;
    if (Array.isArray(userRolesResp?.data?.roles)) return userRolesResp.data.roles;
    return [];
  }, [isUser, userRolesResp]);

  const { data: userPermsResp, isFetching: loadingUserPerms } = useGetUserPermissionsQuery(userId, { skip: !show || !isUser || !userId });
  const userPerms = useMemo(() => Array.isArray(userPermsResp) ? userPermsResp : (userPermsResp?.data || userPermsResp?.permissions || []), [userPermsResp]);

  // Mutations
  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();
  const [syncRolePerms] = useSyncRolePermissionsMutation();
  const [syncUserRoles] = useSyncUserRolesMutation();
  const [syncUserPermissions] = useSyncUserPermissionsMutation();

  // Initialize role data
  useEffect(() => {
    if (!show) return;
    if (isRole && data) {
      setRoleName(data.name || '');
      const newPerms = data.permissions?.map(p => p.name) || [];
      setSelectedRolePermissions(prev => {
        if (JSON.stringify([...prev].sort()) === JSON.stringify([...newPerms].sort())) return prev;
        return newPerms;
      });
    }
  }, [show, isRole, data]);

  // Initialize user roles
  useEffect(() => {
    if (!show || !isUser) return;
    if (!Array.isArray(userRoles) || userRoles.length === 0) {
      setSelectedUserRoleIds(prev => prev.length === 0 ? prev : []);
      return;
    }
    if (!Array.isArray(roles) || roles.length === 0) return;
    
    const nameToId = new Map(roles.map((r) => [r.name, String(r.id)]));
    const mapped = userRoles
      .map((r) => {
        if (r == null) return null;
        if (typeof r === 'string') return nameToId.get(r) || null;
        if (typeof r === 'object') {
          if (r.id != null) return String(r.id);
          const name = r.name || r.role || r.title;
          if (name) return nameToId.get(name) || null;
        }
        return null;
      })
      .filter(Boolean);
      
    setSelectedUserRoleIds(prev => {
        if (JSON.stringify([...prev].sort()) === JSON.stringify([...mapped].sort())) return prev;
        return mapped;
    });
  }, [show, isUser, userRoles, roles]);

  // Initialize user permissions
  useEffect(() => {
    if (!show || !isUser) return;
    if (!Array.isArray(userPerms) || !Array.isArray(allPermissions) || allPermissions.length === 0) return;
    
    const permNameToId = new Map();
    allPermissions.forEach((p) => {
      const nm = p.name || p.title || p.display_name;
      if (nm) permNameToId.set(nm, String(p.id));
    });

    const effectiveNames = new Set(
      userPerms.map((p) => (typeof p === 'string' ? p : (p?.name || p?.title || p?.display_name))).filter(Boolean)
    );

    const ids = [...effectiveNames]
      .map((nm) => permNameToId.get(nm))
      .filter((v) => v != null);
    
    setSelectedUserPermIds(prev => {
        if (JSON.stringify([...prev].sort()) === JSON.stringify([...ids].sort())) return prev;
        return ids;
    });
  }, [show, isUser, userPerms, allPermissions]);

  // Inherited permissions for user
  const inheritedPermNames = useMemo(() => {
    if (!isUser) return new Set();
    if (!Array.isArray(roles) || roles.length === 0) return new Set();
    const roleById = new Map(roles.map((r) => [String(r.id), r]));
    const names = new Set();
    selectedUserRoleIds.forEach((rid) => {
      const role = roleById.get(String(rid));
      if (role?.permissions) {
        role.permissions.forEach((p) => {
          const nm = p?.name || p?.title || p?.display_name;
          if (nm) names.add(nm);
        });
      }
    });
    return names;
  }, [isUser, roles, selectedUserRoleIds]);

  const roleOptions = useMemo(() => roles.map((r) => ({ id: String(r.id), name: r.name })), [roles]);

  const toggleRolePermission = (permName) => {
    setSelectedRolePermissions((prev) =>
      prev.includes(permName) ? prev.filter((p) => p !== permName) : [...prev, permName]
    );
  };

  const toggleUserRole = (roleId) => {
    setSelectedUserRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const toggleUserPermission = (permId) => {
    setSelectedUserPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      // Prepare status permissions payload
      const statusPayload = {
        status_add_allowed: {},
        status_edit_allowed: {},
        status_view_allowed: {},
        status_delete_allowed: {}
      };

      Object.entries(statusConfig).forEach(([res, conf]) => {
        if (conf.add) statusPayload.status_add_allowed[res] = conf.add;
        if (conf.edit) statusPayload.status_edit_allowed[res] = conf.edit;
        if (conf.view) statusPayload.status_view_allowed[res] = conf.view;
        if (conf.delete) statusPayload.status_delete_allowed[res] = conf.delete;
      });

      // Stringify for backend
      const finalStatusPayload = {
        status_add_allowed: JSON.stringify(statusPayload.status_add_allowed),
        status_edit_allowed: JSON.stringify(statusPayload.status_edit_allowed),
        status_view_allowed: JSON.stringify(statusPayload.status_view_allowed),
        status_delete_allowed: JSON.stringify(statusPayload.status_delete_allowed),
      };

      if (isRole) {
        // Save role
        const payload = {
            name: roleName,
            permissions: selectedRolePermissions,
            ...finalStatusPayload
        };

        if (isEdit) {
          await updateRole({ id: data.id, ...payload }).unwrap();
          // syncRolePerms is redundant if updateRole handles it, but keeping for safety if backend needs it separate
          // Actually RoleController::update handles permissions if passed.
        } else {
          await createRole(payload).unwrap();
        }
      } else if (isUser) {
        // Save user permissions
        const idToName = new Map(roles.map((r) => [String(r.id), r.name]));
        const roleNamesToSend = selectedUserRoleIds.map((id) => idToName.get(String(id))).filter(Boolean);
        const permsToSend = selectedUserPermIds.map((id) => (Number.isNaN(Number(id)) ? id : Number(id)));

        if (can(PERMS.users.rolesSync) || can(PERMS.users.rolesAssign)) {
          await syncUserRoles({ userId, roles: roleNamesToSend }).unwrap();
        }
        if (can(PERMS.users.update)) {
          await syncUserPermissions({ 
              userId, 
              permissions: permsToSend,
              ...finalStatusPayload
          }).unwrap();
        }
      }
      onHide?.();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>
            {isRole ? (isEdit ? 'Modifier le rôle' : 'Nouveau rôle') : `Accès de ${data?.name || data?.email}`}
          </DialogTitle>
          <DialogDescription>
            {isRole 
              ? (isEdit ? 'Modifiez les informations du rôle' : 'Créez un nouveau rôle et attribuez des permissions')
              : `Gérez les permissions de ${data?.name || data?.email}`
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Role Name Input */}
          {isRole && (
            <div className="space-y-2">
              <Label htmlFor="role-name">Nom du rôle</Label>
              <Input
                id="role-name"
                placeholder="Ex: admin, gestionnaire"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                required
              />
            </div>
          )}

          {/* User Roles Section */}
          {isUser && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold">Rôles de l'utilisateur</h3>
              </div>
              
              {loadingUserRoles ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-4 bg-slate-50 rounded-lg">
                  {roleOptions.map((r) => (
                    <div key={r.id} className="flex items-center space-x-2 p-2 bg-white rounded border">
                      <Checkbox
                        id={`role-${r.id}`}
                        checked={selectedUserRoleIds.includes(r.id)}
                        onCheckedChange={() => toggleUserRole(r.id)}
                        disabled={!can(PERMS.users.rolesSync) && !can(PERMS.users.rolesAssign)}
                      />
                      <Label htmlFor={`role-${r.id}`} className="text-sm font-medium cursor-pointer">
                        {r.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Permissions Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Permissions</h3>
              </div>
              <span className="text-sm text-muted-foreground">
                {isRole 
                  ? `${selectedRolePermissions.length} sélectionnée(s)`
                  : `${selectedUserPermIds.length} directe(s)`
                }
              </span>
            </div>

            {isLoadingPerms ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : allPermissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Aucune permission trouvée</div>
            ) : (
              <ScrollArea className="h-96 border rounded-lg p-4 bg-slate-50">
                <div className="space-y-2 pr-4">
                  {Object.entries(groupedPermissions).map(([group, perms]) => {
                    const statusPerms = perms.filter(p => (p.name || p.title || p.display_name).includes('.status.'));
                    const regularPerms = perms.filter(p => !(p.name || p.title || p.display_name).includes('.status.'));

                    const renderPermItem = (perm) => {
                        const permName = perm.name || perm.title || perm.display_name;
                        const permId = String(perm.id);
                        
                        let checked, disabled = false, isInherited = false;
                        
                        if (isRole) {
                          checked = selectedRolePermissions.includes(permName);
                        } else {
                          isInherited = inheritedPermNames.has(permName);
                          checked = isInherited || selectedUserPermIds.includes(permId);
                          disabled = isInherited;
                        }

                        return (
                          <div key={perm.id} className="flex items-start justify-between p-3 bg-white rounded border">
                            <div className="flex items-start space-x-2 flex-1">
                              <Checkbox
                                id={`perm-${perm.id}`}
                                checked={checked}
                                disabled={disabled}
                                onCheckedChange={() => 
                                  isRole ? toggleRolePermission(permName) : toggleUserPermission(permId)
                                }
                              />
                              <Label 
                                htmlFor={`perm-${perm.id}`} 
                                className={`text-sm cursor-pointer ${checked ? 'font-medium text-green-700' : 'text-slate-600'}`}
                              >
                                {permName}
                              </Label>
                            </div>
                            {isUser && isInherited && (
                              <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-xs">
                                via rôle
                              </Badge>
                            )}
                          </div>
                        );
                    };

                    return (
                    <Collapsible key={group} className="border rounded-md bg-white">
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 font-medium hover:bg-slate-50 [&[data-state=open]>svg]:rotate-180">
                        <div className="flex items-center gap-2">
                           <span className="capitalize">{group.replace(/-/g, ' ')}</span>
                           <Badge variant="outline" className="ml-2 bg-indigo-50 text-indigo-700 border-indigo-200">{perms.length}</Badge>
                        </div>
                        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-3 pt-0 border-t">
                        {regularPerms.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                              {regularPerms.map(renderPermItem)}
                            </div>
                        )}

                        {/* Parent accordion for Status Permissions containing four accordions */}
                        <div className="mt-4 pt-2 border-t">
                          <Collapsible>
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-slate-50 rounded hover:bg-slate-100 text-sm font-medium [&[data-state=open]>svg]:rotate-180">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-orange-500" />
                                <span>Permissions de Statut</span>
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  {COMMON_STATUSES.length}
                                </Badge>
                              </div>
                              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-3">
                              <div className="space-y-2">
                                {[
                                  { type: 'view', label: 'Statut à voir', icon: Eye, color: 'text-blue-600' },
                                  { type: 'add', label: 'Statut à ajouter', icon: PlusCircle, color: 'text-green-600' },
                                  { type: 'edit', label: 'Statut à modifier', icon: Edit3, color: 'text-amber-600' },
                                  { type: 'delete', label: 'Statut à supprimer', icon: Trash2, color: 'text-red-600' }
                                ].map(({ type, label, icon: Icon, color }) => (
                                  <Collapsible key={type} className="border rounded bg-white">
                                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-sm hover:bg-slate-50">
                                      <div className="flex items-center gap-2">
                                        <Icon className={`h-4 w-4 ${color}`} />
                                        <span>{label}</span>
                                        <Badge variant="secondary" className="ml-2 text-xs">
                                          {(statusConfig[group]?.[type] || '').split(',').filter(Boolean).length}
                                        </Badge>
                                      </div>
                                      <ChevronDown className="h-3 w-3 text-slate-400" />
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="p-2 border-t bg-slate-50/30">
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {COMMON_STATUSES.map(status => {
                                          const currentList = (statusConfig[group]?.[type] || '').split(',').map(s => s.trim());
                                          const isChecked = currentList.includes(status.value);
                                          return (
                                            <div key={status.value} className="flex items-center space-x-2">
                                              <Checkbox 
                                                id={`${group}-${type}-${status.value}`}
                                                checked={isChecked}
                                                onCheckedChange={() => toggleStatus(group, type, status.value)}
                                              />
                                              <Label htmlFor={`${group}-${type}-${status.value}`} className="text-xs cursor-pointer">
                                                {status.label}
                                              </Label>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onHide} 
              disabled={saving}
              className="w-full md:w-1/2"
            >
              {isUser ? 'Fermer' : 'Annuler'}
            </Button>
            <Button 
              type="submit" 
              disabled={saving}
              className="w-full md:w-1/2"
            >
              {saving ? 'Enregistrement...' : (isRole ? (isEdit ? 'Enregistrer' : 'Créer') : 'Sauvegarder')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
