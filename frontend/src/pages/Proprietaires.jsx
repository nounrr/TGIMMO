import { useState, useMemo } from 'react';
import { useGetProprietairesQuery, useDeleteProprietaireMutation } from '../features/proprietaires/proprietairesApi';
import ProprietaireFormModal from '../components/modals/ProprietaireFormModal';
import ProprietaireDetailsModal from '../components/modals/ProprietaireDetailsModal';
import DeleteConfirmModal from '../components/modals/DeleteConfirmModal';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';

export default function Proprietaires() {
  const { can } = useAuthz();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatut, setSelectedStatut] = useState('all');
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  
  // Construire les paramètres de requête pour Laravel
  const queryParams = useMemo(() => {
    const sort = Array.isArray(sorting) && sorting.length > 0 ? sorting[0] : null;
    const sortBy = sort?.id;
    const sortDir = sort?.desc ? 'desc' : 'asc';
    return {
      page: pagination.pageIndex + 1,
      per_page: pagination.pageSize,
      search: searchTerm || undefined,
      type: selectedType !== 'all' ? selectedType : undefined,
      statut: selectedStatut !== 'all' ? selectedStatut : undefined,
      sort_by: sortBy,
      sort_dir: sort ? sortDir : undefined,
    };
  }, [pagination.pageIndex, pagination.pageSize, searchTerm, selectedType, selectedStatut, sorting]);

  const { data: proprietaires, isLoading, error } = useGetProprietairesQuery(queryParams);
  const [deleteProprietaire, { isLoading: isDeleting }] = useDeleteProprietaireMutation();
  
  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProprietaire, setSelectedProprietaire] = useState(null);

  // Statistiques globales depuis le backend
  const stats = useMemo(() => {
    if (!proprietaires?.stats) {
      return {
        total: 0,
        actif: 0,
        signe: 0,
        brouillon: 0,
        resilie: 0,
      };
    }
    return {
      total: proprietaires.stats.total || 0,
      actif: proprietaires.stats.total_actif || 0,
      signe: proprietaires.stats.total_signe || 0,
      brouillon: proprietaires.stats.total_brouillon || 0,
      resilie: proprietaires.stats.total_resilie || 0,
    };
  }, [proprietaires?.stats]);

  const handleAdd = () => {
    setSelectedProprietaire(null);
    setShowFormModal(true);
  };

  const handleEdit = (proprietaire) => {
    setSelectedProprietaire(proprietaire);
    setShowFormModal(true);
  };

  const handleView = (proprietaire) => {
    setSelectedProprietaire(proprietaire);
    setShowDetailsModal(true);
  };

  const handleDeleteClick = (proprietaire) => {
    setSelectedProprietaire(proprietaire);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteProprietaire(selectedProprietaire.id).unwrap();
      setShowDeleteModal(false);
      setSelectedProprietaire(null);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
    }
  };

  // Données de la page actuelle
  const currentPageData = useMemo(() => {
    return proprietaires?.data || [];
  }, [proprietaires?.data]);

  // Colonnes du tableau
  const columns = useMemo(() => [
    {
  accessorKey: 'nom_raison',
  header: 'Nom / Raison sociale',
  enableSorting: true,
      cell: ({ row }) => {
        const prop = row.original;
        return (
          <div>
            <div className="fw-semibold text-slate-900">{prop.nom_raison}</div>
            {prop.type_proprietaire && (
              <div className="text-slate-500 small">
                {prop.type_proprietaire === 'unique' && 'Propriétaire unique'}
                {prop.type_proprietaire === 'coproprietaire' && 'Copropriétaire'}
                {prop.type_proprietaire === 'heritier' && 'Héritier'}
                {prop.type_proprietaire === 'sci' && 'SCI'}
                {prop.type_proprietaire === 'autre' && 'Autre'}
              </div>
            )}
          </div>
        );
      },
    },
    {
  accessorKey: 'statut',
  header: 'Statut',
  enableSorting: true,
      cell: ({ getValue }) => {
        const statut = getValue();
        const colors = {
          brouillon: { bg: '#fef3c7', color: '#92400e' },
          signe: { bg: '#dbeafe', color: '#1e40af' },
          actif: { bg: '#d1fae5', color: '#065f46' },
          resilie: { bg: '#fee2e2', color: '#991b1b' }
        };
        const labels = {
          brouillon: 'Brouillon',
          signe: 'Signé',
          actif: 'Actif',
          resilie: 'Résilié'
        };
        const icons = {
          brouillon: <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z"/>,
          signe: <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>,
          actif: <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>,
          resilie: <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        };
        
        return (
          <span className="badge rounded-pill px-3 py-2 fw-medium" style={{
            backgroundColor: colors[statut]?.bg || '#f3f4f6',
            color: colors[statut]?.color || '#1f2937'
          }}>
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="me-1" style={{ marginTop: '-2px' }}>
              {icons[statut] || icons.brouillon}
            </svg>
            {labels[statut] || statut}
          </span>
        );
      },
    },
    {
      accessorKey: 'contact',
      header: 'Contact',
      enableSorting: false,
      cell: ({ row }) => {
        const prop = row.original;
        return (
          <div className="small">
            {prop.telephone && (
              <div className="d-flex align-items-center gap-2 mb-1 text-slate-700">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="text-indigo-500">
                  <path fillRule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/>
                </svg>
                <span>{prop.telephone}</span>
              </div>
            )}
            {prop.email && (
              <div className="d-flex align-items-center gap-2 text-truncate text-slate-600" style={{ maxWidth: '200px' }}>
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="text-indigo-500">
                  <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z"/>
                </svg>
                <span className="text-truncate">{prop.email}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'identifiant',
      header: 'Identifiant',
      enableSorting: false,
      cell: ({ row }) => {
        const prop = row.original;
        return (
          <div className="small">
            {prop.cin && (
              <div className="d-flex align-items-center gap-2 mb-1">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="text-indigo-500">
                  <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1H2zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7z"/>
                </svg>
                <span className="fw-medium text-slate-700">{prop.cin}</span>
              </div>
            )}
            {prop.rc && (
              <div className="text-slate-500 small">RC: {prop.rc}</div>
            )}
            {prop.ice && (
              <div className="text-slate-500 small">ICE: {prop.ice}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'gestion',
      header: 'Gestion',
      enableSorting: false,
      cell: ({ row }) => {
        const prop = row.original;
        return (
          <div className="small">
            {prop.taux_gestion_tgi_pct && (
              <div className="d-flex align-items-center gap-2 text-slate-700">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="text-indigo-500">
                  <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                  <path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V5zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2H3z"/>
                </svg>
                <span className="fw-medium">{prop.taux_gestion_tgi_pct}%</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Actions</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const prop = row.original;
        return (
          <div className="d-flex justify-content-center gap-2">
            <button 
              className="btn btn-sm rounded-3 border-0"
              style={{ 
                width: '36px', 
                height: '36px', 
                padding: 0,
                background: '#dbeafe',
                color: '#1e40af',
                transition: 'all 0.2s'
              }}
              title="Voir les détails"
              onClick={() => handleView(prop)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#bfdbfe';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#dbeafe';
                e.currentTarget.style.transform = 'scale(1)';
              }}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
              </svg>
            </button>
            {can(PERMS.proprietaires.update) && (
            <button 
              className="btn btn-sm rounded-3 border-0"
              style={{ 
                width: '36px', 
                height: '36px', 
                padding: 0,
                background: '#e0e7ff',
                color: '#4338ca',
                transition: 'all 0.2s'
              }}
              title="Modifier"
              onClick={() => handleEdit(prop)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#c7d2fe';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#e0e7ff';
                e.currentTarget.style.transform = 'scale(1)';
              }}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
              </svg>
            </button>
            )}
            {can(PERMS.proprietaires.delete) && (
            <button 
              className="btn btn-sm rounded-3 border-0"
              style={{ 
                width: '36px', 
                height: '36px', 
                padding: 0,
                background: '#fee2e2',
                color: '#b91c1c',
                transition: 'all 0.2s'
              }}
              title="Supprimer"
              onClick={() => handleDeleteClick(prop)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fecaca';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fee2e2';
                e.currentTarget.style.transform = 'scale(1)';
              }}>
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

  // Configuration de TanStack Table
  const table = useReactTable({
    data: currentPageData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: proprietaires?.last_page ?? -1,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
  });

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
              Propriétaires
            </h1>
            <p className="text-muted mb-0">Gestion des propriétaires et leurs informations</p>
          </div>
          {can(PERMS.proprietaires.create) && (
          <button className="btn btn-lg text-white fw-semibold shadow d-flex align-items-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={handleAdd}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(37, 99, 235, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
            Nouveau propriétaire
          </button>
          )}
        </div>

        {/* Filters */}
        <div className="card border-0 shadow-sm rounded-4 mb-4"
             style={{
               background: 'rgba(255, 255, 255, 0.9)',
               backdropFilter: 'blur(20px)'
             }}>
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
                    placeholder="Rechercher par nom, raison sociale, email, CIN, RC..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: '#f8f9fa', paddingLeft: '3rem' }}
                  />
                </div>
              </div>
              <div className="col-12 col-md-3">
                <select
                  className="form-select form-select-lg rounded-3 border-0 shadow-sm"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  style={{ background: '#f8f9fa' }}
                >
                  <option value="all">Tous les types</option>
                  <option value="unique">Propriétaire unique</option>
                  <option value="coproprietaire">Copropriétaire</option>
                  <option value="heritier">Héritier</option>
                  <option value="sci">SCI</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div className="col-12 col-md-3">
                <select
                  className="form-select form-select-lg rounded-3 border-0 shadow-sm"
                  value={selectedStatut}
                  onChange={(e) => setSelectedStatut(e.target.value)}
                  style={{ background: '#f8f9fa' }}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="brouillon">Brouillon</option>
                  <option value="signe">Signé</option>
                  <option value="actif">Actif</option>
                  <option value="resilie">Résilié</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-xl-3 col-lg-4">
            <div className="card border-0 rounded-4 shadow-sm h-100"
                 style={{
                   background: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)',
                   transition: 'all 0.3s ease'
                 }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.transform = 'translateY(-4px)';
                   e.currentTarget.style.boxShadow = '0 12px 24px rgba(139, 92, 246, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.transform = 'translateY(0)';
                   e.currentTarget.style.boxShadow = '';
                 }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                       style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white' }}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8Zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816ZM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-muted small fw-medium">Total</div>
                    <div className="h4 fw-bold mb-0" style={{ color: '#7c3aed' }}>{stats.total}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3 col-lg-4">
            <div className="card border-0 rounded-4 shadow-sm h-100"
                 style={{
                   background: 'linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)',
                   transition: 'all 0.3s ease'
                 }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.transform = 'translateY(-4px)';
                   e.currentTarget.style.boxShadow = '0 12px 24px rgba(16, 185, 129, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.transform = 'translateY(0)';
                   e.currentTarget.style.boxShadow = '';
                 }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                       style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-muted small fw-medium">Actif</div>
                    <div className="h4 fw-bold mb-0" style={{ color: '#059669' }}>{stats.actif}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3 col-lg-4">
            <div className="card border-0 rounded-4 shadow-sm h-100"
                 style={{
                   background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)',
                   transition: 'all 0.3s ease'
                 }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.transform = 'translateY(-4px)';
                   e.currentTarget.style.boxShadow = '0 12px 24px rgba(59, 130, 246, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.transform = 'translateY(0)';
                   e.currentTarget.style.boxShadow = '';
                 }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                       style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white' }}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-muted small fw-medium">Signé</div>
                    <div className="h4 fw-bold mb-0" style={{ color: '#2563eb' }}>{stats.signe}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3 col-lg-4">
            <div className="card border-0 rounded-4 shadow-sm h-100"
                 style={{
                   background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
                   transition: 'all 0.3s ease'
                 }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.transform = 'translateY(-4px)';
                   e.currentTarget.style.boxShadow = '0 12px 24px rgba(245, 158, 11, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.transform = 'translateY(0)';
                   e.currentTarget.style.boxShadow = '';
                 }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                       style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white' }}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-muted small fw-medium">Brouillon</div>
                    <div className="h4 fw-bold mb-0" style={{ color: '#d97706' }}>{stats.brouillon}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 rounded-4 shadow-sm h-100"
                 style={{
                   background: 'linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)',
                   transition: 'all 0.3s ease'
                 }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.transform = 'translateY(-4px)';
                   e.currentTarget.style.boxShadow = '0 12px 24px rgba(239, 68, 68, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.transform = 'translateY(0)';
                   e.currentTarget.style.boxShadow = '';
                 }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                       style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white' }}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-muted small fw-medium">Résilié</div>
                    <div className="h4 fw-bold mb-0" style={{ color: '#dc2626' }}>{stats.resilie}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden"
             style={{
               background: 'rgba(255, 255, 255, 0.9)',
               backdropFilter: 'blur(20px)'
             }}>
          <div className="card-body p-0">
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="text-muted mt-3">Chargement des propriétaires...</p>
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
                     style={{ width: 80, height: 80, background: 'rgba(99, 102, 241, 0.1)' }}>
                  <svg width="40" height="40" fill="currentColor" viewBox="0 0 16 16" style={{ opacity: 0.5 }}>
                    <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8Zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816ZM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>
                  </svg>
                </div>
                <h5 className="fw-bold mb-2">Aucun propriétaire trouvé</h5>
                <p className="text-muted mb-0">
                  {searchTerm || selectedType !== 'all' || selectedStatut !== 'all'
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Commencez par ajouter un nouveau propriétaire'}
                </p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ 
                      background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)',
                      borderBottom: '2px solid #c7d2fe'
                    }}>
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <th 
                              key={header.id}
                              className="px-4 py-3 fw-semibold"
                              style={{ 
                                minWidth: header.id === 'nom_raison' ? '200px' : 'auto',
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
                          style={{ 
                            transition: 'all 0.2s ease',
                            borderBottom: '1px solid #e5e7eb'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
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
                     style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)' }}>
                  <div className="d-flex align-items-center gap-3">
                    <span className="text-muted small">
                      Affichage de <span className="fw-semibold text-slate-700">
                        {proprietaires?.from || 0}
                      </span> à <span className="fw-semibold text-slate-700">
                        {proprietaires?.to || 0}
                      </span> sur <span className="fw-semibold text-slate-700">{proprietaires?.total || 0}</span> résultats
                    </span>
                    <select
                      className="form-select form-select-sm rounded-3 border-0 shadow-sm"
                      style={{ 
                        width: 'auto',
                        background: '#ffffff',
                        color: '#4338ca',
                        fontWeight: '500'
                      }}
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
                         style={{ 
                           background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                           color: 'white',
                           fontWeight: '600',
                           fontSize: '0.875rem'
                         }}>
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
      <ProprietaireFormModal
        show={showFormModal}
        onHide={() => {
          setShowFormModal(false);
          setSelectedProprietaire(null);
        }}
        proprietaire={selectedProprietaire}
      />

      <ProprietaireDetailsModal
        show={showDetailsModal}
        onHide={() => {
          setShowDetailsModal(false);
          setSelectedProprietaire(null);
        }}
        proprietaire={selectedProprietaire}
      />

      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setSelectedProprietaire(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Supprimer le propriétaire"
        message={`Êtes-vous sûr de vouloir supprimer ${selectedProprietaire?.nom_raison} ? Cette action est irréversible.`}
      />
    </div>
  );
}
