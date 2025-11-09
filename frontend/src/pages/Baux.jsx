import React, { useState } from 'react';
import { useGetBauxQuery, useDeleteBailMutation } from '../api/baseApi';
import { useGetLocatairesQuery } from '../features/locataires/locatairesApi';
import { useGetUnitesQuery } from '../features/unites/unitesApi';
import BailStatusBadge from '../components/BailStatusBadge';
import EquipementsChips from '../components/EquipementsChips';
import { Link } from 'react-router-dom';
import RemiseCleModal from '../components/RemiseCleModal';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';

export default function Baux() {
  const [filters, setFilters] = useState({ statut: '', locataire_id: '', unite_id: '' });
  const [remiseModalBail, setRemiseModalBail] = useState(null);
  const { can } = useAuthz();
  
  // Construire les paramètres en excluant les valeurs vides
  const queryParams = {};
  if (filters.statut) queryParams.statut = filters.statut;
  if (filters.locataire_id) queryParams.locataire_id = filters.locataire_id;
  if (filters.unite_id) queryParams.unite_id = filters.unite_id;
  
  const { data, isLoading, isFetching } = useGetBauxQuery(queryParams);
  const [deleteBail, { isLoading: isDeleting }] = useDeleteBailMutation();
  
  // Charger les locataires et unités pour les filtres
  const { data: locatairesData } = useGetLocatairesQuery({ per_page: 1000 });
  const { data: unitesData } = useGetUnitesQuery({ per_page: 1000 });
  
  const locataires = locatairesData?.data || [];
  const unites = unitesData?.data || [];

  const baux = data?.data || [];

  const onChange = (field, value) => setFilters(f => ({ ...f, [field]: value }));

  const handleDownloadPdf = async (bailId) => {
    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      const token = localStorage.getItem('token');
      const res = await fetch(`${base}/baux/${bailId}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Echec du téléchargement');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      // Ouvrir dans un nouvel onglet et déclencher un téléchargement
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `bail_${bailId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error(e);
      alert("Impossible de télécharger le PDF du bail.");
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <div className="bg-primary bg-opacity-10 p-2 rounded">
              <i className="bi bi-file-text text-primary fs-5"></i>
            </div>
            Baux locatifs
          </h4>
          <p className="text-muted mb-0 small">Gérer les contrats de location</p>
        </div>
        <Link to="/baux/nouveau" className="btn btn-primary shadow-sm">
          <i className="bi bi-plus-circle me-2"></i>Nouveau bail
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-header bg-light border-0">
          <h6 className="mb-0 fw-semibold">
            <i className="bi bi-funnel me-2"></i>Filtres de recherche
          </h6>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label fw-semibold small">
                <i className="bi bi-flag text-info me-1"></i>Statut
              </label>
              <select className="form-select" value={filters.statut} onChange={e => onChange('statut', e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="actif">✅ Actif</option>
                <option value="en_attente">⏳ En attente</option>
                <option value="resilie">❌ Résilié</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold small">
                <i className="bi bi-person text-primary me-1"></i>Locataire
              </label>
              <select 
                className="form-select" 
                value={filters.locataire_id} 
                onChange={e => onChange('locataire_id', e.target.value)}
              >
                <option value="">Tous les locataires</option>
                {locataires.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.type === 'personne' 
                      ? `${loc.nom} ${loc.prenom}` 
                      : loc.raison_sociale}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold small">
                <i className="bi bi-building text-success me-1"></i>Unité
              </label>
              <select 
                className="form-select" 
                value={filters.unite_id} 
                onChange={e => onChange('unite_id', e.target.value)}
              >
                <option value="">Toutes les unités</option>
                {unites.map(unite => (
                  <option key={unite.id} value={unite.id}>
                    {unite.numero_unite} - {unite.adresse_complete}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" onClick={() => setFilters({ statut: '', locataire_id: '', unite_id: '' })} disabled={isFetching}>
                <i className="bi bi-arrow-counterclockwise me-2"></i>Réinitialiser
              </button>
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
              <p className="text-muted mt-3">Chargement des baux...</p>
            </div>
          ) : baux.length === 0 ? (
            <div className="text-center py-5">
              <div className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                style={{ width: 80, height: 80, background: 'rgba(99, 102, 241, 0.1)' }}
              >
                <svg width="40" height="40" fill="currentColor" viewBox="0 0 16 16" style={{ opacity: 0.5 }}>
                  <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
                </svg>
              </div>
              <h5 className="fw-bold mb-2">Aucun bail trouvé</h5>
              <p className="text-muted mb-0">
                {Object.values(queryParams).some(v => v) ? 'Essayez de modifier vos critères de recherche' : 'Commencez par ajouter un nouveau bail'}
              </p>
            </div>
          ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)', borderBottom: '2px solid #c7d2fe' }}>
                <tr>
                  <th className="px-2 py-2 fw-semibold" style={{ color: '#4338ca' }}>
                    <i className="bi bi-key me-1"></i>#
                  </th>
                  <th className="px-2 py-2 fw-semibold" style={{ color: '#4338ca' }}>
                    <i className="bi bi-hash me-1"></i>Numéro
                  </th>
                  <th className="px-2 py-2 fw-semibold" style={{ color: '#4338ca' }}>
                    <i className="bi bi-person me-1"></i>Locataire
                  </th>
                  <th className="px-2 py-2 fw-semibold" style={{ color: '#4338ca' }}>
                    <i className="bi bi-building me-1"></i>Unité
                  </th>
                  <th className="px-2 py-2 fw-semibold" style={{ color: '#4338ca' }}>
                    <i className="bi bi-tag me-1"></i>Type unité
                  </th>
                  <th className="px-2 py-2 fw-semibold" style={{ color: '#4338ca' }}>
                    <i className="bi bi-cash me-1"></i>Loyer (MAD)
                  </th>
                  <th className="px-2 py-2 fw-semibold" style={{ color: '#4338ca' }}>
                    <i className="bi bi-calendar-range me-1"></i>Dates
                  </th>
                  <th className="px-2 py-2 fw-semibold" style={{ color: '#4338ca' }}>
                    <i className="bi bi-flag me-1"></i>Statut
                  </th>
                  <th className="px-2 py-2 fw-semibold text-center" style={{ color: '#4338ca' }}>
                    <i className="bi bi-gear me-1"></i>Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {baux.map(b => (
                  <tr key={b.id}>
                    <td className="px-2 py-2 text-muted small">{b.id}</td>
                    <td className="px-2 py-2">
                      <Link to={`/baux/${b.id}`} state={{ bail: b }} className="text-decoration-none fw-semibold">
                        {b.numero_bail}
                      </Link>
                    </td>
                    <td className="px-2 py-2">
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="bi bi-person-fill text-primary small"></i>
                        </div>
                        <span>{b.locataire?.nom || b.locataire?.prenom ? `${b.locataire?.prenom ?? ''} ${b.locataire?.nom ?? ''}`.trim() : `#${b.locataire_id}`}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <span className="badge bg-success bg-opacity-10 text-success border border-success">
                        {b.unite?.reference || b.unite?.numero_unite || `#${b.unite_id}`}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <span className="badge bg-info bg-opacity-10 text-info">
                        {b.unite?.type_unite || '—'}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="fw-semibold text-success">{b.montant_loyer}</div>
                      <small className="text-muted">+ {b.charges} charges</small>
                    </td>
                    <td className="px-2 py-2">
                      <div className="small">
                        <div><i className="bi bi-calendar-check text-success me-1"></i>{b.date_debut}</div>
                        <div><i className="bi bi-calendar-x text-danger me-1"></i>{b.date_fin || 'Indéterminé'}</div>
                      </div>
                    </td>
                    <td className="px-2 py-2"><BailStatusBadge statut={b.statut} /></td>
                    <td className="text-center px-2 py-2">
                      <div className="d-flex justify-content-center gap-2">
                        <button 
                          className="btn btn-sm rounded-3 border-0"
                          style={{ width: '36px', height: '36px', padding: 0, background: '#dbeafe', color: '#1e40af', transition: 'all 0.2s' }}
                          onClick={() => handleDownloadPdf(b.id)}
                          title="Télécharger PDF"
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#bfdbfe'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                          </svg>
                        </button>
                        {can(PERMS.remises_cles.create) && (
                          <button
                            className="btn btn-sm rounded-3 border-0"
                            style={{ width: '36px', height: '36px', padding: 0, background: '#fef3c7', color: '#92400e', transition: 'all 0.2s' }}
                            onClick={() => setRemiseModalBail(b)}
                            title="Remise de clés"
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#fde68a'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fef3c7'; e.currentTarget.style.transform = 'scale(1)'; }}
                          >
                            <i className="bi bi-key"></i>
                          </button>
                        )}
                        <Link 
                          to={`/baux/${b.id}`} 
                          state={{ bail: b }}
                          className="btn btn-sm rounded-3 border-0"
                          style={{ width: '36px', height: '36px', padding: 0, background: '#e0e7ff', color: '#4338ca', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Modifier"
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#c7d2fe'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#e0e7ff'; e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5z"/>
                          </svg>
                        </Link>
                        <button 
                          className="btn btn-sm rounded-3 border-0"
                          style={{ width: '36px', height: '36px', padding: 0, background: '#fee2e2', color: '#b91c1c', transition: 'all 0.2s' }}
                          disabled={isDeleting} 
                          onClick={() => {
                            if (window.confirm('Supprimer ce bail définitivement ?')) deleteBail(b.id);
                          }} 
                          title="Supprimer"
                          onMouseEnter={(e) => { if (!isDeleting) { e.currentTarget.style.background = '#fecaca'; e.currentTarget.style.transform = 'scale(1.1)'; } }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
      {remiseModalBail && (
        <RemiseCleModal
          bailId={remiseModalBail.id}
          bail={remiseModalBail}
          onClose={() => setRemiseModalBail(null)}
          onCreated={() => { /* optionally notify */ }}
        />
      )}
    </div>
  );
}
