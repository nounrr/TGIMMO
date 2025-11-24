import { useEffect, useMemo, useState } from 'react';
import { useGetRolesQuery } from '../../features/roles/rolesApi';
import { useGetUserRolesQuery, useGetUserPermissionsQuery, useSyncUserRolesMutation, useGetPermissionsQuery, useSyncUserPermissionsMutation } from '../../features/roles/rolesApi';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Key } from 'lucide-react';
import useAuthz from '../../hooks/useAuthz';
import { PERMS } from '../../utils/permissionKeys';

export default function UserAccessModalShadcn({ show, onHide, user }) {
  const { can } = useAuthz();
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const userId = user?.id;

  // Fetch roles
  const { data: rolesResp } = useGetRolesQuery({ per_page: 200, withPermissions: true }, { skip: !show });
  const roles = rolesResp?.data || [];

  // Fetch user roles and permissions
  const { data: userRolesResp, isFetching: loadingUserRoles } = useGetUserRolesQuery(userId, { skip: !show || !userId });
  const userRoles = (() => {
    if (Array.isArray(userRolesResp)) return userRolesResp;
    if (Array.isArray(userRolesResp?.data)) return userRolesResp.data;
    if (Array.isArray(userRolesResp?.roles)) return userRolesResp.roles;
    if (Array.isArray(userRolesResp?.data?.roles)) return userRolesResp.data.roles;
    return [];
  })();
  
  const { data: userPermsResp, isFetching: loadingUserPerms } = useGetUserPermissionsQuery(userId, { skip: !show || !userId });
  const userPerms = Array.isArray(userPermsResp) ? userPermsResp : (userPermsResp?.data || userPermsResp?.permissions || []);

  // Fetch all permissions
  const { data: allPermsResp, isFetching: loadingAllPerms } = useGetPermissionsQuery({ per_page: 1000 }, { skip: !show });
  const allPerms = Array.isArray(allPermsResp) ? allPermsResp : (allPermsResp?.data || []);

  useEffect(() => {
    if (!show) return;
    if (!Array.isArray(userRoles)) return;
    if (userRoles.length === 0) {
      setSelectedRoleIds([]);
      return;
    }
    if (!Array.isArray(roles) || roles.length === 0) return;
    const nameToId = new Map(roles.map((r) => [r.name, String(r.id)]));

    const mapped = userRoles
      .map((r) => {
        if (r == null) return null;
        if (typeof r === 'string') {
          return nameToId.get(r) || null;
        }
        if (typeof r === 'object') {
          if (r.id != null) return String(r.id);
          const name = r.name || r.role || r.title;
          if (name) return nameToId.get(name) || null;
        }
        return null;
      })
      .filter(Boolean);
    setSelectedRoleIds(mapped);
  }, [show, userRoles, roles]);

  const [syncUserRoles] = useSyncUserRolesMutation();
  const [syncUserPermissions] = useSyncUserPermissionsMutation();

  const roleOptions = useMemo(() => roles.map((r) => ({ id: String(r.id), name: r.name })), [roles]);

  const [selectedPermIds, setSelectedPermIds] = useState([]);
  const [directInitDone, setDirectInitDone] = useState(false);

  // Reset init state when modal closes
  useEffect(() => {
    if (!show) {
      setDirectInitDone(false);
    }
  }, [show]);

  const inheritedPermNames = useMemo(() => {
    if (!Array.isArray(roles) || roles.length === 0) return new Set();
    const roleById = new Map(roles.map((r) => [String(r.id), r]));
    const names = new Set();
    selectedRoleIds.forEach((rid) => {
      const role = roleById.get(String(rid));
      if (role?.permissions) {
        role.permissions.forEach((p) => {
          const nm = p?.name || p?.title || p?.display_name;
          if (nm) names.add(nm);
        });
      }
    });
    return names;
  }, [roles, selectedRoleIds]);

  const permNameToId = useMemo(() => {
    const m = new Map();
    if (Array.isArray(allPerms)) {
      allPerms.forEach((p) => {
        if (!p) return;
        const nm = p.name || p.title || p.display_name;
        if (nm) m.set(nm, p.id);
      });
    }
    return m;
  }, [allPerms]);

  useEffect(() => {
    if (!show || directInitDone) return;
    if (!Array.isArray(userPerms) || userPerms.length === 0) {
      setSelectedPermIds([]);
      setDirectInitDone(true);
      return;
    }
    if (!Array.isArray(allPerms) || allPerms.length === 0) return;
    
    const effectiveNames = new Set(
      userPerms.map((p) => (typeof p === 'string' ? p : (p?.name || p?.title || p?.display_name))).filter(Boolean)
    );
    const directNames = [...effectiveNames].filter((nm) => !inheritedPermNames.has(nm));
    const ids = directNames
      .map((nm) => permNameToId.get(nm))
      .filter((v) => v != null)
      .map((id) => (String(id)));
    setSelectedPermIds(ids);
    setDirectInitDone(true);
  }, [show, userPerms, allPerms, inheritedPermNames, permNameToId, directInitDone]);

  useEffect(() => {
    if (!show) return;
    if (!Array.isArray(allPerms) || allPerms.length === 0) return;
    if (selectedPermIds.length === 0) return;
    const idToName = new Map(allPerms.map((p) => [String(p.id), p.name || p.title || p.display_name]));
    const filtered = selectedPermIds.filter((id) => {
      const nm = idToName.get(String(id));
      return nm ? !inheritedPermNames.has(nm) : true;
    });
    if (filtered.length !== selectedPermIds.length) setSelectedPermIds(filtered);
  }, [show, inheritedPermNames, allPerms, selectedPermIds]);

  const togglePerm = (permId) => {
    setSelectedPermIds((prev) => (prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]));
  };

  const toggleRole = (roleId) => {
    setSelectedRoleIds((prev) => (prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]));
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const idToName = new Map((roles || []).map((r) => [String(r.id), r.name]));
      const roleNamesToSend = selectedRoleIds
        .map((id) => idToName.get(String(id)))
        .filter(Boolean);

      const permsToSend = selectedPermIds.map((id) => (Number.isNaN(Number(id)) ? id : Number(id)));

      if (can(PERMS.users.rolesSync) || can(PERMS.users.rolesAssign)) {
        await syncUserRoles({ userId, roles: roleNamesToSend }).unwrap();
      }
      if (can(PERMS.users.update)) {
        await syncUserPermissions({ userId, permissions: permsToSend }).unwrap();
      }
      onHide();
    } catch (e) {
      console.error('Sync access failed', e);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl">Accès de l'utilisateur</DialogTitle>
          <DialogDescription>
            Gérez les permissions de {user.name || user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rôles Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-semibold">Rôles de l'utilisateur</h3>
            </div>
            
            {loadingUserRoles ? (
              <p className="text-sm text-muted-foreground">Chargement des rôles...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-4 bg-slate-50 rounded-lg">
                {roleOptions.map((r) => (
                  <div key={r.id} className="flex items-center space-x-2 p-2 bg-white rounded border">
                    <Checkbox
                      id={`role-${r.id}`}
                      checked={selectedRoleIds.includes(r.id)}
                      onCheckedChange={() => toggleRole(r.id)}
                      disabled={!can(PERMS.users.rolesSync) && !can(PERMS.users.rolesAssign)}
                    />
                    <Label htmlFor={`role-${r.id}`} className="text-sm font-medium cursor-pointer">
                      {r.name}
                    </Label>
                  </div>
                ))}
                {roleOptions.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-3">Aucun rôle disponible.</p>
                )}
              </div>
            )}
          </div>

          {/* Permissions Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Permissions</h3>
            </div>

            {loadingUserPerms || loadingAllPerms ? (
              <p className="text-sm text-muted-foreground">Chargement des permissions...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-4 bg-slate-50 rounded-lg">
                {(Array.isArray(allPerms) && allPerms.length > 0) ? (
                  allPerms.map((p, idx) => {
                    const key = (p && (p.id ?? p.name ?? p.title ?? p.display_name)) ?? `perm-${idx}`;
                    const label = (p && (p.title || p.display_name || p.name)) || (typeof p === 'string' ? p : String(key));
                    const permName = typeof p === 'string' ? p : (p?.name || label);
                    const inherited = inheritedPermNames.has(permName);
                    const directChecked = selectedPermIds.includes(String(p.id));
                    const checked = inherited ? true : directChecked;
                    
                    return (
                      <div key={key} className="flex items-start justify-between p-3 bg-white rounded border">
                        <div className="flex items-start space-x-2 flex-1">
                          <Checkbox
                            id={`perm-${p.id}`}
                            checked={checked}
                            disabled={inherited}
                            onCheckedChange={() => togglePerm(String(p.id))}
                          />
                          <Label 
                            htmlFor={`perm-${p.id}`} 
                            className={`text-sm cursor-pointer ${checked ? 'font-medium text-green-700' : 'text-slate-600'}`}
                          >
                            {label}
                          </Label>
                        </div>
                        {inherited && (
                          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-xs">
                            via rôle
                          </Badge>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground col-span-3">Aucune permission trouvée.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onHide} className="w-full md:w-1/2">
            Fermer
          </Button>
          {(can(PERMS.users.update) || can(PERMS.users.rolesAssign) || can(PERMS.users.rolesSync)) && (
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full md:w-1/2"
            >
              {saving ? 'Enregistrement...' : 'Sauvegarder'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
