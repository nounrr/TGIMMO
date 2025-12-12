import { useState, useEffect } from 'react';
import { useCreateProprietaireMutation, useUpdateProprietaireMutation } from '../../features/proprietaires/proprietairesApi';

export default function ProprietaireFormModal({ show, onHide, proprietaire = null }) {
  const isEdit = !!proprietaire;
  const [createProprietaire, { isLoading: isCreating }] = useCreateProprietaireMutation();
  const [updateProprietaire, { isLoading: isUpdating }] = useUpdateProprietaireMutation();
  const [error, setError] = useState('');

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

  const [formData, setFormData] = useState({
    nom_raison: '',
    nom_ar: '',
    prenom_ar: '',
    cin: '',
    rc: '',
    chiffre_affaires: '',
    ice: '',
    ifiscale: '',
    ville: '',
    adresse: '',
    adresse_ar: '',
    telephone: '',
    email: '',
    representant_nom: '',
    representant_fonction: '',
    representant_cin: '',
    type_proprietaire: 'unique',
    statut: 'brouillon',
    taux_gestion_tgi_pct: '',
    taux_gestion: '',
    assiette_honoraires: 'loyers_encaisse',
    periodicite_releve: 'mensuel',
    conditions_particulieres: '',
  });

  useEffect(() => {
    if (proprietaire) {
      setFormData({
        nom_raison: proprietaire.nom_raison || '',
        nom_ar: proprietaire.nom_ar || '',
        prenom_ar: proprietaire.prenom_ar || '',
        cin: proprietaire.cin || '',
        rc: proprietaire.rc || '',
        chiffre_affaires: proprietaire.chiffre_affaires || '',
        ice: proprietaire.ice || '',
        ifiscale: proprietaire.ifiscale || '',
        ville: proprietaire.ville || '',
        adresse: proprietaire.adresse || '',
        adresse_ar: proprietaire.adresse_ar || '',
        telephone: proprietaire.telephone || '',
        email: proprietaire.email || '',
        representant_nom: proprietaire.representant_nom || '',
        representant_fonction: proprietaire.representant_fonction || '',
        representant_cin: proprietaire.representant_cin || '',
        type_proprietaire: proprietaire.type_proprietaire || 'unique',
        statut: proprietaire.statut || 'brouillon',
        taux_gestion_tgi_pct: proprietaire.taux_gestion_tgi_pct || '',
        taux_gestion: proprietaire.taux_gestion || '',
        assiette_honoraires: proprietaire.assiette_honoraires || 'loyers_encaisse',
        periodicite_releve: proprietaire.periodicite_releve || 'mensuel',
        conditions_particulieres: proprietaire.conditions_particulieres || '',
      });
    } else {
      setFormData({
        nom_raison: '',
        nom_ar: '',
        prenom_ar: '',
        cin: '',
        rc: '',
        chiffre_affaires: '',
        ice: '',
        ifiscale: '',
        ville: '',
        adresse: '',
        adresse_ar: '',
        telephone: '',
        email: '',
        representant_nom: '',
        representant_fonction: '',
        representant_cin: '',
        type_proprietaire: 'unique',
        statut: 'brouillon',
        taux_gestion_tgi_pct: '',
        taux_gestion: '',
        assiette_honoraires: 'loyers_encaisse',
        periodicite_releve: 'mensuel',
        conditions_particulieres: '',
      });
    }
    setError('');
  }, [proprietaire, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    const cinRegex = /^[A-Z]{1,2}[0-9]{1,6}$/;
    const iceRegex = /^[0-9]{15}$/;
    const phoneRegex = /^0[5-7][0-9]{8}$/;
    const ribRegex = /^[0-9]{24}$/;

    if (formData.cin && !cinRegex.test(formData.cin)) {
      errors.cin = "Le CIN doit commencer par 1 ou 2 lettres suivies de 1 à 6 chiffres.";
    }
    if (formData.ice && !iceRegex.test(formData.ice)) {
      errors.ice = "L'ICE doit contenir exactement 15 chiffres.";
    }
    if (formData.telephone && !phoneRegex.test(formData.telephone)) {
      errors.telephone = "Le numéro de téléphone doit être au format marocain (ex: 0612345678).";
    }
    if (formData.rib && !ribRegex.test(formData.rib)) {
      errors.rib = "Le RIB doit contenir exactement 24 chiffres.";
    }
    if (formData.ifiscale && !/^[0-9]+$/.test(formData.ifiscale)) {
      errors.ifiscale = "L'identifiant fiscal doit contenir uniquement des chiffres.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isEdit) {
        await updateProprietaire({ id: proprietaire.id, ...formData }).unwrap();
      } else {
        await createProprietaire(formData).unwrap();
      }
      onHide();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(err.data?.message || 'Une erreur est survenue lors de la sauvegarde');
    }
  };

  if (!show) return null;

  const isLoading = isCreating || isUpdating;

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
                  {isEdit ? 'Modifier le propriétaire' : 'Nouveau propriétaire'}
                </h5>
                <p className="text-muted small mb-0">
                  {isEdit ? 'Modifiez les informations du propriétaire' : 'Ajoutez un nouveau propriétaire'}
                </p>
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
              {error && (
                <div className="alert alert-danger rounded-3 d-flex align-items-center gap-2 mb-4" role="alert">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Section: Informations de base */}
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
                        <label className="form-label fw-semibold small text-slate-700">
                          Nom / Raison sociale <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control border-0 shadow-sm"
                          name="nom_raison"
                          value={formData.nom_raison}
                          onChange={handleChange}
                          required
                          placeholder="Nom complet ou raison sociale"
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-slate-700">
                          الاسم بالعربية
                        </label>
                        <input
                          type="text"
                          className="form-control border-0 shadow-sm"
                          name="nom_ar"
                          value={formData.nom_ar}
                          onChange={handleChange}
                          placeholder="الاسم"
                          dir="rtl"
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-slate-700">
                          النسب بالعربية
                        </label>
                        <input
                          type="text"
                          className="form-control border-0 shadow-sm"
                          name="prenom_ar"
                          value={formData.prenom_ar}
                          onChange={handleChange}
                          placeholder="النسب"
                          dir="rtl"
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-slate-700">Type de propriétaire</label>
                        <select
                          className="form-select border-0 shadow-sm"
                          name="type_proprietaire"
                          value={formData.type_proprietaire}
                          onChange={handleChange}
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        >
                          <option value="unique">Propriétaire unique</option>
                          <option value="coproprietaire">Copropriétaire</option>
                          <option value="heritier">Héritier</option>
                          <option value="sci">SCI</option>
                          <option value="autre">Autre</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-slate-700">Statut</label>
                        <select
                          className="form-select border-0 shadow-sm"
                          name="statut"
                          value={formData.statut}
                          onChange={handleChange}
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        >
                          <option value="brouillon">Brouillon</option>
                          <option value="signe">Signé</option>
                          <option value="actif">Actif</option>
                          <option value="resilie">Résilié</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Identifiants */}
                <div className="card border-0 rounded-4 mb-4" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#059669' }}>
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1H2zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7z"/>
                      </svg>
                      Identifiants
                    </h6>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-slate-700">CIN</label>
                        <input
                          type="text"
                          className="form-control border-0 shadow-sm"
                          name="cin"
                          value={formData.cin}
                          onChange={handleChange}
                          placeholder="Numéro CIN"
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        />
                        {validationErrors.cin && <div className="text-danger small mt-1">{validationErrors.cin}</div>}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-slate-700">Registre Commerce (RC)</label>
                        <input
                          type="text"
                          className="form-control border-0 shadow-sm"
                          name="rc"
                          value={formData.rc}
                          onChange={handleChange}
                          placeholder="Numéro RC"
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-slate-700">Capital Social</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control border-0 shadow-sm"
                          name="chiffre_affaires"
                          value={formData.chiffre_affaires}
                          onChange={handleChange}
                          onWheel={(e) => e.target.blur()}
                          placeholder="0.00"
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-slate-700">ICE</label>
                        <input
                          type="text"
                          className="form-control border-0 shadow-sm"
                          name="ice"
                          value={formData.ice}
                          onChange={handleChange}
                          placeholder="Identifiant Commun de l'Entreprise"
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        />
                        {validationErrors.ice && <div className="text-danger small mt-1">{validationErrors.ice}</div>}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-slate-700">Identifiant Fiscal</label>
                        <input
                          type="text"
                          className="form-control border-0 shadow-sm"
                          name="ifiscale"
                          value={formData.ifiscale}
                          onChange={handleChange}
                          placeholder="Numéro d'identifiant fiscal"
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        />
                        {validationErrors.ifiscale && <div className="text-danger small mt-1">{validationErrors.ifiscale}</div>}
                      </div>
                    </div>
                  </div>
                </div>

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
                      <div className="col-12">
                        <label className="form-label fw-semibold small text-slate-700">Adresse</label>
                        <textarea
                          className="form-control border-0 shadow-sm"
                          name="adresse"
                          value={formData.adresse}
                          onChange={handleChange}
                          rows="3"
                          placeholder="Adresse complète du propriétaire"
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s',
                            resize: 'vertical'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold small text-slate-700">
                          العنوان بالعربية
                        </label>
                        <textarea
                          className="form-control border-0 shadow-sm"
                          name="adresse_ar"
                          value={formData.adresse_ar}
                          onChange={handleChange}
                          rows="3"
                          placeholder="العنوان الكامل"
                          dir="rtl"
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s',
                            resize: 'vertical'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-slate-700">Téléphone</label>
                        <input
                          type="tel"
                          className="form-control border-0 shadow-sm"
                          name="telephone"
                          value={formData.telephone}
                          onChange={handleChange}
                          placeholder="06 12 34 56 78"
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        />
                        {validationErrors.telephone && <div className="text-danger small mt-1">{validationErrors.telephone}</div>}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-slate-700">Email</label>
                        <input
                          type="email"
                          className="form-control border-0 shadow-sm"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="exemple@email.com"
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Représentant */}
                <div className="card border-0 rounded-4 mb-4" style={{ background: 'rgba(139, 92, 246, 0.05)' }}>
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#7c3aed' }}>
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"/>
                      </svg>
                      Représentant légal (optionnel)
                    </h6>

                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label fw-semibold small text-slate-700">Nom du représentant</label>
                        <input
                          type="text"
                          className="form-control border-0 shadow-sm"
                          name="representant_nom"
                          value={formData.representant_nom}
                          onChange={handleChange}
                          placeholder="Nom complet"
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-semibold small text-slate-700">Fonction</label>
                        <input
                          type="text"
                          className="form-control border-0 shadow-sm"
                          name="representant_fonction"
                          value={formData.representant_fonction}
                          onChange={handleChange}
                          placeholder="Gérant, Directeur, etc."
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-semibold small text-slate-700">CIN du représentant</label>
                        <input
                          type="text"
                          className="form-control border-0 shadow-sm"
                          name="representant_cin"
                          value={formData.representant_cin}
                          onChange={handleChange}
                          placeholder="Numéro CIN"
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

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
                        <label className="form-label fw-semibold small text-slate-700">Taux de gestion TGI (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className="form-control border-0 shadow-sm"
                          name="taux_gestion_tgi_pct"
                          value={formData.taux_gestion_tgi_pct}
                          onChange={handleChange}
                          onWheel={(e) => e.target.blur()}
                          placeholder="Ex: 10.00"
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-slate-700">Taux des honoraires</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className="form-control border-0 shadow-sm"
                          name="taux_gestion"
                          value={formData.taux_gestion}
                          onChange={handleChange}
                          onWheel={(e) => e.target.blur()}
                          placeholder="Ex: 5.00"
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-slate-700">Assiette honoraires</label>
                        <select
                          className="form-select border-0 shadow-sm"
                          name="assiette_honoraires"
                          value={formData.assiette_honoraires}
                          onChange={handleChange}
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        >
                          <option value="loyers_encaisse">Loyers encaissés</option>
                          <option value="loyers_factures">Loyers émis</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-slate-700">Périodicité relevé</label>
                        <select
                          className="form-select border-0 shadow-sm"
                          name="periodicite_releve"
                          value={formData.periodicite_releve}
                          onChange={handleChange}
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        >
                          <option value="mensuel">Mensuel</option>
                          <option value="trimestriel">Trimestriel</option>
                          <option value="semestriel">Semestriel</option>
                          <option value="annuel">Annuel</option>
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold small text-slate-700">Conditions particulières</label>
                        <textarea
                          className="form-control border-0 shadow-sm"
                          name="conditions_particulieres"
                          value={formData.conditions_particulieres}
                          onChange={handleChange}
                          rows="4"
                          placeholder="Notes ou conditions spéciales concernant ce propriétaire..."
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            transition: 'all 0.2s',
                            resize: 'vertical'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.boxShadow = '';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="d-flex justify-content-end gap-3 pt-3">
                  <button
                    type="button"
                    className="btn px-4 fw-semibold"
                    onClick={onHide}
                    disabled={isLoading}
                    style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      padding: '0.5rem 1.25rem'
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.background = '#e2e8f0';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f1f5f9';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn px-4 text-white fw-semibold shadow-sm d-flex align-items-center gap-2"
                    disabled={isLoading}
                    style={{
                      background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                      border: 'none',
                      borderRadius: '8px',
                      transition: 'all 0.3s',
                      padding: '0.5rem 1.25rem'
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(37, 99, 235, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '';
                    }}
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
