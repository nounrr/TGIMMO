import React, { useMemo, useState } from 'react';
import { useGetDevisQuery } from '../api/baseApi';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';

export default function Devis() {
  const { can } = useAuthz();
  const [status, setStatus] = useState('');
  const [prestataireId, setPrestataireId] = useState('');
  const [interventionId, setInterventionId] = useState('');

  const params = useMemo(() => ({
    status: status || undefined,
    prestataire_id: prestataireId || undefined,
    intervention_id: interventionId || undefined,
  }), [status, prestataireId, interventionId]);

  const { data, isLoading } = useGetDevisQuery(params);
  const items = data?.data || [];

  if (!can(PERMS.devis.view)) {
    return <div className="container py-4"><div className="alert alert-warning">Accès refusé</div></div>;
  }

  const statusBadge = (st) => {
    const cfg = {
      propose: { color: 'info', icon: 'file-earmark-text', label: 'Proposé' },
      accepte: { color: 'success', icon: 'check-circle-fill', label: 'Accepté' },
      refuse: { color: 'danger', icon: 'x-circle', label: 'Refusé' },
    };
    const c = cfg[st] || { color: 'secondary', icon: 'circle', label: st };
    return <span className={`badge bg-${c.color} d-inline-flex align-items-center gap-1`}><i className={`bi bi-${c.icon}`} style={{fontSize:'0.7rem'}}></i>{c.label}</span>;
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-3">
            <div className="bg-success bg-gradient p-3 rounded-3 shadow-sm">
              <i className="bi bi-file-earmark-text-fill text-white fs-3"></i>
            </div>
            <span>Devis</span>
          </h2>
          <p className="text-muted mb-0">Gestion des devis pour interventions.</p>
        </div>
      </div>

      <div className="card mb-4 border-0 shadow-sm rounded-3">
        <div className="card-header bg-gradient" style={{background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', borderBottom: '2px solid #dee2e6'}}>
          <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
            <i className="bi bi-funnel-fill text-success"></i>Filtres de recherche
          </h6>
        </div>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold text-dark small mb-2">
                <i className="bi bi-circle-fill me-1 text-muted" style={{fontSize:'0.5rem'}}></i>Statut
              </label>
              <select className="form-select form-select-lg border-2" value={status} onChange={e=>setStatus(e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="propose">📝 Proposé</option>
                <option value="accepte">✅ Accepté</option>
                <option value="refuse">❌ Refusé</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold text-dark small mb-2">
                <i className="bi bi-building me-1 text-muted"></i>Prestataire ID
              </label>
              <input 
                type="number" 
                className="form-control form-control-lg border-2" 
                value={prestataireId} 
                onChange={e=>setPrestataireId(e.target.value)} 
                placeholder="ID du prestataire..."
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold text-dark small mb-2">
                <i className="bi bi-tools me-1 text-muted"></i>Intervention ID
              </label>
              <input 
                type="number" 
                className="form-control form-control-lg border-2" 
                value={interventionId} 
                onChange={e=>setInterventionId(e.target.value)} 
                placeholder="ID de l'intervention..."
              />
            </div>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
            <button 
              className="btn btn-outline-secondary btn-lg d-inline-flex align-items-center gap-2" 
              onClick={()=>{setStatus('');setPrestataireId('');setInterventionId('');}}
            >
              <i className="bi bi-arrow-counterclockwise"></i>Réinitialiser
            </button>
            <div className="badge bg-light text-dark border px-3 py-2">
              {isLoading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Chargement...</>
              ) : (
                <><i className="bi bi-list-ul me-2"></i>{items.length} devis</>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-lg rounded-4 overflow-hidden"
        style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)' }}
      >
        <div className="card-body p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <p className="text-muted mt-3">Chargement des devis...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-5">
              <div className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                style={{ width: 80, height: 80, background: 'rgba(25, 135, 84, 0.1)' }}
              >
                <svg width="40" height="40" fill="currentColor" viewBox="0 0 16 16" style={{ opacity: 0.5 }}>
                  <path d="M4 0a2 2 0 0 0-2 2v11.293A1 1 0 0 0 2.293 14l2.853 2.853A1 1 0 0 0 6 17.293V16h6a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4z"/>
                  <path d="M8.5 4.5a.5.5 0 0 1 .5.5v.5H10a.5.5 0 0 1 0 1H9v.5a.5.5 0 0 1-1 0V6H7a.5.5 0 0 1 0-1h1V5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M5 10.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
                </svg>
              </div>
              <h5 className="fw-bold mb-2">Aucun devis trouvé</h5>
              <p className="text-muted mb-0">
                {(status || prestataireId || interventionId) ? 'Essayez de modifier vos critères de recherche' : 'Commencez par ajouter un nouveau devis'}
              </p>
            </div>
          ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)', borderBottom: '2px solid #c7d2fe' }}>
                <tr>
                  <th className="px-4 py-3 fw-semibold" style={{ color: '#4338ca' }}>
                    <i className="bi bi-hash me-1"></i>ID
                  </th>
                  <th className="px-4 py-3 fw-semibold" style={{ color: '#4338ca' }}>
                    <i className="bi bi-upc me-1"></i>Numéro
                  </th>
                  <th className="px-4 py-3 fw-semibold" style={{ color: '#4338ca' }}>
                    <i className="bi bi-calendar-event me-1"></i>Date proposition
                  </th>
                  <th className="px-4 py-3 fw-semibold" style={{ color: '#4338ca' }}>
                    <i className="bi bi-building me-1"></i>Prestataire
                  </th>
                  <th className="px-4 py-3 fw-semibold" style={{ color: '#4338ca' }}>
                    <i className="bi bi-cash me-1"></i>Montant HT
                  </th>
                  <th className="px-4 py-3 fw-semibold" style={{ color: '#4338ca' }}>
                    <i className="bi bi-cash-stack me-1"></i>Total TTC
                  </th>
                  <th className="px-4 py-3 fw-semibold" style={{ color: '#4338ca' }}>
                    <i className="bi bi-circle me-1"></i>Statut
                  </th>
                  <th className="px-4 py-3 fw-semibold text-center" style={{ color: '#4338ca' }}>
                    <i className="bi bi-download me-1"></i>Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3 text-muted small">{d.id}</td>
                    <td className="px-4 py-3 fw-semibold">{d.numero || `DEV-${d.id}`}</td>
                    <td className="px-4 py-3 small">{d.date_proposition ? new Date(d.date_proposition).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-4 py-3 small">
                      {d.prestataire ? (
                        <span className="badge bg-light text-dark border">
                          <i className="bi bi-building me-1"></i>{d.prestataire.nom}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 fw-semibold">{Number(d.montant_ht).toLocaleString('fr-FR', {minimumFractionDigits:2})} MAD</td>
                    <td className="px-4 py-3 fw-bold text-success">{Number(d.total_ttc).toLocaleString('fr-FR', {minimumFractionDigits:2})} MAD</td>
                    <td className="px-4 py-3">{statusBadge(d.status)}</td>
                    <td className="text-center px-4 py-3">
                      <a 
                        href={`/api/v1/devis/${d.id}/docx`}
                        className="btn btn-sm rounded-3 border-0"
                        style={{ width: '36px', height: '36px', padding: 0, background: '#dbeafe', color: '#1e40af', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Télécharger DOCX"
                        target="_blank"
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#bfdbfe'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                          <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                        </svg>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
