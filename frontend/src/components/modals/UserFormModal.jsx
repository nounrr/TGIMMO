import { useEffect, useMemo, useState } from 'react';
import { useCreateUserMutation, useUpdateUserMutation } from '../../features/users/usersApi';
import { useGetRolesQuery, useSyncUserRolesMutation } from '../../features/roles/rolesApi';

export default function UserFormModal({ show, onHide, user }) {
  const isEdit = !!user?.id;
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [telephoneInterne, setTelephoneInterne] = useState(user?.telephone_interne || '');
  const [fonction, setFonction] = useState(user?.fonction || '');
  const [service, setService] = useState(user?.service || '');
  const [statut, setStatut] = useState(user?.statut || 'actif');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState(user?.roles?.map((r) => r.id) || []);

  const { data: rolesResp } = useGetRolesQuery({ per_page: 100 });
  const roles = useMemo(() => rolesResp?.data || [], [rolesResp?.data]);

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [syncUserRoles, { isLoading: isSyncing }] = useSyncUserRolesMutation();

  useEffect(() => {
    if (!show) return;
    setName(user?.name || '');
    setEmail(user?.email || '');
    setTelephoneInterne(user?.telephone_interne || '');
    setFonction(user?.fonction || '');
    setService(user?.service || '');
    setStatut(user?.statut || 'actif');
    setPassword('');
    setSelectedRoles(user?.roles?.map((r) => r.id) || []);
  }, [show, user]);

  const onToggleRole = (roleId) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let saved;
      if (isEdit) {
        const payload = { id: user.id, name, email, telephone_interne: telephoneInterne, fonction: fonction || null, service: service || null, statut };
        if (password) {
          payload.password = password;
        }
        saved = await updateUser(payload).unwrap();
      } else {
        const payload = { name, email, telephone_interne: telephoneInterne, fonction: fonction || null, service: service || null };
        // Assign at least one role directly at creation (backend supports single 'role')
        if (selectedRoles.length > 0) {
          payload.role = selectedRoles[0];
        }
        if (password) {
          payload.password = password;
        }
        saved = await createUser(payload).unwrap();
      }

      // Sync roles if any were selected
      const userId = (saved?.data?.id) || user?.id || saved?.id;
      if (userId) {
        await syncUserRoles({ userId, roles: selectedRoles }).unwrap();
      }

      onHide?.();
    } catch (err) {
      console.error('Save user failed', err);
    }
  };

  if (!show) return null;

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content rounded-4 border-0 shadow-lg">
          <div className="modal-header border-0">
            <h5 className="modal-title fw-bold">
              {isEdit ? 'Modifier un employé' : 'Nouvel employé'}
            </h5>
            <button type="button" className="btn-close" onClick={onHide} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nom complet</label>
                  <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Fonction</label>
                  <input className="form-control" value={fonction} onChange={(e) => setFonction(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Service</label>
                  <input className="form-control" value={service} onChange={(e) => setService(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Téléphone interne</label>
                  <input className="form-control" value={telephoneInterne} onChange={(e) => setTelephoneInterne(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Mot de passe {isEdit && <small className="text-muted">(laisser vide pour ne pas changer)</small>}</label>
                  <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {isEdit && (
                  <div className="col-md-6">
                    <label className="form-label">Statut</label>
                    <select className="form-select" value={statut} onChange={(e) => setStatut(e.target.value)}>
                      <option value="actif">Actif</option>
                      <option value="inactif">Inactif</option>
                    </select>
                  </div>
                )}
                <div className="col-12">
                  <label className="form-label fw-semibold mb-1">Rôles</label>
                  <div className="d-flex flex-wrap gap-2">
                    {roles.map((r) => {
                      const checked = selectedRoles.includes(r.id);
                      return (
                        <button type="button"
                          key={r.id}
                          onClick={() => onToggleRole(r.id)}
                          className={`btn btn-sm ${checked ? 'btn-primary' : 'btn-outline-secondary'}`}
                        >
                          {r.name}
                        </button>
                      );
                    })}
                    {roles.length === 0 && (
                      <div className="text-muted small">Aucun rôle disponible</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-light" onClick={onHide}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={isCreating || isUpdating || isSyncing}>
                {isEdit ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
