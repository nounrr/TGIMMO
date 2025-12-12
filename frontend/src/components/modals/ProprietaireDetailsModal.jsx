export default function ProprietaireDetailsModal({ show, onHide, proprietaire }) {
  if (!show || !proprietaire) return null;

  const statutLabels = {
    brouillon: 'Brouillon',
    signe: 'Signé',
    actif: 'Actif',
    resilie: 'Résilié'
  };

  const statutColors = {
    brouillon: { bg: '#fef3c7', color: '#92400e' },
    signe: { bg: '#dbeafe', color: '#1e40af' },
    actif: { bg: '#d1fae5', color: '#065f46' },
    resilie: { bg: '#fee2e2', color: '#991b1b' }
  };

  const typeLabels = {
    unique: 'Propriétaire unique',
    coproprietaire: 'Copropriétaire',
    heritier: 'Héritier',
    sci: 'SCI',
    autre: 'Autre'
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop fade show" 
        style={{ 
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1040
        }}
        onClick={onHide}
      />

      {/* Modal */}
      <div 
        className="modal fade show d-block" 
        tabIndex="-1" 
        style={{ zIndex: 1050 }}
        onClick={onHide}
      >
        <div 
          className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '900px' }}
        >
          <div className="modal-content border-0 shadow-lg" style={{ 
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
          }}>
            {/* Header */}
            <div className="modal-header border-0 pb-0 px-4 pt-4">
              <div>
                <h5 className="modal-title fw-bold mb-1" style={{
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '1.5rem'
                }}>
                  Détails du propriétaire
                </h5>
                <p className="text-muted small mb-0">Informations complètes</p>
              </div>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onHide}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: '#f1f5f9',
                  opacity: 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e2e8f0';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
              />
            </div>

            {/* Body */}
            <div className="modal-body px-4 py-4">
              {/* Section: En-tête avec statut */}
              <div className="card border-0 rounded-4 mb-4" 
                   style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                <div className="card-body p-4 text-white">
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                    <div>
                      <h4 className="fw-bold mb-2">{proprietaire.nom_raison}</h4>
                      {(proprietaire.nom_ar || proprietaire.prenom_ar) && (
                        <div className="mb-2" dir="rtl" style={{ fontSize: '1.1rem', opacity: 0.95 }}>
                          {proprietaire.nom_ar} {proprietaire.prenom_ar}
                        </div>
                      )}
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1H2zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7z"/>
                        </svg>
                        <span className="fw-medium">{typeLabels[proprietaire.type_proprietaire] || proprietaire.type_proprietaire}</span>
                      </div>
                    </div>
                    <div>
                      <span className="badge rounded-pill px-4 py-2 fw-semibold" style={{
                        backgroundColor: statutColors[proprietaire.statut]?.bg || '#f3f4f6',
                        color: statutColors[proprietaire.statut]?.color || '#1f2937',
                        fontSize: '0.95rem'
                      }}>
                        {statutLabels[proprietaire.statut] || proprietaire.statut}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Identifiants */}
              {(proprietaire.cin || proprietaire.rc || proprietaire.ice || proprietaire.ifiscale) && (
                <div className="card border-0 rounded-4 mb-4" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#059669' }}>
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1H2zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7z"/>
                      </svg>
                      Identifiants
                    </h6>

                    <div className="row g-3">
                      {proprietaire.cin && (
                        <div className="col-md-6">
                          <div className="d-flex align-items-start gap-2">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-emerald-600 mt-1">
                              <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1H2zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7z"/>
                            </svg>
                            <div>
                              <div className="text-muted small">CIN</div>
                              <div className="fw-semibold text-slate-800">{proprietaire.cin}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {proprietaire.rc && (
                        <div className="col-md-6">
                          <div className="d-flex align-items-start gap-2">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-emerald-600 mt-1">
                              <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z"/>
                            </svg>
                            <div>
                              <div className="text-muted small">Registre Commerce</div>
                              <div className="fw-semibold text-slate-800">{proprietaire.rc}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {proprietaire.ice && (
                        <div className="col-md-6">
                          <div className="d-flex align-items-start gap-2">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-emerald-600 mt-1">
                              <path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V1zm11 0H3v14h3v-2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V15h3V1z"/>
                            </svg>
                            <div>
                              <div className="text-muted small">ICE</div>
                              <div className="fw-semibold text-slate-800">{proprietaire.ice}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {proprietaire.ifiscale && (
                        <div className="col-md-6">
                          <div className="d-flex align-items-start gap-2">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-emerald-600 mt-1">
                              <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                              <path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V5zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2H3z"/>
                            </svg>
                            <div>
                              <div className="text-muted small">Identifiant Fiscal</div>
                              <div className="fw-semibold text-slate-800">{proprietaire.ifiscale}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Section: Coordonnées */}
              <div className="card border-0 rounded-4 mb-4" style={{ background: 'rgba(245, 158, 11, 0.05)' }}>
                <div className="card-body p-4">
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#d97706' }}>
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z"/>
                      <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                    </svg>
                    Coordonnées
                  </h6>

                  <div className="row g-3">
                    {proprietaire.adresse && (
                      <div className="col-12">
                        <div className="d-flex align-items-start gap-2">
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-amber-600 mt-1">
                            <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z"/>
                            <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                          </svg>
                          <div className="flex-grow-1">
                            <div className="text-muted small">Adresse</div>
                            <div className="fw-medium text-slate-800">{proprietaire.adresse}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {proprietaire.adresse_ar && (
                      <div className="col-12">
                        <div className="d-flex align-items-start gap-2">
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-amber-600 mt-1">
                            <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z"/>
                            <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                          </svg>
                          <div className="flex-grow-1">
                            <div className="text-muted small">العنوان بالعربية</div>
                            <div className="fw-medium text-slate-800" dir="rtl">{proprietaire.adresse_ar}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {proprietaire.telephone && (
                      <div className="col-md-6">
                        <div className="d-flex align-items-start gap-2">
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-amber-600 mt-1">
                            <path fillRule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/>
                          </svg>
                          <div>
                            <div className="text-muted small">Téléphone</div>
                            <div className="fw-semibold text-slate-800">{proprietaire.telephone}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {proprietaire.email && (
                      <div className="col-md-6">
                        <div className="d-flex align-items-start gap-2">
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-amber-600 mt-1">
                            <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z"/>
                          </svg>
                          <div className="flex-grow-1">
                            <div className="text-muted small">Email</div>
                            <div className="fw-medium text-slate-800 text-break">{proprietaire.email}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section: Représentant */}
              {(proprietaire.representant_nom || proprietaire.representant_fonction || proprietaire.representant_cin) && (
                <div className="card border-0 rounded-4 mb-4" style={{ background: 'rgba(139, 92, 246, 0.05)' }}>
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#7c3aed' }}>
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"/>
                      </svg>
                      Représentant légal
                    </h6>

                    <div className="row g-3">
                      {proprietaire.representant_nom && (
                        <div className="col-md-4">
                          <div className="text-muted small">Nom</div>
                          <div className="fw-semibold text-slate-800">{proprietaire.representant_nom}</div>
                        </div>
                      )}

                      {proprietaire.representant_fonction && (
                        <div className="col-md-4">
                          <div className="text-muted small">Fonction</div>
                          <div className="fw-semibold text-slate-800">{proprietaire.representant_fonction}</div>
                        </div>
                      )}

                      {proprietaire.representant_cin && (
                        <div className="col-md-4">
                          <div className="text-muted small">CIN</div>
                          <div className="fw-semibold text-slate-800">{proprietaire.representant_cin}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Section: Conditions de gestion */}
              <div className="card border-0 rounded-4 mb-4" style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
                <div className="card-body p-4">
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#2563eb' }}>
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                      <path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V5zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2H3z"/>
                    </svg>
                    Conditions de gestion
                  </h6>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="d-flex align-items-center gap-2">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-blue-600">
                          <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                        </svg>
                        <div>
                          <div className="text-muted small">Taux de gestion TGI</div>
                          <div className="fw-bold text-slate-800">
                            {proprietaire.taux_gestion_tgi_pct ? `${proprietaire.taux_gestion_tgi_pct}%` : 'Non défini'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="d-flex align-items-center gap-2">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-blue-600">
                          <path d="M0 3a2 2 0 0 1 2-2h13.5a.5.5 0 0 1 0 1H15v2a1 1 0 0 1 1 1v8.5a1.5 1.5 0 0 1-1.5 1.5h-12A2.5 2.5 0 0 1 0 12.5V3zm1 1.732V12.5A1.5 1.5 0 0 0 2.5 14h12a.5.5 0 0 0 .5-.5V5H2a1.99 1.99 0 0 1-1-.268zM1 3a1 1 0 0 0 1 1h12V2H2a1 1 0 0 0-1 1z"/>
                        </svg>
                        <div>
                          <div className="text-muted small">Taux des honoraires</div>
                          <div className="fw-bold text-slate-800">
                            {proprietaire.taux_gestion ? `${proprietaire.taux_gestion}%` : 'Non défini'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {proprietaire.conditions_particulieres && (
                      <div className="col-12">
                        <div className="text-muted small mb-2">Conditions particulières</div>
                        <div className="p-3 rounded-3" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                          <p className="mb-0 text-slate-700" style={{ whiteSpace: 'pre-wrap' }}>
                            {proprietaire.conditions_particulieres}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer border-0 px-4 pb-4">
              <button
                type="button"
                className="btn px-4 fw-semibold"
                onClick={onHide}
                style={{
                  background: 'linear-gradient(135deg, #e0e7ff, #ede9fe)',
                  color: '#4338ca',
                  border: 'none',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  padding: '0.5rem 1.25rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #c7d2fe, #ddd6fe)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #e0e7ff, #ede9fe)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
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
