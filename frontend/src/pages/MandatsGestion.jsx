import { useState } from 'react';
import { useGetMandatsQuery } from '../api/baseApi';
import { useGetProprietairesQuery } from '../features/proprietaires/proprietairesApi';
import { Link } from 'react-router-dom';
import MandatStatusBadge from '../components/MandatStatusBadge';

export default function MandatsGestion() {
  const [q, setQ] = useState('');
  const [proprietaireId, setProprietaireId] = useState('');
  
  const queryParams = {};
  if (q) queryParams.q = q;
  if (proprietaireId) queryParams.proprietaire_id = proprietaireId;
  
  const { data, isFetching, refetch } = useGetMandatsQuery(Object.keys(queryParams).length > 0 ? queryParams : undefined);
  const { data: proprietairesData } = useGetProprietairesQuery({ per_page: 1000 });
  
  const rows = data?.data || data || [];
  const proprietaires = proprietairesData?.data || [];

  return (
    <div className="p-3 p-lg-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h4 fw-bold mb-1" style={{
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Mandats de gestion</h1>
          <p className="text-muted mb-0">Liste des mandats créés (brouillons et actifs)</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-3">
        <div className="card-body p-3">
          <div className="row g-2 align-items-end">
            <div className="col-sm-5">
              <label className="form-label fw-semibold small mb-1">Recherche</label>
              <input
                type="text"
                className="form-control"
                placeholder="Référence, lieu..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="col-sm-5">
              <label className="form-label fw-semibold small mb-1">
                <i className="bi bi-person-badge text-primary me-1"></i>Propriétaire
              </label>
              <select 
                className="form-select" 
                value={proprietaireId} 
                onChange={(e) => setProprietaireId(e.target.value)}
              >
                <option value="">Tous les propriétaires</option>
                {proprietaires.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nom_raison || p.email || `#${p.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-sm-2 d-flex gap-2">
              <button 
                className="btn btn-outline-secondary flex-fill" 
                onClick={() => { setQ(''); setProprietaireId(''); refetch(); }}
              >
                <i className="bi bi-arrow-counterclockwise"></i>
              </button>
              <button className="btn btn-primary flex-fill" onClick={() => refetch()}>
                <i className="bi bi-search"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-lg rounded-4 overflow-hidden"
        style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)' }}
      >
        <div className="card-body p-0">
          {isFetching ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <p className="text-muted mt-3">Chargement des mandats...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-5">
              <div className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                style={{ width: 80, height: 80, background: 'rgba(99, 102, 241, 0.1)' }}
              >
                <svg width="40" height="40" fill="currentColor" viewBox="0 0 16 16" style={{ opacity: 0.5 }}>
                  <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
                </svg>
              </div>
              <h5 className="fw-bold mb-2">Aucun mandat trouvé</h5>
              <p className="text-muted mb-0">Commencez par créer un nouveau mandat</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)', borderBottom: '2px solid #c7d2fe' }}>
                  <tr>
                    <th className="px-4 py-3 fw-semibold" style={{ color: '#4338ca' }}>
                      <i className="bi bi-hash me-1"></i>Référence
                    </th>
                    <th className="px-4 py-3 fw-semibold" style={{ color: '#4338ca' }}>
                      <i className="bi bi-person-badge me-1"></i>Propriétaire
                    </th>
                    <th className="px-4 py-3 fw-semibold" style={{ color: '#4338ca' }}>
                      <i className="bi bi-calendar-check me-1"></i>Date début
                    </th>
                    <th className="px-4 py-3 fw-semibold" style={{ color: '#4338ca' }}>
                      <i className="bi bi-flag me-1"></i>Statut
                    </th>
                    <th className="px-4 py-3 fw-semibold" style={{ color: '#4338ca' }}>
                      <i className="bi bi-translate me-1"></i>Langue
                    </th>
                    <th className="px-4 py-3 fw-semibold text-center" style={{ color: '#4338ca' }}>
                      <i className="bi bi-gear me-1"></i>Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-3">{m.reference || <span className="text-muted">—</span>}</td>
                      <td className="px-4 py-3">{m.proprietaire?.nom_raison || m.proprietaire?.email || `#${m.proprietaire_id}`}</td>
                      <td className="px-4 py-3">{m.date_debut}</td>
                      <td className="px-4 py-3"><MandatStatusBadge statut={m.statut} /></td>
                      <td className="px-4 py-3">{m.langue || <span className="text-muted">—</span>}</td>
                      <td className="text-center px-4 py-3">
                        <Link 
                          className="btn btn-sm rounded-3 border-0" 
                          to={`/mandats/${m.id}`}
                          state={{ mandat: m }}
                          title="Voir les détails"
                          style={{ width: '36px', height: '36px', padding: 0, background: '#dbeafe', color: '#1e40af', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#bfdbfe'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                            <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                          </svg>
                        </Link>
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
