import { useEffect, useMemo, useState } from 'react';
import { useGetRolesQuery } from '../../features/roles/rolesApi';
import { useGetUserRolesQuery, useGetUserPermissionsQuery, useSyncUserRolesMutation, useGetPermissionsQuery, useSyncUserPermissionsMutation } from '../../features/roles/rolesApi';
import useAuthz from '../../hooks/useAuthz';
import { PERMS } from '../../utils/permissionKeys';

export default function UserAccessModal({ show, onHide, user }) {
  const { can } = useAuthz();
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const userId = user?.id;

  // Fetch roles (large page size to list all)
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

  // Fetch all permissions to display full list regardless of user assignment
  const { data: allPermsResp, isFetching: loadingAllPerms } = useGetPermissionsQuery({ per_page: 1000 }, { skip: !show });
  const allPerms = Array.isArray(allPermsResp) ? allPermsResp : (allPermsResp?.data || []);

  useEffect(() => {
    if (!show) return;
    if (!Array.isArray(userRoles)) return;
    if (userRoles.length === 0) {
      setSelectedRoleIds([]);
      return;
    }
    // Build a quick name->id map from roles list (avoid referencing roleOptions before init)
    if (!Array.isArray(roles) || roles.length === 0) return; // wait until roles list is loaded
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

  // Permissions selection state (direct permissions)
  const [selectedPermIds, setSelectedPermIds] = useState([]);

  // Compute inherited permissions from currently selected roles (using roles withPermissions)
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

  // Map of permission name -> id from allPerms for stable reference
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

  // Initialize direct permissions selection on first open when data is ready
  const [directInitDone, setDirectInitDone] = useState(false);
  useEffect(() => {
    if (!show || directInitDone) return;
    if (!Array.isArray(userPerms)) return;
    if (!Array.isArray(allPerms) || allPerms.length === 0) return;
    // effective user perms by name
    const effectiveNames = new Set(
      userPerms.map((p) => (typeof p === 'string' ? p : (p?.name || p?.title || p?.display_name))).filter(Boolean)
    );
    // direct = effective - inherited
    const directNames = [...effectiveNames].filter((nm) => !inheritedPermNames.has(nm));
    const ids = directNames
      .map((nm) => permNameToId.get(nm))
      .filter((v) => v != null)
      .map((id) => (String(id)));
    setSelectedPermIds(ids);
    setDirectInitDone(true);
  }, [show, userPerms, allPerms, inheritedPermNames, permNameToId, directInitDone]);

  // When roles change, drop any direct selections that became inherited
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
      // Prepare roles payload as NAMES (backend expects strings)
      const idToName = new Map((roles || []).map((r) => [String(r.id), r.name]));
      const roleNamesToSend = selectedRoleIds
        .map((id) => idToName.get(String(id)))
        .filter(Boolean);

      const permsToSend = selectedPermIds.map((id) => (Number.isNaN(Number(id)) ? id : Number(id)));

      // Conditionally sync roles if user has capability
      if (can(PERMS.users.rolesSync) || can(PERMS.users.rolesAssign)) {
        await syncUserRoles({ userId, roles: roleNamesToSend }).unwrap();
      }
      // Always sync direct user permissions when allowed by users.update
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

  if (!show || !user) return null;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1040 }} onClick={onHide} />
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }} onClick={onHide}>
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
            <div className="modal-header border-0 pb-0 px-4 pt-4">
              <div>
                <h5 className="modal-title fw-bold mb-1" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.5rem' }}>
                  Accès de l'utilisateur
                </h5>
                <p className="text-muted small mb-0">Gérez les permissions de {user.name || user.email}</p>
              </div>
              <button type="button" className="btn-close" onClick={onHide} style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f1f5f9', opacity: 1, transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
              />
            </div>

            <div className="modal-body px-4 py-4">
              <div className="row g-4">
                {/* Rôles assignés (optionnel) */}
                <div className="col-12">
                  <div className="card border-0 rounded-4 h-100" style={{ background: 'rgba(99, 102, 241, 0.05)' }}>
                    <div className="card-body p-4">
                      <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#4338ca' }}>
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                          <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
                        </svg>
                        Rôles de l'utilisateur
                      </h6>

                      {loadingUserRoles ? (
                        <div className="text-muted small">Chargement des rôles...</div>
                      ) : (
                        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-2" style={{ maxHeight: 260, overflow: 'auto' }}>
                          {roleOptions.map((r) => (
                            <div className="col" key={r.id}>
                              <label className="d-flex align-items-center gap-2 p-2 rounded-3 w-100" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                                <input
                                  type="checkbox"
                                  className="form-check-input m-0"
                                  checked={selectedRoleIds.includes(r.id)}
                                  onChange={() => toggleRole(r.id)}
                                  disabled={!can(PERMS.users.rolesSync) && !can(PERMS.users.rolesAssign)}
                                />
                                <span className="fw-medium small">{r.name}</span>
                              </label>
                            </div>
                          ))}
                          {roleOptions.length === 0 && (
                            <div className="text-muted small">Aucun rôle disponible.</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Permissions effectives */}
                <div className="col-12">
                  <div className="card border-0 rounded-4 h-100" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                    <div className="card-body p-4">
                      <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#059669' }}>
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1H2zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7z"/>
                        </svg>
                        Permissions
                      </h6>

                      {loadingUserPerms || loadingAllPerms ? (
                        <div className="text-muted small">Chargement des permissions...</div>
                      ) : (
                        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3" style={{ maxHeight: 480, overflow: 'auto' }}>
                          {(Array.isArray(allPerms) && allPerms.length > 0) ? (
                            (() => {
                              return allPerms.map((p, idx) => {
                                const key = (p && (p.id ?? p.name ?? p.title ?? p.display_name)) ?? `perm-${idx}`;
                                const label = (p && (p.title || p.display_name || p.name)) || (typeof p === 'string' ? p : String(key));
                                const permName = typeof p === 'string' ? p : (p?.name || label);
                                const inherited = inheritedPermNames.has(permName);
                                const directChecked = selectedPermIds.includes(String(p.id));
                                const checked = inherited ? true : directChecked;
                                return (
                                  <div className="col" key={key}>
                                    <label className="d-block p-3 rounded-3 h-100" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                                      <div className="d-flex align-items-start justify-content-between">
                                        <div className="form-check d-flex align-items-start">
                                          <input
                                            type="checkbox"
                                            className="form-check-input mt-0"
                                            checked={checked}
                                            disabled={inherited}
                                            onChange={() => togglePerm(String(p.id))}
                                          />
                                          <span className="ms-2 fw-medium small" style={{ color: checked ? '#065f46' : '#64748b' }}>{label}</span>
                                        </div>
                                        {inherited && (
                                          <span className="badge rounded-pill" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>via rôle</span>
                                        )}
                                      </div>
                                    </label>
                                  </div>
                                );
                              });
                            })()
                          ) : (
                            <div className="text-muted small">Aucune permission trouvée.</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-0 px-4 pb-4">
              <button type="button" className="btn px-4 fw-semibold" onClick={onHide}
                style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', transition: 'all 0.2s', padding: '0.5rem 1.25rem' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Fermer
              </button>
              {can(PERMS.users.update) || can(PERMS.users.rolesAssign) || can(PERMS.users.rolesSync) ? (
                <button type="button" className="btn px-4 text-white fw-semibold shadow-sm d-flex align-items-center gap-2"
                  disabled={saving}
                  onClick={handleSave}
                  style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', border: 'none', borderRadius: '8px', transition: 'all 0.3s', padding: '0.5rem 1.25rem' }}
                  onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(37, 99, 235, 0.3)'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M15.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L8.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                      </svg>
                      <span>Sauvegarder</span>
                    </>
                  )}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
