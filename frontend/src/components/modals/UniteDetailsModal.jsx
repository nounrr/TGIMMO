export default function UniteDetailsModal({ show, onHide, unite }) {
  if (!show || !unite) return null;

  const typeLabels = {
    appartement: 'Appartement',
    bureau: 'Bureau',
    local_commercial: 'Local commercial',
    garage: 'Garage',
    autre: 'Autre'
  };

  const statutColors = {
    vacant: { bg: '#dbeafe', color: '#1e40af' },
    loue: { bg: '#d1fae5', color: '#065f46' },
    maintenance: { bg: '#fef3c7', color: '#92400e' },
    reserve: { bg: '#e0e7ff', color: '#4338ca' }
  };

  const statutLabels = {
    vacant: 'Vacant',
    loue: 'Loué',
    maintenance: 'Maintenance',
    reserve: 'Réservé'
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop fade show" 
        onClick={onHide}
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)'
        }}
      />
      
      {/* Modal */}
      <div 
        className="modal fade show d-block" 
        tabIndex={-1}
        onClick={onHide}
      >
        <div 
          className="modal-dialog modal-lg modal-dialog-scrollable"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            borderRadius: '24px',
            overflow: 'hidden',
            border: 'none'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              border: 'none',
              padding: '32px',
              position: 'relative'
            }}>
              <button
                type="button"
                onClick={onHide}
                style={{
                  position: 'absolute',
                  right: '24px',
                  top: '24px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: '20px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              >
                ×
              </button>
              
              <div className="w-100">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-3 d-flex align-items-center justify-content-center"
                         style={{ width: 48, height: 48, background: 'rgba(255, 255, 255, 0.2)' }}>
                      <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5ZM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5 5 5Z"/>
                      </svg>
                    </div>
                    <div>
                      <h5 className="mb-1 fw-bold">{unite.numero_unite}</h5>
                      <div className="small opacity-90">{typeLabels[unite.type_unite] || unite.type_unite}</div>
                    </div>
                  </div>
                  <span className="badge rounded-pill px-4 py-2 fw-medium" style={{
                    backgroundColor: statutColors[unite.statut]?.bg || '#f3f4f6',
                    color: statutColors[unite.statut]?.color || '#1f2937',
                    fontSize: '0.875rem'
                  }}>
                    {statutLabels[unite.statut] || unite.statut}
                  </span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '32px', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Adresse */}
          {unite.adresse_complete && (
            <div className="rounded-4 p-4 mb-4" style={{ background: 'rgba(99, 102, 241, 0.05)' }}>
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#4f46e5' }}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                </svg>
                Adresse
              </h6>
              <div className="text-slate-700">{unite.adresse_complete}</div>
            </div>
          )}

          {/* Localisation */}
          {(unite.immeuble || unite.bloc || unite.etage) && (
            <div className="rounded-4 p-4 mb-4" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#059669' }}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 1a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1v8.5a1.5 1.5 0 0 1-1.5 1.5h-2A1.5 1.5 0 0 1 1 11.5V3a1 1 0 0 1-1-1V1zm1 0v1h5V1H1zm1 2v8.5a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5V3H2zm7-2a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1v8.5a1.5 1.5 0 0 1-1.5 1.5h-2a1.5 1.5 0 0 1-1.5-1.5V3a1 1 0 0 1-1-1V1zm1 0v1h5V1H10zm1 2v8.5a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5V3h-3z"/>
                </svg>
                Localisation
              </h6>
              <div className="row g-3">
                {unite.immeuble && (
                  <div className="col-md-4">
                    <div className="small text-muted mb-1">Immeuble</div>
                    <div className="fw-semibold text-slate-700">{unite.immeuble}</div>
                  </div>
                )}
                {unite.bloc && (
                  <div className="col-md-4">
                    <div className="small text-muted mb-1">Bloc</div>
                    <div className="fw-semibold text-slate-700">{unite.bloc}</div>
                  </div>
                )}
                {unite.etage && (
                  <div className="col-md-4">
                    <div className="small text-muted mb-1">Étage</div>
                    <div className="fw-semibold text-slate-700">{unite.etage}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Caractéristiques */}
          {(unite.superficie_m2 || unite.nb_pieces || unite.nb_sdb) && (
            <div className="rounded-4 p-4 mb-4" style={{ background: 'rgba(245, 158, 11, 0.05)' }}>
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#d97706' }}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z"/>
                </svg>
                Caractéristiques
              </h6>
              <div className="row g-3">
                {unite.superficie_m2 && (
                  <div className="col-md-4">
                    <div className="d-flex align-items-center gap-2">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ color: '#f59e0b' }}>
                        <path d="M0 0h4v4H0V0zm0 6h4v4H0V6zm0 6h4v4H0v-4zm6-12h4v4H6V0zm0 6h4v4H6V6zm0 6h4v4H6v-4zm6-12h4v4h-4V0zm0 6h4v4h-4V6zm0 6h4v4h-4v-4z"/>
                      </svg>
                      <div>
                        <div className="small text-muted">Superficie</div>
                        <div className="fw-semibold text-slate-700">{unite.superficie_m2} m²</div>
                      </div>
                    </div>
                  </div>
                )}
                {unite.nb_pieces && (
                  <div className="col-md-4">
                    <div className="d-flex align-items-center gap-2">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ color: '#f59e0b' }}>
                        <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5ZM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5 5 5Z"/>
                      </svg>
                      <div>
                        <div className="small text-muted">Pièces</div>
                        <div className="fw-semibold text-slate-700">{unite.nb_pieces}</div>
                      </div>
                    </div>
                  </div>
                )}
                {unite.nb_sdb && (
                  <div className="col-md-4">
                    <div className="d-flex align-items-center gap-2">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ color: '#f59e0b' }}>
                        <path d="M0 12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v9zm2-9a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3z"/>
                      </svg>
                      <div>
                        <div className="small text-muted">Salles de bain</div>
                        <div className="fw-semibold text-slate-700">{unite.nb_sdb}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Équipements */}
          {unite.equipements && (
            <div className="rounded-4 p-4 mb-4" style={{ background: 'rgba(139, 92, 246, 0.05)' }}>
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#7c3aed' }}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                  <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z"/>
                </svg>
                Équipements
              </h6>
              <div className="text-slate-700" style={{ whiteSpace: 'pre-wrap' }}>{unite.equipements}</div>
            </div>
          )}

          {/* Mobilier */}
          {unite.mobilier && (
            <div className="rounded-4 p-4 mb-4" style={{ background: 'rgba(139, 92, 246, 0.05)' }}>
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#7c3aed' }}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                </svg>
                Mobilier
              </h6>
              <div className="text-slate-700" style={{ whiteSpace: 'pre-wrap' }}>{unite.mobilier}</div>
            </div>
          )}

          {/* Locataire actuel */}
          {(unite.locataire_actuel || unite.date_entree_actuelle) && (
            <div className="rounded-4 p-4" style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#2563eb' }}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                  <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm12 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1v-1c0-1-1-4-6-4s-6 3-6 4v1a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12z"/>
                </svg>
                Location actuelle
              </h6>
              <div className="row g-3">
                {unite.locataire_actuel && (
                  <div className="col-md-6">
                    <div className="small text-muted mb-1">Locataire</div>
                    <div className="fw-semibold text-slate-700">
                      {unite.locataire_actuel.nom} {unite.locataire_actuel.prenom}
                    </div>
                  </div>
                )}
                {unite.date_entree_actuelle && (
                  <div className="col-md-6">
                    <div className="small text-muted mb-1">Date d'entrée</div>
                    <div className="fw-semibold text-slate-700">
                      {new Date(unite.date_entree_actuelle).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                )}
                {unite.bail_actuel_id && (
                  <div className="col-md-6">
                    <div className="small text-muted mb-1">ID Bail</div>
                    <div className="fw-semibold text-slate-700">#{unite.bail_actuel_id}</div>
                  </div>
                )}
              </div>
            </div>
          )}
            </div>

            {/* Footer */}
            <div style={{ 
              border: 'none', 
              padding: '24px 32px',
              background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)'
            }}>
              <button
                className="btn btn-lg px-4 rounded-3"
                onClick={onHide}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  fontWeight: '600'
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
