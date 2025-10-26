import { useEffect, useMemo, useState } from 'react';
import { useGetUsersQuery, useDeleteUserMutation } from '../features/users/usersApi';
import { useGetRolesQuery } from '../features/roles/rolesApi';
import UserFormModal from '../components/modals/UserFormModal';
import DeleteConfirmModal from '../components/modals/DeleteConfirmModal';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';

export default function Employes() {
  const { can } = useAuthz();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const queryParams = useMemo(() => {
    const sort = Array.isArray(sorting) && sorting.length > 0 ? sorting[0] : null;
    const sortBy = sort?.id ? sort.id : undefined;
    const sortDir = sort?.desc ? 'desc' : 'asc';
    return {
      page: pagination.pageIndex + 1,
      per_page: pagination.pageSize,
      q: searchTerm || undefined,
      role: selectedRole !== 'all' ? selectedRole : undefined,
      withRoles: true,
      sort_by: sortBy,
      sort_dir: sort ? sortDir : undefined,
    };
  }, [pagination, searchTerm, selectedRole, sorting]);

  const { data: usersResp, isLoading, error } = useGetUsersQuery(queryParams);
  const { data: rolesResp } = useGetRolesQuery({ per_page: 100 });
  const roles = useMemo(() => rolesResp?.data || [], [rolesResp?.data]);

  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const users = useMemo(() => usersResp?.data ?? [], [usersResp?.data]);

  const handleAdd = () => {
    setSelectedUser(null);
    setShowFormModal(true);
  };

  const handleEdit = (u) => {
    setSelectedUser(u);
    setShowFormModal(true);
  };

  const handleDeleteClick = (u) => {
    setSelectedUser(u);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(selectedUser.id).unwrap();
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Erreur suppression utilisateur', err);
    }
  };

  const currentPageData = users;

  // Reset to first page when search or role filter changes
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [searchTerm, selectedRole]);

  // totalPages will be computed after the table is initialized

  const columns = useMemo(() => [
    {
      id: 'name',
      header: 'Employé',
      enableSorting: true,
      cell: ({ row }) => {
        const u = row.original;
        const displayName = u.name || u.email || '-';
        return (
          <div>
            <div className="fw-semibold text-slate-900">{displayName}</div>
            <div className="text-muted small">{u.email}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'telephone_interne',
      header: 'Téléphone',
      enableSorting: true,
      cell: ({ row }) => <span className="text-slate-700">{row.original?.telephone_interne || '-'}</span>,
    },
    {
      accessorKey: 'roles',
      header: 'Rôles',
      enableSorting: false,
      cell: ({ row }) => {
        const u = row.original;
        const roleNames = (u.roles || []).map((r) => r.name).join(', ');
        return (
          <span className="badge rounded-pill px-3 py-2 fw-medium" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>
            {roleNames || '-'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Actions</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="d-flex justify-content-center gap-2">
            {can(PERMS.users.update) && (
              <button 
                className="btn btn-sm rounded-3 border-0"
                style={{ width: 36, height: 36, padding: 0, background: '#e0e7ff', color: '#4338ca' }}
                title="Modifier"
                onClick={() => handleEdit(u)}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                </svg>
              </button>
            )}
            {can(PERMS.users.delete) && (
              <button 
                className="btn btn-sm rounded-3 border-0"
                style={{ width: 36, height: 36, padding: 0, background: '#fee2e2', color: '#b91c1c' }}
                title="Supprimer"
                onClick={() => handleDeleteClick(u)}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
                </svg>
              </button>
            )}
          </div>
        );
      },
    },
  ], [can]);

  const table = useReactTable({
    data: currentPageData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: usersResp?.last_page ?? -1,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: { sorting, pagination },
  });

  const totalPages = usersResp?.last_page ?? table?.getPageCount?.() ?? 1;

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <div className="p-3 p-lg-4" style={{ width: '100%', boxSizing: 'border-box' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
          <div>
            <h1 className="h3 fw-bold mb-1" style={{
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Employés
            </h1>
            <p className="text-muted mb-0">Gestion des utilisateurs et de leur rôle</p>
          </div>
          {can(PERMS.users.create) && (
            <button className="btn btn-lg text-white fw-semibold shadow d-flex align-items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', border: 'none', borderRadius: '12px', padding: '12px 24px' }}
                    onClick={handleAdd}>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
              </svg>
              Nouvel employé
            </button>
          )}
        </div>

        <div className="card border-0 shadow-sm rounded-4 mb-4" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)' }}>
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="position-relative">
                  <svg className="position-absolute top-50 translate-middle-y" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" style={{ left: '16px', opacity: 0.5, pointerEvents: 'none', zIndex: 10 }}>
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                  </svg>
                  <input type="text" className="form-control form-control-lg ps-5 rounded-3 border-0 shadow-sm" placeholder="Rechercher par nom, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ background: '#f8f9fa', paddingLeft: '3rem' }} />
                </div>
              </div>
              <div className="col-12 col-md-3">
                <select className="form-select form-select-lg rounded-3 border-0 shadow-sm" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} style={{ background: '#f8f9fa' }}>
                  <option value="all">Tous les rôles</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)' }}>
          <div className="card-body p-0">
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="text-muted mt-3">Chargement des employés...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger m-4 rounded-3" role="alert">
                <div className="d-flex align-items-center gap-2">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                  </svg>
                  <span>Erreur lors du chargement des données</span>
                </div>
              </div>
            ) : currentPageData.length === 0 ? (
              <div className="text-center py-5">
                <div className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: 80, height: 80, background: 'rgba(99, 102, 241, 0.1)' }}>
                  <svg width="40" height="40" fill="currentColor" viewBox="0 0 16 16" style={{ opacity: 0.5 }}>
                    <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8Zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816ZM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z"/>
                  </svg>
                </div>
                <h5 className="fw-bold mb-2">Aucun employé trouvé</h5>
                <p className="text-muted mb-0">Commencez par ajouter un nouvel employé</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)', borderBottom: '2px solid #c7d2fe' }}>
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => {
                            const canSort = header.column.getCanSort();
                            const sorted = header.column.getIsSorted();
                            return (
                              <th
                                key={header.id}
                                className="px-4 py-3 fw-semibold"
                                style={{ cursor: canSort ? 'pointer' : 'default', userSelect: 'none', color: '#4338ca' }}
                                onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                              >
                                <div className="d-flex align-items-center gap-1">
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                  {sorted === 'asc' && <span aria-hidden>▲</span>}
                                  {sorted === 'desc' && <span aria-hidden>▼</span>}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map(row => (
                        <tr key={row.id} style={{ transition: 'all 0.2s ease', borderBottom: '1px solid #e5e7eb' }}>
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id} className="px-4 py-3">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="d-flex flex-column flex-lg-row align-items-center justify-content-between gap-3 p-3 border-top" style={{ background: '#fff' }}>
                  {/* Page size */}
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small">Lignes par page</span>
                    <select
                      className="form-select form-select-sm w-auto"
                      value={table.getState().pagination.pageSize}
                      onChange={(e) => {
                        const size = Number(e.target.value) || 10;
                        setPagination((p) => ({ ...p, pageSize: size, pageIndex: 0 }));
                        table.setPageIndex(0);
                      }}
                    >
                      {[10, 20, 50].map((ps) => (
                        <option key={ps} value={ps}>{ps}</option>
                      ))}
                    </select>
                  </div>

                  {/* Page indicator */}
                  <div className="text-muted small fw-medium">
                    Page {table.getState().pagination.pageIndex + 1} sur {totalPages || 1}
                    {usersResp?.from !== undefined && usersResp?.to !== undefined && usersResp?.total !== undefined && (
                      <span className="ms-2">• Affichage {usersResp.from}–{usersResp.to} sur {usersResp.total}</span>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn btn-sm rounded-3 border-0 shadow-sm"
                      style={{
                        background: table.getCanPreviousPage() ? 'linear-gradient(135deg, #e0e7ff, #ede9fe)' : '#f3f4f6',
                        color: table.getCanPreviousPage() ? '#4338ca' : '#9ca3af',
                        fontWeight: '500',
                        padding: '8px 16px',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                    >
                      Première
                    </button>
                    <button
                      className="btn btn-sm rounded-3 border-0 shadow-sm"
                      style={{
                        background: table.getCanPreviousPage() ? 'linear-gradient(135deg, #e0e7ff, #ede9fe)' : '#f3f4f6',
                        color: table.getCanPreviousPage() ? '#4338ca' : '#9ca3af',
                        fontWeight: '500',
                        padding: '8px 16px',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      Précédente
                    </button>
                    <button
                      className="btn btn-sm rounded-3 border-0 shadow-sm"
                      style={{
                        background: table.getCanNextPage() ? 'linear-gradient(135deg, #e0e7ff, #ede9fe)' : '#f3f4f6',
                        color: table.getCanNextPage() ? '#4338ca' : '#9ca3af',
                        fontWeight: '500',
                        padding: '8px 16px',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      Suivante
                    </button>
                    <button
                      className="btn btn-sm rounded-3 border-0 shadow-sm"
                      style={{
                        background: table.getCanNextPage() ? 'linear-gradient(135deg, #e0e7ff, #ede9fe)' : '#f3f4f6',
                        color: table.getCanNextPage() ? '#4338ca' : '#9ca3af',
                        fontWeight: '500',
                        padding: '8px 16px',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                      disabled={!table.getCanNextPage()}
                    >
                      Dernière
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <UserFormModal show={showFormModal} onHide={() => { setShowFormModal(false); setSelectedUser(null); }} user={selectedUser} />

      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => { setShowDeleteModal(false); setSelectedUser(null); }}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Supprimer l'employé"
        message={selectedUser ? `Êtes-vous sûr de vouloir supprimer ${selectedUser.name || selectedUser.email} ?` : 'Confirmer la suppression'}
      />
    </div>
  );
}
