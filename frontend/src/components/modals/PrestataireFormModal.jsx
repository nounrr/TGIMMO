import { useEffect, useState } from 'react';
import { useCreatePrestataireMutation, useUpdatePrestataireMutation } from '../../features/prestataires/prestatairesApi';

export default function PrestataireFormModal({ show, onHide, prestataire = null }) {
  const isEdit = !!prestataire;
  const [createPrestataire, { isLoading: isCreating }] = useCreatePrestataireMutation();
  const [updatePrestataire, { isLoading: isUpdating }] = useUpdatePrestataireMutation();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onHide();
    };
    if (show) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [show, onHide]);

  const [formData, setFormData] = useState({
    nom_raison: '',
    adresse: '',
    telephone: '',
    email: '',
    rc: '',
    ifiscale: '',
    ice: '',
    domaine_activite: '',
    contact_nom: '',
    rib: '',
  });

  useEffect(() => {
    if (prestataire) {
      setFormData({
        nom_raison: prestataire.nom_raison || '',
        adresse: prestataire.adresse || '',
        telephone: prestataire.telephone || '',
        email: prestataire.email || '',
        rc: prestataire.rc || '',
        ifiscale: prestataire.ifiscale || '',
        ice: prestataire.ice || '',
        domaine_activite: prestataire.domaine_activite || '',
        contact_nom: prestataire.contact_nom || '',
        rib: prestataire.rib || '',
      });
    } else {
      setFormData({
        nom_raison: '',
        adresse: '',
        telephone: '',
        email: '',
        rc: '',
        ifiscale: '',
        ice: '',
        domaine_activite: '',
        contact_nom: '',
        rib: '',
      });
    }
    setError('');
  }, [prestataire, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isEdit) {
        await updatePrestataire({ id: prestataire.id, ...formData }).unwrap();
      } else {
        await createPrestataire(formData).unwrap();
      }
      onHide();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(err?.data?.message || 'Une erreur est survenue lors de la sauvegarde');
    }
  };

  if (!show) return null;
  const isLoading = isCreating || isUpdating;

  return (
    <>
      <div
        className="modal-backdrop fade show"
        style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1040 }}
        onClick={onHide}
      />
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }} onClick={onHide}>
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
            <div className="modal-header border-0 pb-0 px-4 pt-4">
              <div>
                <h5 className="modal-title fw-bold mb-1" style={{
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.5rem'
                }}>
                  {isEdit ? 'Modifier le prestataire' : 'Nouveau prestataire'}
                </h5>
                <p className="text-muted small mb-0">{isEdit ? 'Modifiez les informations du prestataire' : 'Ajoutez un nouveau prestataire'}</p>
              </div>
              <button type="button" className="btn-close" onClick={onHide} style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f1f5f9', opacity: 1, transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
              />
            </div>

            <div className="modal-body px-4 py-4">
              {error && (
                <div className="alert alert-danger rounded-3 d-flex align-items-center gap-2 mb-4" role="alert">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Informations de base */}
                <div className="card border-0 rounded-4 mb-4" style={{ background: 'rgba(99, 102, 241, 0.05)' }}>
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#4338ca' }}>
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                        <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
                      </svg>
                      Informations de base
                    </h6>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label fw-semibold small text-slate-700">Nom / Raison sociale <span className="text-danger">*</span></label>
                        <input type="text" className="form-control border-0 shadow-sm" name="nom_raison" value={formData.nom_raison} onChange={handleChange} required placeholder="Nom complet ou raison sociale"
                          style={{ background: '#f8fafc', padding: '0.75rem 1rem', fontSize: '0.95rem', borderRadius: '12px', transition: 'all 0.2s' }}
                          onFocus={(e) => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; }}
                          onBlur={(e) => { e.target.style.background = '#f8fafc'; e.target.style.boxShadow = ''; }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-slate-700">Domaine d'activité</label>
                        <input type="text" className="form-control border-0 shadow-sm" name="domaine_activite" value={formData.domaine_activite} onChange={handleChange} placeholder="Ex: Plomberie, Électricité..."
                          style={{ background: '#f8fafc', padding: '0.75rem 1rem', fontSize: '0.95rem', borderRadius: '12px', transition: 'all 0.2s' }}
                          onFocus={(e) => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; }}
                          onBlur={(e) => { e.target.style.background = '#f8fafc'; e.target.style.boxShadow = ''; }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-slate-700">Contact principal</label>
                        <input type="text" className="form-control border-0 shadow-sm" name="contact_nom" value={formData.contact_nom} onChange={handleChange} placeholder="Nom du contact"
                          style={{ background: '#f8fafc', padding: '0.75rem 1rem', fontSize: '0.95rem', borderRadius: '12px', transition: 'all 0.2s' }}
                          onFocus={(e) => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; }}
                          onBlur={(e) => { e.target.style.background = '#f8fafc'; e.target.style.boxShadow = ''; }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coordonnées */}
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
                      <div className="col-12">
                        <label className="form-label fw-semibold small text-slate-700">Adresse</label>
                        <textarea className="form-control border-0 shadow-sm" name="adresse" value={formData.adresse} onChange={handleChange} rows="3" placeholder="Adresse complète"
                          style={{ background: '#f8fafc', padding: '0.75rem 1rem', fontSize: '0.95rem', borderRadius: '12px', transition: 'all 0.2s', resize: 'vertical' }}
                          onFocus={(e) => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)'; }}
                          onBlur={(e) => { e.target.style.background = '#f8fafc'; e.target.style.boxShadow = ''; }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-slate-700">Téléphone</label>
                        <input type="tel" className="form-control border-0 shadow-sm" name="telephone" value={formData.telephone} onChange={handleChange} placeholder="06 12 34 56 78"
                          style={{ background: '#f8fafc', padding: '0.75rem 1rem', fontSize: '0.95rem', borderRadius: '12px', transition: 'all 0.2s' }}
                          onFocus={(e) => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)'; }}
                          onBlur={(e) => { e.target.style.background = '#f8fafc'; e.target.style.boxShadow = ''; }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-slate-700">Email</label>
                        <input type="email" className="form-control border-0 shadow-sm" name="email" value={formData.email} onChange={handleChange} placeholder="exemple@email.com"
                          style={{ background: '#f8fafc', padding: '0.75rem 1rem', fontSize: '0.95rem', borderRadius: '12px', transition: 'all 0.2s' }}
                          onFocus={(e) => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)'; }}
                          onBlur={(e) => { e.target.style.background = '#f8fafc'; e.target.style.boxShadow = ''; }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Identifiants */}
                <div className="card border-0 rounded-4 mb-4" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#059669' }}>
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1H2zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7z"/>
                      </svg>
                      Identifiants
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label fw-semibold small text-slate-700">RC</label>
                        <input type="text" className="form-control border-0 shadow-sm" name="rc" value={formData.rc} onChange={handleChange} placeholder="Numéro RC"
                          style={{ background: '#f8fafc', padding: '0.75rem 1rem', fontSize: '0.95rem', borderRadius: '12px', transition: 'all 0.2s' }}
                          onFocus={(e) => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'; }}
                          onBlur={(e) => { e.target.style.background = '#f8fafc'; e.target.style.boxShadow = ''; }}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold small text-slate-700">ICE</label>
                        <input type="text" className="form-control border-0 shadow-sm" name="ice" value={formData.ice} onChange={handleChange} placeholder="ICE"
                          style={{ background: '#f8fafc', padding: '0.75rem 1rem', fontSize: '0.95rem', borderRadius: '12px', transition: 'all 0.2s' }}
                          onFocus={(e) => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'; }}
                          onBlur={(e) => { e.target.style.background = '#f8fafc'; e.target.style.boxShadow = ''; }}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold small text-slate-700">Identifiant Fiscal</label>
                        <input type="text" className="form-control border-0 shadow-sm" name="ifiscale" value={formData.ifiscale} onChange={handleChange} placeholder="IF"
                          style={{ background: '#f8fafc', padding: '0.75rem 1rem', fontSize: '0.95rem', borderRadius: '12px', transition: 'all 0.2s' }}
                          onFocus={(e) => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'; }}
                          onBlur={(e) => { e.target.style.background = '#f8fafc'; e.target.style.boxShadow = ''; }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-slate-700">RIB</label>
                        <input type="text" className="form-control border-0 shadow-sm" name="rib" value={formData.rib} onChange={handleChange} placeholder="RIB bancaire"
                          style={{ background: '#f8fafc', padding: '0.75rem 1rem', fontSize: '0.95rem', borderRadius: '12px', transition: 'all 0.2s' }}
                          onFocus={(e) => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'; }}
                          onBlur={(e) => { e.target.style.background = '#f8fafc'; e.target.style.boxShadow = ''; }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-3 pt-3">
                  <button type="button" className="btn btn-lg px-4 fw-semibold" onClick={onHide} disabled={isLoading}
                    style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-lg px-5 text-white fw-semibold shadow-sm d-flex align-items-center gap-2" disabled={isLoading}
                    style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', border: 'none', borderRadius: '12px', transition: 'all 0.3s' }}
                    onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(37, 99, 235, 0.3)'; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M15.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L8.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                        </svg>
                        <span>{isEdit ? 'Mettre à jour' : 'Créer'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
