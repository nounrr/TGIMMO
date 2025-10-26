import { useEffect, useMemo, useState } from 'react';
import { 
  useCreateRoleMutation, 
  useUpdateRoleMutation, 
  useGetPermissionsQuery,
  useSyncRolePermissionsMutation
} from '../../features/roles/rolesApi';

export default function RoleFormModal({ show, onHide, role }) {
  const isEdit = !!role?.id;
  const [name, setName] = useState(role?.name || '');
  const [selectedPermissions, setSelectedPermissions] = useState(role?.permissions?.map(p => p.name) || []);

  const { data: permissionsResp, isLoading: isLoadingPerms } = useGetPermissionsQuery({ per_page: 200, q: '' }, { skip: !show });
  const permissions = useMemo(() => permissionsResp?.data || [], [permissionsResp?.data]);

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [syncPerms, { isLoading: isSyncing }] = useSyncRolePermissionsMutation();

  useEffect(() => {
    if (show) {
      setName(role?.name || '');
      setSelectedPermissions(role?.permissions?.map(p => p.name) || []);
    }
  }, [show, role]);

  const handleTogglePermission = (permName) => {
    setSelectedPermissions((prev) =>
      prev.includes(permName) ? prev.filter((p) => p !== permName) : [...prev, permName]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        // Update name and then sync permissions
        await updateRole({ id: role.id, name }).unwrap();
        await syncPerms({ id: role.id, permissions: selectedPermissions }).unwrap();
      } else {
        await createRole({ name, permissions: selectedPermissions }).unwrap();
      }
      onHide?.();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du rôle:', err);
    }
  };

  if (!show) return null;

  const busy = isCreating || isUpdating || isSyncing;

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onHide}>
      <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
          {/* Header */}
          <div className="modal-header border-0" style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: 'white' }}>
            <h5 className="modal-title fw-bold mb-0">{isEdit ? 'Modifier le rôle' : 'Nouveau rôle'}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onHide} disabled={busy}></button>
          </div>

          {/* Body */}
          <form id="role-form" onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <div className="mb-4">
                <label className="form-label fw-semibold">Nom du rôle</label>
                <input
                  type="text"
                  className="form-control form-control-lg rounded-3"
                  placeholder="Ex: admin, gestionnaire"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <label className="form-label fw-semibold mb-0">Permissions</label>
                  <small className="text-muted">{selectedPermissions.length} sélectionnée(s)</small>
                </div>
                <div className="border rounded-3 p-3" style={{ maxHeight: 300, overflowY: 'auto', background: '#f8fafc' }}>
                  {isLoadingPerms ? (
                    <div className="text-center py-5 text-muted">Chargement des permissions...</div>
                  ) : permissions.length === 0 ? (
                    <div className="text-center py-5 text-muted">Aucune permission trouvée.</div>
                  ) : (
                    <div className="row g-2">
                      {permissions.map((perm) => {
                        const checked = selectedPermissions.includes(perm.name);
                        return (
                          <div className="col-12 col-md-6" key={perm.id}>
                            <label className="d-flex align-items-center gap-2 form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={checked}
                                onChange={() => handleTogglePermission(perm.name)}
                              />
                              <span className="form-check-label">{perm.name}</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="modal-footer border-0 bg-light">
            <button type="button" className="btn btn-secondary" onClick={onHide} disabled={busy}>Annuler</button>
            <button type="submit" className="btn btn-primary" form="role-form" disabled={busy}>
              {busy ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Enregistrement...
                </>
              ) : (
                isEdit ? 'Enregistrer' : 'Créer'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
