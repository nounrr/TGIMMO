import { useMemo, useState } from 'react';
import {
  useGetRolesQuery,
  useDeleteRoleMutation,
  useGetPermissionsQuery,
} from '../features/roles/rolesApi';
import { useGetUsersQuery } from '../features/users/usersApi';
import RoleFormModal from '../components/modals/RoleFormModal';
import DeleteConfirmModal from '../components/modals/DeleteConfirmModal';
import UserAccessModal from '../components/modals/UserAccessModal';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';

export default function RolesPermissions() {
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
  const { data: rolesResp, isLoading: isLoadingRoles, error: rolesError } = useGetRolesQuery(rolesParams);

  // Permissions state (for tab 2)
  const [searchPerm, setSearchPerm] = useState('');
  const [paginationPerms, setPaginationPerms] = useState({ pageIndex: 0, pageSize: 10 });
  const permsParams = useMemo(() => ({
    page: paginationPerms.pageIndex + 1,
    per_page: paginationPerms.pageSize,
    q: searchPerm || undefined,
  }), [paginationPerms, searchPerm]);
  const { data: permsResp, isLoading: isLoadingPerms } = useGetPermissionsQuery(permsParams, { skip: activeTab !== 'permissions' });

  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();

  // Modal state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Users tab state
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
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const roles = rolesResp?.data || [];
  const rolesPagination = {
    page: rolesResp?.current_page || 1,
    lastPage: rolesResp?.last_page || 1,
    total: rolesResp?.total || 0,
  };

  const permissions = permsResp?.data || [];
  const permsPagination = {
    page: permsResp?.current_page || 1,
    lastPage: permsResp?.last_page || 1,
    total: permsResp?.total || 0,
  };

  const handleAddRole = () => {
    setSelectedRole(null);
    setShowRoleModal(true);
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setShowRoleModal(true);
  };

  const handleDeleteClick = (role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
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
    <div className="p-3 p-lg-4" style={{ width: '100%' }}>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1" style={{
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Rôles & Permissions
          </h1>
          <p className="text-muted mb-0">Gérez les rôles, les permissions et leurs affectations</p>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        {can(PERMS.roles.view) && (
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => setActiveTab('roles')}>Rôles</button>
          </li>
        )}
        {can(PERMS.permissions.view) && (
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'permissions' ? 'active' : ''}`} onClick={() => setActiveTab('permissions')}>Permissions</button>
          </li>
        )}
        {can(PERMS.users.view) && (
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Utilisateurs</button>
          </li>
        )}
      </ul>

      {activeTab === 'roles' && can(PERMS.roles.view) && (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-4">
            {/* Top actions */}
            <div className="d-flex flex-column flex-md-row gap-3 justify-content-between align-items-stretch align-items-md-center mb-3">
              <div className="flex-grow-1">
                <div className="position-relative">
                  <svg className="position-absolute top-50 translate-middle-y" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" style={{ left: '16px', opacity: 0.5, pointerEvents: 'none', zIndex: 10 }}>
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                  </svg>
                  <input
                    type="text"
                    className="form-control form-control-lg ps-5 rounded-3 border-0 shadow-sm"
                    placeholder="Rechercher un rôle..."
                    value={searchRole}
                    onChange={(e) => setSearchRole(e.target.value)}
                    style={{ background: '#f8f9fa', paddingLeft: '3rem' }}
                  />
                </div>
              </div>
              <div>
                {can(PERMS.roles.create) && (
                <button className="btn btn-lg text-white fw-semibold shadow d-flex align-items-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '12px 24px'
                        }}
                        onClick={handleAddRole}>
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                  </svg>
                  Nouveau rôle
                </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th className="text-center">Permissions</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingRoles ? (
                    <tr>
                      <td colSpan={3} className="text-center text-muted py-5">Chargement des rôles...</td>
                    </tr>
                  ) : roles.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center text-muted py-5">Aucun rôle trouvé.</td>
                    </tr>
                  ) : roles.map((r) => (
                    <tr key={r.id}>
                      <td className="fw-semibold">{r.name}</td>
                      <td className="text-center">
                        {r.permissions?.length ? (
                          <span className="badge rounded-pill bg-indigo-100 text-indigo-700" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>
                            {r.permissions.length} permission(s)
                          </span>
                        ) : (
                          <span className="badge rounded-pill bg-light text-muted">0</span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          {can(PERMS.roles.update) && (
                          <button 
                            className="btn btn-sm rounded-3 border-0"
                            style={{ 
                              width: '36px', height: '36px', padding: 0,
                              background: '#e0e7ff', color: '#4338ca'
                            }}
                            title="Modifier"
                            onClick={() => handleEditRole(r)}>
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                            </svg>
                          </button>
                          )}
                          {can(PERMS.roles.delete) && (
                          <button 
                            className="btn btn-sm rounded-3 border-0"
                            style={{ 
                              width: '36px', height: '36px', padding: 0,
                              background: '#fee2e2', color: '#b91c1c'
                            }}
                            title="Supprimer"
                            onClick={() => handleDeleteClick(r)}>
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
                            </svg>
                          </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted small">
                {rolesPagination.total} rôle(s)
              </div>
              <div className="d-flex align-items-center gap-2">
                <button className="btn btn-outline-secondary btn-sm" disabled={rolesPagination.page <= 1}
                        onClick={() => setPaginationRoles((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}>
                  Précédent
                </button>
                <span className="small text-muted">Page {rolesPagination.page} / {rolesPagination.lastPage}</span>
                <button className="btn btn-outline-secondary btn-sm" disabled={rolesPagination.page >= rolesPagination.lastPage}
                        onClick={() => setPaginationRoles((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}>
                  Suivant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'permissions' && can(PERMS.permissions.view) && (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-4">
            <div className="row g-3 mb-3">
              <div className="col-12 col-md-6">
                <div className="position-relative">
                  <svg className="position-absolute top-50 translate-middle-y" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" style={{ left: '16px', opacity: 0.5, pointerEvents: 'none', zIndex: 10 }}>
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                  </svg>
                  <input
                    type="text"
                    className="form-control form-control-lg ps-5 rounded-3 border-0 shadow-sm"
                    placeholder="Rechercher une permission..."
                    value={searchPerm}
                    onChange={(e) => setSearchPerm(e.target.value)}
                    style={{ background: '#f8f9fa', paddingLeft: '3rem' }}
                  />
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Guard</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingPerms ? (
                    <tr>
                      <td colSpan={2} className="text-center text-muted py-5">Chargement des permissions...</td>
                    </tr>
                  ) : permissions.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-center text-muted py-5">Aucune permission trouvée.</td>
                    </tr>
                  ) : permissions.map((p) => (
                    <tr key={p.id}>
                      <td className="fw-semibold">{p.name}</td>
                      <td className="text-muted">{p.guard_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted small">{permsPagination.total} permission(s)</div>
              <div className="d-flex align-items-center gap-2">
                <button className="btn btn-outline-secondary btn-sm" disabled={permsPagination.page <= 1}
                        onClick={() => setPaginationPerms((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}>
                  Précédent
                </button>
                <span className="small text-muted">Page {permsPagination.page} / {permsPagination.lastPage}</span>
                <button className="btn btn-outline-secondary btn-sm" disabled={permsPagination.page >= permsPagination.lastPage}
                        onClick={() => setPaginationPerms((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}>
                  Suivant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && can(PERMS.users.view) && (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-4">
            {/* Search */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-md-6">
                <div className="position-relative">
                  <svg className="position-absolute top-50 translate-middle-y" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" style={{ left: '16px', opacity: 0.5, pointerEvents: 'none', zIndex: 10 }}>
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                  </svg>
                  <input
                    type="text"
                    className="form-control form-control-lg ps-5 rounded-3 border-0 shadow-sm"
                    placeholder="Rechercher un utilisateur..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    style={{ background: '#f8f9fa', paddingLeft: '3rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={3} className="text-center text-muted py-5">Chargement des utilisateurs...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center text-muted py-5">Aucun utilisateur trouvé.</td>
                    </tr>
                  ) : users.map((u) => (
                    <tr key={u.id}>
                      <td className="fw-semibold">{u.name || '-'}</td>
                      <td className="text-muted">{u.email}</td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm rounded-3 border-0 d-inline-flex align-items-center gap-2"
                          style={{ background: '#e0f2fe', color: '#0369a1' }}
                          onClick={() => { setSelectedUser(u); setShowAccessModal(true); }}
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                          </svg>
                          Gérer accès
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted small">{usersPagination.total} utilisateur(s)</div>
              <div className="d-flex align-items-center gap-2">
                <button className="btn btn-outline-secondary btn-sm" disabled={usersPagination.page <= 1}
                        onClick={() => setPaginationUsers((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}>
                  Précédent
                </button>
                <span className="small text-muted">Page {usersPagination.page} / {usersPagination.lastPage}</span>
                <button className="btn btn-outline-secondary btn-sm" disabled={usersPagination.page >= usersPagination.lastPage}
                        onClick={() => setPaginationUsers((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}>
                  Suivant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <RoleFormModal show={showRoleModal} onHide={() => setShowRoleModal(false)} role={selectedRole} />

      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le rôle"
        message={selectedRole ? `Êtes-vous sûr de vouloir supprimer le rôle "${selectedRole.name}" ?` : 'Confirmer la suppression du rôle.'}
        isLoading={isDeleting}
      />

      <UserAccessModal
        show={showAccessModal}
        onHide={() => { setShowAccessModal(false); setSelectedUser(null); }}
        user={selectedUser}
      />
    </div>
  );
}
