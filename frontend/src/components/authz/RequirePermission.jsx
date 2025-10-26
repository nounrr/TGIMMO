import useAuthz from '../../hooks/useAuthz';

// Supports permission-based and role-based checks.
// Usage examples:
// <RequirePermission perm="unites.view">...</RequirePermission>
// <RequirePermission role="admin">...</RequirePermission>
// <RequirePermission anyOf={["locataires.view","unites.view"]} />
// <RequirePermission anyRoles={["admin","manager"]} />
// If both permission and role props are provided, access is granted if EITHER group passes.
export default function RequirePermission({
  perm,
  anyOf = [],
  allOf = [],
  role,
  anyRoles = [],
  allRoles = [],
  fallback = null,
  children,
}) {
  const { can, canAny, canAll, hasRole } = useAuthz();

  // Evaluate permission group
  let permProvided = Boolean(perm || (anyOf && anyOf.length) || (allOf && allOf.length));
  let permAllowed = false;
  if (permProvided) {
    permAllowed = true;
    if (perm) permAllowed = can(perm);
    if (permAllowed && anyOf.length) permAllowed = canAny(anyOf);
    if (permAllowed && allOf.length) permAllowed = canAll(allOf);
  }

  // Evaluate role group
  let roleProvided = Boolean(role || (anyRoles && anyRoles.length) || (allRoles && allRoles.length));
  let roleAllowed = false;
  if (roleProvided) {
    roleAllowed = true;
    if (role) roleAllowed = hasRole(role);
    if (roleAllowed && anyRoles.length) roleAllowed = anyRoles.some((r) => hasRole(r));
    if (roleAllowed && allRoles.length) roleAllowed = allRoles.every((r) => hasRole(r));
  }

  // If both groups provided, allow if either passes. If only one provided, use that. If none, allow.
  const hasAnyGroup = permProvided || roleProvided;
  const allowed = hasAnyGroup ? (permAllowed || roleAllowed) : true;

  if (!allowed) return fallback;
  return typeof children === 'function' ? children() : children;
}
