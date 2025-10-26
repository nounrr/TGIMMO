import { useMemo, useState } from 'react';
import { 
  useGetPrestatairesQuery,
  useDeletePrestataireMutation,
} from '../features/prestataires/prestatairesApi';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';
import PrestataireFormModal from '../components/modals/PrestataireFormModal';
import PrestataireDetailsModal from '../components/modals/PrestataireDetailsModal';
import DeleteConfirmModal from '../components/modals/DeleteConfirmModal';

export default function Prestataires() {
  const { can } = useAuthz();
  const [searchTerm, setSearchTerm] = useState('');
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const queryParams = useMemo(() => {
    const sort = Array.isArray(sorting) && sorting.length > 0 ? sorting[0] : null;
    const sortBy = sort?.id;
    const sortDir = sort?.desc ? 'desc' : 'asc';
    return {
      page: pagination.pageIndex + 1,
      per_page: pagination.pageSize,
      q: searchTerm || undefined,
      sort_by: sortBy,
      sort_dir: sort ? sortDir : undefined,
    };
  }, [pagination.pageIndex, pagination.pageSize, searchTerm, sorting]);

  const { data, isLoading, error } = useGetPrestatairesQuery(queryParams);
  const [deletePrestataire, { isLoading: isDeleting }] = useDeletePrestataireMutation();

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPrestataire, setSelectedPrestataire] = useState(null);

  const currentPageData = useMemo(() => data?.data || [], [data?.data]);

  const columns = useMemo(() => [
    {
      accessorKey: 'nom_raison',
      header: 'Nom / Raison sociale',
      enableSorting: true,
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div>
            <div className="fw-semibold text-slate-900">{p.nom_raison}</div>
            {p.domaine_activite && (
              <div className="text-slate-500 small">{p.domaine_activite}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'contact_nom',
      header: 'Contact',
      enableSorting: true,
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="small">
            {p.contact_nom && (
              <div className="fw-medium text-slate-700">{p.contact_nom}</div>
            )}
            <div className="text-slate-500">{p.telephone || '-'}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="small text-truncate" style={{ maxWidth: 220, display: 'inline-block' }}>{getValue() || '-'}</span>
      ),
    },
    {
      accessorKey: 'rc',
      header: 'RC / ICE',
      enableSorting: false,
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="small text-slate-600">
            {p.rc && <div>RC: {p.rc}</div>}
            {p.ice && <div>ICE: {p.ice}</div>}
            {!p.rc && !p.ice && <span>-</span>}
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Actions</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="d-flex justify-content-center gap-2">
            <button
              className="btn btn-sm rounded-3 border-0"
              style={{ width: '36px', height: '36px', padding: 0, background: '#dbeafe', color: '#1e40af', transition: 'all 0.2s' }}
              title="Voir les détails"
              onClick={() => { setSelectedPrestataire(p); setShowDetailsModal(true); }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#bfdbfe'; e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
              </svg>
            </button>
            {can(PERMS.prestataires.update) && (
              <button
                className="btn btn-sm rounded-3 border-0"
                style={{ width: '36px', height: '36px', padding: 0, background: '#e0e7ff', color: '#4338ca', transition: 'all 0.2s' }}
                title="Modifier"
                onClick={() => { setSelectedPrestataire(p); setShowFormModal(true); }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#c7d2fe'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#e0e7ff'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5z"/>
                </svg>
              </button>
            )}
            {can(PERMS.prestataires.delete) && (
              <button
                className="btn btn-sm rounded-3 border-0"
                style={{ width: '36px', height: '36px', padding: 0, background: '#fee2e2', color: '#b91c1c', transition: 'all 0.2s' }}
                title="Supprimer"
                onClick={() => { setSelectedPrestataire(p); setShowDeleteModal(true); }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fecaca'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.transform = 'scale(1)'; }}
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
  ], []);

  const table = useReactTable({
    data: currentPageData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: data?.last_page ?? -1,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: { sorting, pagination },
  });

  if (!can(PERMS.prestataires.view)) {
    return (
      <div className="p-4">
        <div className="alert alert-warning rounded-3">
          Accès refusé: vous n'avez pas la permission de voir les prestataires.
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <div className="p-3 p-lg-4" style={{ width: '100%', boxSizing: 'border-box' }}>
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
          <div>
            <h1 className="h3 fw-bold mb-1" style={{
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Prestataires
            </h1>
            <p className="text-muted mb-0">Annuaire des prestataires et contacts</p>
          </div>
          {can(PERMS.prestataires.create) && (
            <button className="btn btn-lg text-white fw-semibold shadow d-flex align-items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                transition: 'all 0.3s ease'
              }}
              onClick={() => { setSelectedPrestataire(null); setShowFormModal(true); }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(37, 99, 235, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
              </svg>
              Nouveau prestataire
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="card border-0 shadow-sm rounded-4 mb-4"
          style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)' }}
        >
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="position-relative">
                  <svg className="position-absolute top-50 translate-middle-y" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" style={{ left: '16px', opacity: 0.5, pointerEvents: 'none', zIndex: 10 }}>
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                  </svg>
                  <input
                    type="text"
                    className="form-control form-control-lg ps-5 rounded-3 border-0 shadow-sm"
                    placeholder="Rechercher par nom, domaine, contact, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: '#f8f9fa', paddingLeft: '3rem' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden"
          style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)' }}
        >
          <div className="card-body p-0">
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="text-muted mt-3">Chargement des prestataires...</p>
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
                <div className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                  style={{ width: 80, height: 80, background: 'rgba(99, 102, 241, 0.1)' }}
                >
                  <svg width="40" height="40" fill="currentColor" viewBox="0 0 16 16" style={{ opacity: 0.5 }}>
                    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                  </svg>
                </div>
                <h5 className="fw-bold mb-2">Aucun prestataire trouvé</h5>
                <p className="text-muted mb-0">
                  {searchTerm ? 'Essayez de modifier vos critères de recherche' : 'Commencez par ajouter un nouveau prestataire'}
                </p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)', borderBottom: '2px solid #c7d2fe' }}>
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <th
                              key={header.id}
                              className="px-4 py-3 fw-semibold"
                              style={{
                                minWidth: header.id === 'nom_raison' ? '220px' : 'auto',
                                cursor: header.column.getCanSort() ? 'pointer' : 'default',
                                userSelect: 'none',
                                color: '#4338ca'
                              }}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map(row => (
                        <tr
                          key={row.id}
                          style={{ transition: 'all 0.2s ease', borderBottom: '1px solid #e5e7eb' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
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
                <div className="px-4 py-4 border-top d-flex flex-column flex-md-row justify-content-between align-items-center gap-3"
                  style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)' }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <span className="text-muted small">
                      Affichage de <span className="fw-semibold text-slate-700">{data?.from || 0}</span> à <span className="fw-semibold text-slate-700">{data?.to || 0}</span> sur <span className="fw-semibold text-slate-700">{data?.total || 0}</span> résultats
                    </span>
                    <select
                      className="form-select form-select-sm rounded-3 border-0 shadow-sm"
                      style={{ width: 'auto', background: '#ffffff', color: '#4338ca', fontWeight: '500' }}
                      value={table.getState().pagination.pageSize}
                      onChange={e => {
                        table.setPageSize(Number(e.target.value));
                        table.setPageIndex(0);
                      }}
                    >
                      {[10, 20, 30, 50].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                          {pageSize} par page
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="d-flex gap-2">
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
                      onMouseEnter={(e) => {
                        if (table.getCanPreviousPage()) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '';
                      }}
                    >
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="me-1">
                        <path fillRule="evenodd" d="M8.354 1.646a.5.5 0 0 1 0 .708L2.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                        <path fillRule="evenodd" d="M12.354 1.646a.5.5 0 0 1 0 .708L6.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                      </svg>
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
                      onMouseEnter={(e) => {
                        if (table.getCanPreviousPage()) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '';
                      }}
                    >
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="me-1">
                        <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                      </svg>
                      Précédent
                    </button>
                    <div className="d-flex align-items-center px-3 rounded-3"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: 'white', fontWeight: '600', fontSize: '0.875rem' }}
                    >
                      Page {table.getState().pagination.pageIndex + 1} sur {table.getPageCount()}
                    </div>
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
                      onMouseEnter={(e) => {
                        if (table.getCanNextPage()) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '';
                      }}
                    >
                      Suivant
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="ms-1">
                        <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                      </svg>
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
                      onMouseEnter={(e) => {
                        if (table.getCanNextPage()) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '';
                      }}
                    >
                      Dernière
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="ms-1">
                        <path fillRule="evenodd" d="M3.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L9.293 8 3.646 2.354a.5.5 0 0 1 0-.708z"/>
                        <path fillRule="evenodd" d="M7.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L13.293 8 7.646 2.354a.5.5 0 0 1 0-.708z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <PrestataireFormModal
        show={showFormModal}
        onHide={() => { setShowFormModal(false); setSelectedPrestataire(null); }}
        prestataire={selectedPrestataire}
      />

      <PrestataireDetailsModal
        show={showDetailsModal}
        onHide={() => { setShowDetailsModal(false); setSelectedPrestataire(null); }}
        prestataire={selectedPrestataire}
      />

      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => { setShowDeleteModal(false); setSelectedPrestataire(null); }}
        onConfirm={async () => {
          try {
            await deletePrestataire(selectedPrestataire.id).unwrap();
            setShowDeleteModal(false);
            setSelectedPrestataire(null);
          } catch (err) {
            console.error('Erreur lors de la suppression:', err);
          }
        }}
        isLoading={isDeleting}
        title="Supprimer le prestataire"
        message={`Êtes-vous sûr de vouloir supprimer ${selectedPrestataire?.nom_raison} ? Cette action est irréversible.`}
      />
    </div>
  );
}
