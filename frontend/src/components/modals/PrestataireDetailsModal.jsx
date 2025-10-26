export default function PrestataireDetailsModal({ show, onHide, prestataire }) {
  if (!show || !prestataire) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1040 }}
        onClick={onHide}
      />

      {/* Modal */}
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }} onClick={onHide}>
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
            {/* Header */}
            <div className="modal-header border-0 pb-0 px-4 pt-4">
              <div>
                <h5 className="modal-title fw-bold mb-1" style={{
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.5rem'
                }}>
                  Détails du prestataire
                </h5>
                <p className="text-muted small mb-0">Informations complètes</p>
              </div>
              <button type="button" className="btn-close" onClick={onHide}
                style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f1f5f9', opacity: 1, transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
              />
            </div>

            {/* Body */}
            <div className="modal-body px-4 py-4">
              {/* Header card */}
              <div className="card border-0 rounded-4 mb-4" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                <div className="card-body p-4 text-white">
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                    <div>
                      <h4 className="fw-bold mb-2">{prestataire.nom_raison}</h4>
                      {prestataire.domaine_activite && (
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M11 2a1 1 0 0 1 1 1v1H4V3a1 1 0 0 1 1-1h6zM4 6h8v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6z"/>
                          </svg>
                          <span className="fw-medium">{prestataire.domaine_activite}</span>
                        </div>
                      )}
                    </div>
                    {prestataire.contact_nom && (
                      <div className="text-end">
                        <div className="small opacity-75">Contact</div>
                        <div className="fw-semibold">{prestataire.contact_nom}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Identifiants */}
              {(prestataire.rc || prestataire.ice || prestataire.ifiscale || prestataire.rib) && (
                <div className="card border-0 rounded-4 mb-4" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#059669' }}>
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1H2zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7z"/>
                      </svg>
                      Identifiants
                    </h6>
                    <div className="row g-3">
                      {prestataire.rc && (
                        <div className="col-md-6">
                          <div className="text-muted small">RC</div>
                          <div className="fw-semibold text-slate-800">{prestataire.rc}</div>
                        </div>
                      )}
                      {prestataire.ice && (
                        <div className="col-md-6">
                          <div className="text-muted small">ICE</div>
                          <div className="fw-semibold text-slate-800">{prestataire.ice}</div>
                        </div>
                      )}
                      {prestataire.ifiscale && (
                        <div className="col-md-6">
                          <div className="text-muted small">Identifiant Fiscal</div>
                          <div className="fw-semibold text-slate-800">{prestataire.ifiscale}</div>
                        </div>
                      )}
                      {prestataire.rib && (
                        <div className="col-md-6">
                          <div className="text-muted small">RIB</div>
                          <div className="fw-semibold text-slate-800">{prestataire.rib}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Coordonnées */}
              {(prestataire.adresse || prestataire.telephone || prestataire.email) && (
                <div className="card border-0 rounded-4 mb-4" style={{ background: 'rgba(245, 158, 11, 0.05)' }}>
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#d97706' }}>
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z"/>
                        <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>
                      </svg>
                      Coordonnées
                    </h6>
                    <div className="row g-3">
                      {prestataire.adresse && (
                        <div className="col-12">
                          <div className="text-muted small">Adresse</div>
                          <div className="fw-medium text-slate-800">{prestataire.adresse}</div>
                        </div>
                      )}
                      {prestataire.telephone && (
                        <div className="col-md-6">
                          <div className="text-muted small">Téléphone</div>
                          <div className="fw-semibold text-slate-800">{prestataire.telephone}</div>
                        </div>
                      )}
                      {prestataire.email && (
                        <div className="col-md-6">
                          <div className="text-muted small">Email</div>
                          <div className="fw-medium text-slate-800 text-break">{prestataire.email}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer border-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-lg px-5 fw-semibold"
                onClick={onHide}
                style={{ background: 'linear-gradient(135deg, #e0e7ff, #ede9fe)', color: '#4338ca', border: 'none', borderRadius: '12px', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #c7d2fe, #ddd6fe)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #e0e7ff, #ede9fe)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
