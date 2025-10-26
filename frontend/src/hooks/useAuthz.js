import { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useMeQuery } from '../features/auth/authApi';

export default function useAuthz() {
  // Prefer live /me over stale store, fallback to store user
  const authUser = useSelector((state) => state.auth?.user);
  const { data: me } = useMeQuery(undefined, { refetchOnMountOrArgChange: true });
  const user = me || authUser;

  // Normalize roles/permissions to arrays of strings (names)
  const roleNames = useMemo(() => {
    const raw = user?.roles || [];
    if (!Array.isArray(raw)) return [];
    return raw
      .map((r) => (typeof r === 'string' ? r : r?.name))
      .filter(Boolean);
  }, [user?.roles]);

  // Direct user permissions (not including those inherited by roles)
  const directPermissionNames = useMemo(() => {
    const raw = user?.permissions || [];
    if (!Array.isArray(raw)) return [];
    return raw
      .map((p) => (typeof p === 'string' ? p : p?.name))
      .filter(Boolean);
  }, [user?.permissions]);

  // Permissions inherited from roles (if roles include their permissions)
  const rolePermissionNames = useMemo(() => {
    const rawRoles = user?.roles || [];
    if (!Array.isArray(rawRoles)) return [];
    const perms = [];
    rawRoles.forEach((r) => {
      const roleObj = typeof r === 'object' ? r : null;
      const rolePerms = roleObj?.permissions || [];
      if (Array.isArray(rolePerms)) {
        rolePerms.forEach((p) => {
          const name = typeof p === 'string' ? p : p?.name;
          if (name) perms.push(name);
        });
      }
    });
    return perms;
  }, [user?.roles]);

  // Effective permissions = direct + role-derived
  const permissionNames = useMemo(() => {
    const set = new Set([...(directPermissionNames || []), ...(rolePermissionNames || [])]);
    return Array.from(set);
  }, [directPermissionNames, rolePermissionNames]);

  const hasRole = useCallback((roleName) => {
    if (!roleName) return false;
    return roleNames.includes(roleName);
  }, [roleNames]);

  const can = useCallback((permission) => {
    if (!permission) return false;
    return permissionNames.includes(permission);
  }, [permissionNames]);

  const canAny = useCallback((perms = []) => perms.some((p) => permissionNames.includes(p)), [permissionNames]);
  const canAll = useCallback((perms = []) => perms.every((p) => permissionNames.includes(p)), [permissionNames]);

  return useMemo(
    () => ({
      user,
      roles: roleNames,
      permissions: permissionNames, // effective
      directPermissions: directPermissionNames,
      rolePermissions: rolePermissionNames,
      hasRole,
      can,
      canAny,
      canAll,
    }),
    [user, roleNames, permissionNames, directPermissionNames, rolePermissionNames, hasRole, can, canAny, canAll]
  );
}
