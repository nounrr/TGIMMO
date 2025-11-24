import React, { useMemo, useState } from 'react';
import { useGetFacturesQuery } from '../api/baseApi';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';

export default function Factures() {
  const { can } = useAuthz();
  const [status, setStatus] = useState('');
  const [prestataireId, setPrestataireId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const params = useMemo(() => ({
    status: status || undefined,
    prestataire_id: prestataireId || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  }), [status, prestataireId, dateFrom, dateTo]);

  const { data, isLoading } = useGetFacturesQuery(params);
  const items = data?.data || [];

  // Calculate totals
  const totals = useMemo(() => {
    if (!items.length) return { ht: 0, ttc: 0, count: 0 };
    return items.reduce((acc, f) => ({
      ht: acc.ht + Number(f.montant_ht || 0),
      ttc: acc.ttc + Number(f.total_ttc || 0),
      count: acc.count + 1
    }), { ht: 0, ttc: 0, count: 0 });
  }, [items]);

  if (!can(PERMS.factures.view)) {
    return <div className="container py-4"><div className="alert alert-warning">Accès refusé</div></div>;
  }

  const statusBadge = (st) => {
    const cfg = {
      brouillon: { color: 'secondary', icon: 'file-earmark', label: 'Brouillon' },
      emise: { color: 'primary', icon: 'send', label: 'Émise' },
      payee: { color: 'success', icon: 'check-circle-fill', label: 'Payée' },
      annulee: { color: 'danger', icon: 'x-circle', label: 'Annulée' },
    };
    const c = cfg[st] || { color: 'light', icon: 'circle', label: st };
    return <span className={`badge bg-${c.color} d-inline-flex align-items-center gap-1`}><i className={`bi bi-${c.icon}`} style={{fontSize:'0.7rem'}}></i>{c.label}</span>;
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-3">
            <div className="bg-warning bg-gradient p-3 rounded-3 shadow-sm">
              <i className="bi bi-receipt-cutoff text-white fs-3"></i>
            </div>
            <span>Factures</span>
          </h2>
          <p className="text-muted mb-0">Gestion et suivi des factures prestataires.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-gradient" style={{background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)'}}>
            <div className="card-body text-white">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="small opacity-75 mb-1">Total HT</div>
                  <h3 className="mb-0 fw-bold">{totals.ht.toLocaleString('fr-FR', {minimumFractionDigits:2})} MAD</h3>
                </div>
                <div className="bg-white bg-opacity-25 p-3 rounded-3">
                  <i className="bi bi-cash-stack fs-2"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-gradient" style={{background: 'linear-gradient(135deg, #198754 0%, #146c43 100%)'}}>
            <div className="card-body text-white">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="small opacity-75 mb-1">Total TTC</div>
                  <h3 className="mb-0 fw-bold">{totals.ttc.toLocaleString('fr-FR', {minimumFractionDigits:2})} MAD</h3>
                </div>
                <div className="bg-white bg-opacity-25 p-3 rounded-3">
                  <i className="bi bi-currency-exchange fs-2"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-gradient" style={{background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)'}}>
            <div className="card-body text-white">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="small opacity-75 mb-1">Nombre de factures</div>
                  <h3 className="mb-0 fw-bold">{totals.count}</h3>
                </div>
                <div className="bg-white bg-opacity-25 p-3 rounded-3">
                  <i className="bi bi-receipt fs-2"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4 border-0 shadow-sm rounded-3">
        <div className="card-header bg-gradient" style={{background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', borderBottom: '2px solid #dee2e6'}}>
          <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
            <i className="bi bi-funnel-fill text-warning"></i>Filtres de recherche
          </h6>
        </div>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label fw-semibold text-dark small mb-2">
                <i className="bi bi-circle-fill me-1 text-muted" style={{fontSize:'0.5rem'}}></i>Statut
              </label>
              <select className="form-select form-select-lg border-2" value={status} onChange={e=>setStatus(e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="brouillon">📝 Brouillon</option>
                <option value="emise">📤 Émise</option>
                <option value="payee">✅ Payée</option>
                <option value="annulee">❌ Annulée</option>
              </select>
            </div>
            <div className="col-md-3">
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
            <div className="col-md-3">
              <label className="form-label fw-semibold text-dark small mb-2">
                <i className="bi bi-calendar-event me-1 text-muted"></i>Date de
              </label>
              <input 
                type="date" 
                className="form-control form-control-lg border-2" 
                value={dateFrom} 
                onChange={e=>setDateFrom(e.target.value)} 
              />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold text-dark small mb-2">
                <i className="bi bi-calendar-event me-1 text-muted"></i>Date à
              </label>
              <input 
                type="date" 
                className="form-control form-control-lg border-2" 
                value={dateTo} 
                onChange={e=>setDateTo(e.target.value)} 
              />
            </div>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
            <button 
              className="btn btn-outline-secondary btn-lg d-inline-flex align-items-center gap-2" 
              onClick={()=>{setStatus('');setPrestataireId('');setDateFrom('');setDateTo('');}}
            >
              <i className="bi bi-arrow-counterclockwise"></i>Réinitialiser
            </button>
            <div className="badge bg-light text-dark border px-3 py-2">
              {isLoading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Chargement...</>
              ) : (
                <><i className="bi bi-list-ul me-2"></i>{items.length} facture(s)</>
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
              <p className="text-muted mt-3">Chargement des factures...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-5">
              <div className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                style={{ width: 80, height: 80, background: 'rgba(255, 193, 7, 0.1)' }}
              >
                <svg width="40" height="40" fill="currentColor" viewBox="0 0 16 16" style={{ opacity: 0.5 }}>
                  <path d="M2 1a1 1 0 0 0-1 1v12.5a.5.5 0 0 0 .757.429L4 13.071l2.243 1.858a.5.5 0 0 0 .614 0L9.1 13.428l2.286 1.858A.5.5 0 0 0 12 14.5V2a1 1 0 0 0-1-1H2z"/>
                  <path d="M3 3h8v2H3V3zm0 3h8v2H3V6zm0 3h5v2H3V9z"/>
                </svg>
              </div>
              <h5 className="fw-bold mb-2">Aucune facture trouvée</h5>
              <p className="text-muted mb-0">
                {(status || prestataireId || dateFrom || dateTo) ? 'Essayez de modifier vos critères de recherche' : 'Commencez par ajouter une nouvelle facture'}
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
                    <i className="bi bi-calendar-event me-1"></i>Date émission
                  </th>
                  <th className="px-4 py-3 fw-semibold" style={{ color: '#4338ca' }}>
                    <i className="bi bi-calendar-check me-1"></i>Échéance
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
                {items.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-3 text-muted small">{f.id}</td>
                    <td className="px-4 py-3 fw-semibold">{f.numero || `FACT-${f.id}`}</td>
                    <td className="px-4 py-3 small">{f.date ? new Date(f.date).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-4 py-3 small">{f.due_date ? new Date(f.due_date).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-4 py-3 small">
                      {f.prestataire ? (
                        <span className="badge bg-light text-dark border">
                          <i className="bi bi-building me-1"></i>{f.prestataire.nom}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 fw-semibold">{Number(f.montant_ht).toLocaleString('fr-FR', {minimumFractionDigits:2})} MAD</td>
                    <td className="px-4 py-3 fw-bold text-success">{Number(f.total_ttc).toLocaleString('fr-FR', {minimumFractionDigits:2})} MAD</td>
                    <td className="px-4 py-3">{statusBadge(f.status)}</td>
                    <td className="text-center px-4 py-3">
                      <a 
                        href={`/api/v1/factures/${f.id}/docx`}
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
