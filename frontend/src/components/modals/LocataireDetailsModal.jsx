import { useEffect } from 'react';

export default function LocataireDetailsModal({ show, onHide, locataire }) {
  // Helper to format ISO dates like 2003-02-28T00:00:00.000000Z to dd/mm/yyyy
  const formatDate = (value) => {
    if (!value) return '-';
    try {
      if (typeof value === 'string') {
        const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})/.exec(value);
        if (m) {
          const [, y, mo, d] = m;
          return `${d}/${mo}/${y}`;
        }
      }
      const dt = new Date(value);
      if (!isNaN(dt.getTime())) {
        return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    } catch (_) {
      // ignore and fall back below
    }
    return String(value);
  };
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onHide();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [show, onHide]);

  if (!show || !locataire) return null;

  // Support both UI values ('physique'/'morale') and API values ('personne'/'societe')
  const type = locataire.type_personne;
  const isPhysique = type === 'physique' || type === 'personne';

  return (
    <div className="modal show d-block" style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)' }} onClick={onHide}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', overflow: 'hidden' }}>
          {/* Header */}
          <div className="modal-header border-0 pb-3 pt-4 px-4" style={{ 
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          }}>
            <div>
              <h5 className="modal-title fw-bold mb-1 text-white d-flex align-items-center gap-2">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/>
                  <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>
                </svg>
                Détails du locataire
              </h5>
              <p className="mb-0 small" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {isPhysique 
                  ? (
                    <>
                      {`${locataire.prenom || ''} ${locataire.nom || ''}`.trim()}
                      {(locataire.prenom_ar || locataire.nom_ar) && (
                        <span className="d-block" dir="rtl" style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                          {`${locataire.prenom_ar || ''} ${locataire.nom_ar || ''}`.trim()}
                        </span>
                      )}
                    </>
                  )
                  : locataire.raison_sociale}
                <span 
                  className="badge ms-2 d-inline-flex align-items-center gap-1" 
                  style={{
                    background: isPhysique 
                      ? 'rgba(16, 185, 129, 0.3)' 
                      : 'rgba(245, 158, 11, 0.3)',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}
                >
                  {isPhysique ? (
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V1zm11 0H3v14h3v-2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V15h3V1z"/>
                    </svg>
                  )}
                  {isPhysique ? 'Physique' : 'Morale'}
                </span>
              </p>
            </div>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onHide}
              style={{
                opacity: 0.8,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4" style={{ background: '#f8fafc' }}>
            {/* Informations personnelles / Entreprise */}
            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="card-header border-0 py-3" style={{ 
                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
              }}>
                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#1e293b' }}>
                  <div 
                    className="rounded-2 d-flex align-items-center justify-content-center"
                    style={{ width: 32, height: 32, background: '#6366f1', color: 'white' }}
                  >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      {isPhysique ? (
                        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"/>
                      ) : (
                        <path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V1zm11 0H3v14h3v-2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V15h3V1z"/>
                      )}
                    </svg>
                  </div>
                  {isPhysique ? 'Informations personnelles' : 'Informations entreprise'}
                </h6>
              </div>
              <div className="card-body p-4" style={{ background: 'white' }}>
                <div className="row g-4">
                  {isPhysique ? (
                    <>
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                          <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>Nom complet</label>
                          <div className="fw-semibold" style={{ color: '#1e293b' }}>{`${locataire.prenom || ''} ${locataire.nom || ''}`.trim() || '-'}</div>
                          {(locataire.prenom_ar || locataire.nom_ar) && (
                            <div className="fw-semibold mt-1" style={{ color: '#64748b' }} dir="rtl">
                              {`${locataire.prenom_ar || ''} ${locataire.nom_ar || ''}`.trim()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                          <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>CIN</label>
                          <div className="fw-semibold" style={{ color: '#1e293b' }}>{locataire.cin || '-'}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                          <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>Date de naissance</label>
                          <div className="fw-semibold" style={{ color: '#1e293b' }}>{formatDate(locataire.date_naissance)}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                          <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>Lieu de naissance</label>
                          <div className="fw-semibold" style={{ color: '#1e293b' }}>{locataire.lieu_naissance || '-'}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                          <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>Nationalité</label>
                          <div className="fw-semibold" style={{ color: '#1e293b' }}>{locataire.nationalite || '-'}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                          <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>Situation familiale</label>
                          <div className="fw-semibold text-capitalize" style={{ color: '#1e293b' }}>{locataire.situation_familiale || '-'}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                          <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>Personnes au foyer</label>
                          <div className="fw-semibold" style={{ color: '#1e293b' }}>{locataire.nb_personnes_foyer || '-'}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-md-12">
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                          <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>Raison sociale</label>
                          <div className="fw-semibold" style={{ color: '#1e293b' }}>{locataire.raison_sociale || '-'}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                          <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>Date de création</label>
                          <div className="fw-semibold" style={{ color: '#1e293b' }}>{formatDate(locataire.date_creation_entreprise)}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                          <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>RC</label>
                          <div className="fw-semibold" style={{ color: '#1e293b' }}>{locataire.rc || '-'}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                          <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>ICE</label>
                          <div className="fw-semibold" style={{ color: '#1e293b' }}>{locataire.ice || '-'}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                          <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>Identifiant fiscal</label>
                          <div className="fw-semibold" style={{ color: '#1e293b' }}>{locataire.ifiscale || '-'}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="card-header border-0 py-3" style={{ 
                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
              }}>
                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#1e293b' }}>
                  <div 
                    className="rounded-2 d-flex align-items-center justify-content-center"
                    style={{ width: 32, height: 32, background: '#8b5cf6', color: 'white' }}
                  >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328z"/>
                    </svg>
                  </div>
                  Contact
                </h6>
              </div>
              <div className="card-body p-4" style={{ background: 'white' }}>
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                      <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>Téléphone</label>
                      <div className="fw-semibold">
                        {locataire.telephone ? (
                          <a href={`tel:${locataire.telephone}`} className="text-decoration-none d-inline-flex align-items-center gap-2" style={{ color: '#6366f1' }}>
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328z"/>
                            </svg>
                            {locataire.telephone}
                          </a>
                        ) : '-'}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                      <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>Email</label>
                      <div className="fw-semibold">
                        {locataire.email ? (
                          <a href={`mailto:${locataire.email}`} className="text-decoration-none d-inline-flex align-items-center gap-2" style={{ color: '#6366f1' }}>
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
                            </svg>
                            {locataire.email}
                          </a>
                        ) : '-'}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                      <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>Adresse actuelle</label>
                      <div className="fw-semibold" style={{ color: '#1e293b' }}>{locataire.adresse_actuelle || '-'}</div>
                      {locataire.adresse_ar && (
                        <div className="fw-semibold mt-2" style={{ color: '#64748b' }} dir="rtl">
                          {locataire.adresse_ar}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                      <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>Adresse du bien loué</label>
                      <div className="fw-semibold" style={{ color: '#1e293b' }}>{locataire.adresse_bien_loue || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations professionnelles / financières */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="card-header border-0 py-3" style={{ 
                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
              }}>
                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#1e293b' }}>
                  <div 
                    className="rounded-2 d-flex align-items-center justify-content-center"
                    style={{ width: 32, height: 32, background: '#10b981', color: 'white' }}
                  >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z"/>
                    </svg>
                  </div>
                  {isPhysique ? 'Informations professionnelles' : 'Informations financières'}
                </h6>
              </div>
              <div className="card-body p-4" style={{ background: 'white' }}>
                <div className="row g-4">
                  {isPhysique ? (
                    <>
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                          <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>Profession / Activité</label>
                          <div className="fw-semibold" style={{ color: '#1e293b' }}>{locataire.profession_activite || '-'}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                          <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>Employeur</label>
                          <div className="fw-semibold" style={{ color: '#1e293b' }}>{locataire.employeur_denomination || '-'}</div>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                          <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>Adresse employeur</label>
                          <div className="fw-semibold" style={{ color: '#1e293b' }}>{locataire.employeur_adresse || '-'}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                          <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>Type de contrat</label>
                          <div className="fw-semibold text-uppercase" style={{ color: '#1e293b' }}>{locataire.type_contrat || '-'}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                          <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>Ancienneté</label>
                          <div className="fw-semibold" style={{ color: '#1e293b' }}>
                            {locataire.anciennete_mois ? `${locataire.anciennete_mois} mois` : '-'}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' }}>
                          <label className="small fw-semibold mb-1" style={{ color: '#047857' }}>Revenu mensuel net</label>
                          <div className="fw-bold fs-5" style={{ color: '#047857' }}>
                            {locataire.revenu_mensuel_net 
                              ? `${parseFloat(locataire.revenu_mensuel_net).toLocaleString('fr-FR')} MAD`
                              : '-'}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' }}>
                          <label className="small fw-semibold mb-1" style={{ color: '#047857' }}>Chiffre d'affaires</label>
                          <div className="fw-bold fs-5" style={{ color: '#047857' }}>
                            {locataire.chiffre_affaires_dernier_ex 
                              ? `${parseFloat(locataire.chiffre_affaires_dernier_ex).toLocaleString('fr-FR')} MAD`
                              : '-'}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                          <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>Année d'exercice</label>
                          <div className="fw-semibold" style={{ color: '#1e293b' }}>{locataire.exercice_annee || '-'}</div>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="col-md-12">
                    <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
                      <label className="small fw-semibold mb-1" style={{ color: '#64748b' }}>Références locatives</label>
                      <div className="fw-semibold" style={{ color: '#1e293b' }}>{locataire.references_locatives || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer border-0 p-4" style={{ background: '#f8fafc' }}>
            <button 
              type="button" 
              className="btn text-white border-0 shadow-sm px-4 d-flex align-items-center gap-2"
              onClick={onHide}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(99, 102, 241, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
              </svg>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
