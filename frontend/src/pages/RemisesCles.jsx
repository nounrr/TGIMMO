import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetAllRemisesClesQuery, useGetBauxQuery } from '../api/baseApi';
import { useGetLocatairesQuery } from '../features/locataires/locatairesApi';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';

export default function RemisesCles() {
  const { can } = useAuthz();
  const [q, setQ] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [locataireId, setLocataireId] = useState('');
  const [bailId, setBailId] = useState('');
  const [typeCle, setTypeCle] = useState('');
  const [withRemarque, setWithRemarque] = useState(false);

  const params = useMemo(() => ({
    q: q || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    locataire_id: locataireId || undefined,
    bail_id: bailId || undefined,
    type: typeCle || undefined,
  }), [q, dateFrom, dateTo, locataireId, bailId, typeCle]);

  const { data, isLoading } = useGetAllRemisesClesQuery(params);
  const remises = data?.data || [];

  // Sources for select filters
  const { data: bauxData } = useGetBauxQuery({ per_page: 1000 });
  const baux = bauxData?.data || [];
  const { data: locsData } = useGetLocatairesQuery({ per_page: 1000 });
  const locataires = useMemo(() => {
    if (Array.isArray(locsData?.data)) return locsData.data;
    if (Array.isArray(locsData)) return locsData;
    return [];
  }, [locsData]);

  if (!can(PERMS.remises_cles.view)) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning">Accès refusé</div>
      </div>
    );
  }

  const renderCles = (clesArr) => {
    if (!Array.isArray(clesArr) || clesArr.length === 0) return <span className="text-muted">—</span>;
    return clesArr.map(c => `${c.label || c.type} (${c.nombre})`).join(', ');
  };

  return (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <div className="bg-primary bg-opacity-10 p-2 rounded">
              <i className="bi bi-key text-primary fs-5"></i>
            </div>
            Remises de clés
          </h4>
          <p className="text-muted mb-0 small">Toutes les remises enregistrées sur l'ensemble des baux.</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/baux" className="btn btn-outline-secondary">
            <i className="bi bi-card-list me-2"></i>Baux
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-header bg-light border-0">
          <h6 className="mb-0 fw-semibold"><i className="bi bi-funnel me-2"></i>Filtres</h6>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label small fw-semibold">Recherche</label>
              <input className="form-control" placeholder="Numéro bail, locataire..." value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-semibold">Date début</label>
              <input type="date" className="form-control" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-semibold">Date fin</label>
              <input type="date" className="form-control" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-semibold">Type de clé</label>
              <select className="form-select" value={typeCle} onChange={e => setTypeCle(e.target.value)}>
                <option value="">Toutes</option>
                <option value="porte_principale">Porte principale</option>
                <option value="boite_lettres">Boîte aux lettres</option>
                <option value="portail_garage">Portail / Garage</option>
                <option value="autre">Autres</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-semibold">Locataire</label>
              <select className="form-select" value={locataireId} onChange={e => setLocataireId(e.target.value)}>
                <option value="">Tous</option>
                {locataires.map(l => (
                  <option key={l.id} value={l.id}>{l.prenom ? `${l.prenom} ${l.nom}` : l.nom || l.raison_sociale}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-semibold">Bail</label>
              <select className="form-select" value={bailId} onChange={e => setBailId(e.target.value)}>
                <option value="">Tous</option>
                {baux.map(b => (
                  <option key={b.id} value={b.id}>{b.numero_bail || `#${b.id}`}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-center">
              <div className="form-check mt-4">
                <input className="form-check-input" type="checkbox" id="withRemarqueChk" checked={withRemarque} onChange={e => setWithRemarque(e.target.checked)} />
                <label htmlFor="withRemarqueChk" className="form-check-label small fw-semibold">Avec remarques</label>
              </div>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => { setQ(''); setDateFrom(''); setDateTo(''); setLocataireId(''); setBailId(''); setTypeCle(''); setWithRemarque(false); }}
                disabled={isLoading}
              >
                <i className="bi bi-arrow-counterclockwise me-2"></i>Réinitialiser
              </button>
            </div>
          </div>
          <div className="d-flex justify-content-end mt-3 small text-muted">
            {isLoading ? 'Chargement...' : `${remises.length} remise(s)`}
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className="card border-0 shadow-lg rounded-4 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)' }}
      >
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ background: 'linear-gradient(135deg,#e0e7ff 0%, #ede9fe 100%)', borderBottom: '2px solid #c7d2fe' }}>
              <tr>
                <th className="px-2 py-2 fw-semibold" style={{ color: '#4338ca', width: '70px' }}>#</th>
                <th className="px-2 py-2 fw-semibold" style={{ color: '#4338ca', width: '160px' }}>Date</th>
                <th className="px-2 py-2 fw-semibold" style={{ color: '#4338ca' }}>Bail</th>
                <th className="px-2 py-2 fw-semibold" style={{ color: '#4338ca' }}>Locataire</th>
                <th className="px-2 py-2 fw-semibold" style={{ color: '#4338ca' }}>Clés</th>
                <th className="px-2 py-2 fw-semibold" style={{ color: '#4338ca' }}>Remarques</th>
                <th className="px-2 py-2 fw-semibold text-center" style={{ color: '#4338ca', width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="text-muted mt-3 mb-0">Chargement des remises...</p>
                  </td>
                </tr>
              )}
              {!isLoading && remises.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                      style={{ width: 80, height: 80, background: 'rgba(99,102,241,0.1)' }}>
                      <i className="bi bi-key fs-3 text-primary" style={{ opacity: .5 }}></i>
                    </div>
                    <h5 className="fw-bold mb-2">Aucune remise</h5>
                    <p className="text-muted mb-0 small">Aucune remise de clés ne correspond à votre recherche.</p>
                  </td>
                </tr>
              )}
              {!isLoading && remises
                .filter(r => !withRemarque || (r.remarques && r.remarques.trim().length > 0))
                .map(r => {
                const bail = r.bail;
                const loc = bail?.locataire;
                return (
                  <tr key={r.id}>
                    <td className="px-2 py-2 text-muted small">{r.id}</td>
                    <td className="px-2 py-2">{new Date(r.date_remise).toLocaleString()}</td>
                    <td className="px-2 py-2">
                      {bail ? (
                        <Link to={`/baux/${bail.id}`} state={{ bail }} className="text-decoration-none fw-semibold">
                          {bail.numero_bail || `#${bail.id}`}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-2 py-2">
                      {loc ? (
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-primary bg-opacity-10 rounded-circle p-2" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="bi bi-person-fill text-primary small"></i>
                          </div>
                          <span>{loc.prenom} {loc.nom}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-2 py-2 small">
                      {Array.isArray(r.cles) && r.cles.length > 0 ? (
                        <span>{r.cles.map(c => `${c.label || c.type} (${c.nombre})`).join(', ')}</span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-2 py-2 small">{r.remarques ? r.remarques.slice(0, 100) : '—'}</td>
                    <td className="px-2 py-2 text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <Link
                          to={`/baux/${bail?.id}/remise-cles`}
                          className="btn btn-sm rounded-3 border-0"
                          style={{ width: 36, height: 36, padding: 0, background: '#fef3c7', color: '#92400e', transition: 'all .2s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Voir remises du bail"
                          onMouseEnter={e => { e.currentTarget.style.background = '#fde68a'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fef3c7'; e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                          <i className="bi bi-key"></i>
                        </Link>
                        <Link
                          to={`/baux/${bail?.id}`}
                          state={{ bail }}
                          className="btn btn-sm rounded-3 border-0"
                          style={{ width: 36, height: 36, padding: 0, background: '#e0e7ff', color: '#4338ca', transition: 'all .2s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Voir bail"
                          onMouseEnter={e => { e.currentTarget.style.background = '#c7d2fe'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#e0e7ff'; e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                          <i className="bi bi-eye"></i>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
