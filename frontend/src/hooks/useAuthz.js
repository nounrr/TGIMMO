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
  // Support multiple possible field names: permissions, all_permissions, permission_names
  const directPermissionNames = useMemo(() => {
    const candidates = [user?.permissions, user?.all_permissions, user?.permission_names];
    let raw = candidates.find((c) => Array.isArray(c)) || [];
    return raw
      .map((p) => (typeof p === 'string' ? p : p?.name))
      .filter(Boolean)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
  }, [user?.permissions, user?.all_permissions, user?.permission_names]);

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
          if (name) perms.push(name.trim());
        });
      }
    });
    return perms.filter((n) => n.length > 0);
  }, [user?.roles]);

  // Effective permissions = direct + role-derived
  // Effective permissions; allow backend to send aggregated 'all_permissions' as strings
  const permissionNames = useMemo(() => {
    const aggregated = user?.all_permissions;
    if (Array.isArray(aggregated) && aggregated.every((p) => typeof p === 'string' || (p && typeof p === 'object'))) {
      const normalized = aggregated
        .map((p) => (typeof p === 'string' ? p : p?.name))
        .filter(Boolean)
        .map((n) => n.trim())
        .filter((n) => n.length > 0);
      if (normalized.length > 0) {
        return Array.from(new Set(normalized));
      }
    }
    const set = new Set([...(directPermissionNames || []), ...(rolePermissionNames || [])]);
    return Array.from(set).map((n) => n.trim()).filter((n) => n.length > 0);
  }, [directPermissionNames, rolePermissionNames, user?.all_permissions]);

  const hasRole = useCallback((roleName) => {
    if (!roleName) return false;
    return roleNames.includes(roleName);
  }, [roleNames]);

  const can = useCallback((permission) => {
    if (!permission) return false;
    const needle = permission.trim();
    if (permissionNames.includes(needle)) return true;
    // Hyphen/underscore normalization (legacy mismatch support)
    const altHyphen = needle.includes('_') ? needle.replace(/_/g, '-') : null;
    const altUnderscore = needle.includes('-') ? needle.replace(/-/g, '_') : null;
    if (altHyphen && permissionNames.includes(altHyphen)) return true;
    if (altUnderscore && permissionNames.includes(altUnderscore)) return true;
    // Fallback: ignore whitespace differences
    const compactNeedle = needle.replace(/\s+/g, '');
    return permissionNames.some((p) => p.replace(/\s+/g, '') === compactNeedle);
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
