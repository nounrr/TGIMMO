import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetUnitesQuery, useDeleteUniteMutation } from '../features/unites/unitesApi';
import UniteFormModal from '../components/modals/UniteFormModal';
import UniteDetailsModal from '../components/modals/UniteDetailsModal';
import DeleteConfirmModal from '../components/modals/DeleteConfirmModal';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';

export default function Unites() {
  const navigate = useNavigate();
  const { can } = useAuthz();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatut, setSelectedStatut] = useState('all');
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  
  // Construire les paramètres de requête
  const queryParams = useMemo(() => ({
    page: pagination.pageIndex + 1,
    per_page: pagination.pageSize,
    q: searchTerm || undefined,
    type_unite: selectedType !== 'all' ? selectedType : undefined,
    statut: selectedStatut !== 'all' ? selectedStatut : undefined,
  }), [pagination.pageIndex, pagination.pageSize, searchTerm, selectedType, selectedStatut]);

  const { data: unites, isLoading, error } = useGetUnitesQuery(queryParams);
  const [deleteUnite, { isLoading: isDeleting }] = useDeleteUniteMutation();
  
  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUnite, setSelectedUnite] = useState(null);

  // Statistiques globales
  const stats = useMemo(() => {
    if (!unites?.stats) {
      return {
        total: 0,
        vacant: 0,
        loue: 0,
        maintenance: 0,
        reserve: 0,
      };
    }
    return {
      total: unites.stats.total || 0,
      vacant: unites.stats.total_vacant || 0,
      loue: unites.stats.total_loue || 0,
      maintenance: unites.stats.total_maintenance || 0,
      reserve: unites.stats.total_reserve || 0,
    };
  }, [unites?.stats]);

  const handleAdd = () => {
    setSelectedUnite(null);
    setShowFormModal(true);
  };

  const handleEdit = (unite) => {
    setSelectedUnite(unite);
    setShowFormModal(true);
  };

  const handleView = (unite) => {
    setSelectedUnite(unite);
    setShowDetailsModal(true);
  };

  const handleDeleteClick = (unite) => {
    setSelectedUnite(unite);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUnite(selectedUnite.id).unwrap();
      setShowDeleteModal(false);
      setSelectedUnite(null);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
    }
  };

  // Données de la page actuelle
  const currentPageData = useMemo(() => {
    return unites?.data || [];
  }, [unites?.data]);

  // Colonnes du tableau
  const columns = useMemo(() => [
    {
      accessorKey: 'numero_unite',
      header: 'N° Unité',
      enableSorting: false,
      cell: ({ row }) => {
        const unite = row.original;
        const typeLabels = {
          appartement: 'Appartement',
          bureau: 'Bureau',
          local_commercial: 'Local commercial',
          garage: 'Garage',
          autre: 'Autre'
        };
        return (
          <div>
            <div className="fw-semibold text-slate-900">{unite.numero_unite}</div>
            {unite.type_unite && (
              <div className="text-slate-500 small">{typeLabels[unite.type_unite]}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'adresse',
      header: 'Adresse',
      enableSorting: false,
      cell: ({ row }) => {
        const unite = row.original;
        return (
          <div className="small">
            <div className="text-slate-700 fw-medium">{unite.adresse_complete}</div>
            {(unite.immeuble || unite.bloc || unite.etage) && (
              <div className="text-slate-500">
                {[unite.immeuble, unite.bloc, unite.etage].filter(Boolean).join(' - ')}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'caracteristiques',
      header: 'Caractéristiques',
      enableSorting: false,
      cell: ({ row }) => {
        const unite = row.original;
        return (
          <div className="small">
            {unite.superficie_m2 && (
              <div className="d-flex align-items-center gap-2 mb-1">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="text-indigo-500">
                  <path d="M0 0h4v4H0V0zm0 6h4v4H0V6zm0 6h4v4H0v-4zm6-12h4v4H6V0zm0 6h4v4H6V6zm0 6h4v4H6v-4zm6-12h4v4h-4V0zm0 6h4v4h-4V6zm0 6h4v4h-4v-4z"/>
                </svg>
                <span className="text-slate-700">{unite.superficie_m2} m²</span>
              </div>
            )}
            <div className="text-slate-600">
              {unite.nb_pieces && `${unite.nb_pieces} pièce${unite.nb_pieces > 1 ? 's' : ''}`}
              {unite.nb_pieces && unite.nb_sdb && ' • '}
              {unite.nb_sdb && `${unite.nb_sdb} SDB`}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'statut',
      header: 'Statut',
      enableSorting: false,
      cell: ({ getValue }) => {
        const statut = getValue();
        const colors = {
          vacant: { bg: '#dbeafe', color: '#1e40af' },
          loue: { bg: '#d1fae5', color: '#065f46' },
          maintenance: { bg: '#fef3c7', color: '#92400e' },
          reserve: { bg: '#e0e7ff', color: '#4338ca' }
        };
        const labels = {
          vacant: 'Vacant',
          loue: 'Loué',
          maintenance: 'Maintenance',
          reserve: 'Réservé'
        };
        const icons = {
          vacant: <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5ZM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5 5 5Z"/>,
          loue: <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>,
          maintenance: <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>,
          reserve: <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z"/>
        };
        
        return (
          <span className="badge rounded-pill px-3 py-2 fw-medium" style={{
            backgroundColor: colors[statut]?.bg || '#f3f4f6',
            color: colors[statut]?.color || '#1f2937'
          }}>
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="me-1" style={{ marginTop: '-2px' }}>
              {icons[statut] || icons.vacant}
            </svg>
            {labels[statut] || statut}
          </span>
        );
      },
    },
    {
      accessorKey: 'locataire',
      header: 'Locataire',
      enableSorting: false,
      cell: ({ row }) => {
        const unite = row.original;
        if (!unite.locataire_actuel) {
          return <span className="text-muted small">-</span>;
        }
        return (
          <div className="small">
            <div className="fw-semibold text-slate-700">
              {unite.locataire_actuel.nom} {unite.locataire_actuel.prenom}
            </div>
            {unite.date_entree_actuelle && (
              <div className="text-slate-500">
                Depuis {new Date(unite.date_entree_actuelle).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
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
        const unite = row.original;
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
              onClick={() => handleView(unite)}
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
            {can(PERMS.unites.update) && (
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
              onClick={() => handleEdit(unite)}
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
            {can(PERMS.baux.create) && unite.statut === 'vacant' && (
            <button 
              className="btn btn-sm rounded-3 border-0"
              style={{ 
                width: '36px', 
                height: '36px', 
                padding: 0,
                background: '#dcfce7',
                color: '#15803d',
                transition: 'all 0.2s'
              }}
              title="Créer un bail pour cette unité"
              onClick={() => navigate(`/baux/nouveau?unite_id=${unite.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#bbf7d0';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#dcfce7';
                e.currentTarget.style.transform = 'scale(1)';
              }}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                <path d="M8 6.5a.5.5 0 0 1 .5.5v1.5H10a.5.5 0 0 1 0 1H8.5V11a.5.5 0 0 1-1 0V9.5H6a.5.5 0 0 1 0-1h1.5V7a.5.5 0 0 1 .5-.5z"/>
              </svg>
            </button>
            )}
            <button 
              className="btn btn-sm rounded-3 border-0"
              style={{ 
                width: '36px', 
                height: '36px', 
                padding: 0,
                background: '#ecfeff',
                color: '#0e7490',
                transition: 'all 0.2s'
              }}
              title="Propriétaires"
              onClick={() => navigate(`/unites/${unite.id}/owners`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#cffafe';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ecfeff';
                e.currentTarget.style.transform = 'scale(1)';
              }}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
              </svg>
            </button>
            {can(PERMS.unites.delete) && (
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
              onClick={() => handleDeleteClick(unite)}
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
    pageCount: unites?.last_page ?? -1,
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
              Unités
            </h1>
            <p className="text-muted mb-0">Gestion des unités locatives et leurs caractéristiques</p>
          </div>
          {can(PERMS.unites.create) && (
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
            Nouvelle unité
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
                    placeholder="Rechercher par numéro, adresse, immeuble..."
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
                  <option value="appartement">Appartement</option>
                  <option value="bureau">Bureau</option>
                  <option value="local_commercial">Local commercial</option>
                  <option value="garage">Garage</option>
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
                  <option value="vacant">Vacant</option>
                  <option value="loue">Loué</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="reserve">Réservé</option>
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
                      <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5ZM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5 5 5Z"/>
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
                      <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5ZM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5 5 5Z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-muted small fw-medium">Vacant</div>
                    <div className="h4 fw-bold mb-0" style={{ color: '#2563eb' }}>{stats.vacant}</div>
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
                    <div className="text-muted small fw-medium">Loué</div>
                    <div className="h4 fw-bold mb-0" style={{ color: '#059669' }}>{stats.loue}</div>
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
                      <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                      <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-muted small fw-medium">Maintenance</div>
                    <div className="h4 fw-bold mb-0" style={{ color: '#d97706' }}>{stats.maintenance}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3 col-lg-4">
            <div className="card border-0 rounded-4 shadow-sm h-100"
                 style={{
                   background: 'linear-gradient(135deg, #e0e7ff 0%, #eef2ff 100%)',
                   transition: 'all 0.3s ease'
                 }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.transform = 'translateY(-4px)';
                   e.currentTarget.style.boxShadow = '0 12px 24px rgba(67, 56, 202, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.transform = 'translateY(0)';
                   e.currentTarget.style.boxShadow = '';
                 }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                       style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #6366f1, #4338ca)', color: 'white' }}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-muted small fw-medium">Réservé</div>
                    <div className="h4 fw-bold mb-0" style={{ color: '#4338ca' }}>{stats.reserve}</div>
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
                <p className="text-muted mt-3">Chargement des unités...</p>
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
                    <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5ZM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5 5 5Z"/>
                  </svg>
                </div>
                <h5 className="fw-bold mb-2">Aucune unité trouvée</h5>
                <p className="text-muted mb-0">
                  {searchTerm || selectedType !== 'all' || selectedStatut !== 'all'
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Commencez par ajouter une nouvelle unité'}
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
                                minWidth: header.id === 'numero_unite' ? '150px' : header.id === 'adresse' ? '250px' : 'auto',
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
                        {unites?.from || 0}
                      </span> à <span className="fw-semibold text-slate-700">
                        {unites?.to || 0}
                      </span> sur <span className="fw-semibold text-slate-700">{unites?.total || 0}</span> résultats
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
      <UniteFormModal
        show={showFormModal}
        onHide={() => {
          setShowFormModal(false);
          setSelectedUnite(null);
        }}
        unite={selectedUnite}
      />

      <UniteDetailsModal
        show={showDetailsModal}
        onHide={() => {
          setShowDetailsModal(false);
          setSelectedUnite(null);
        }}
        unite={selectedUnite}
      />

      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setSelectedUnite(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Supprimer l'unité"
        message={`Êtes-vous sûr de vouloir supprimer l'unité ${selectedUnite?.numero_unite} ? Cette action est irréversible.`}
      />
    </div>
  );
}
