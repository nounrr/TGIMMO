import { useState, useEffect } from 'react';
import { useCreateLocataireMutation, useUpdateLocataireMutation } from '../../features/locataires/locatairesApi';
import CountrySelect from '../common/CountrySelect';

export default function LocataireFormModal({ show, onHide, locataire = null }) {
  const isEdit = !!locataire;
  const [createLocataire, { isLoading: isCreating }] = useCreateLocataireMutation();
  const [updateLocataire, { isLoading: isUpdating }] = useUpdateLocataireMutation();
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

  // Normalize backend date string to input[type=date] value (YYYY-MM-DD)
  const toInputDate = (value) => {
    if (!value) return '';
    if (typeof value === 'string') {
      const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
      if (m) return m[1];
    }
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        // Adjust to avoid timezone shift and get YYYY-MM-DD
        const tzAdjusted = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return tzAdjusted.toISOString().slice(0, 10);
      }
    } catch (_) {}
    return '';
  };

  const initialFormData = {
    type_personne: 'physique',
    nom: '',
    nom_ar: '',
    prenom: '',
    prenom_ar: '',
    raison_sociale: '',
    date_naissance: '',
    lieu_naissance: '',
    date_creation_entreprise: '',
    nationalite: '',
    situation_familiale: '',
    nb_personnes_foyer: '',
    cin: '',
    rc: '',
    ice: '',
    ifiscale: '',
    adresse_bien_loue: '',
    adresse_actuelle: '',
    adresse_ar: '',
    telephone: '',
    email: '',
    profession_activite: '',
    employeur_denomination: '',
    employeur_adresse: '',
    type_contrat: '',
    revenu_mensuel_net: '',
    chiffre_affaires_dernier_ex: '',
    exercice_annee: '',
    anciennete_mois: '',
    references_locatives: '',
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (locataire) {
      const normalizedType = locataire.type_personne === 'personne' ? 'physique'
        : locataire.type_personne === 'societe' ? 'morale'
        : (locataire.type_personne || 'physique');
      setFormData({
        type_personne: normalizedType,
        nom: locataire.nom || '',
        nom_ar: locataire.nom_ar || '',
        prenom: locataire.prenom || '',
        prenom_ar: locataire.prenom_ar || '',
        raison_sociale: locataire.raison_sociale || '',
        date_naissance: toInputDate(locataire.date_naissance),
        lieu_naissance: locataire.lieu_naissance || '',
        date_creation_entreprise: toInputDate(locataire.date_creation_entreprise),
        nationalite: locataire.nationalite || '',
        situation_familiale: locataire.situation_familiale || '',
        nb_personnes_foyer: locataire.nb_personnes_foyer || '',
        cin: locataire.cin || '',
        rc: locataire.rc || '',
        ice: locataire.ice || '',
        ifiscale: locataire.ifiscale || '',
        adresse_bien_loue: locataire.adresse_bien_loue || '',
        adresse_actuelle: locataire.adresse_actuelle || '',
        adresse_ar: locataire.adresse_ar || '',
        telephone: locataire.telephone || '',
        email: locataire.email || '',
        profession_activite: locataire.profession_activite || '',
        employeur_denomination: locataire.employeur_denomination || '',
        employeur_adresse: locataire.employeur_adresse || '',
        type_contrat: locataire.type_contrat || '',
        revenu_mensuel_net: locataire.revenu_mensuel_net || '',
        chiffre_affaires_dernier_ex: locataire.chiffre_affaires_dernier_ex || '',
        exercice_annee: locataire.exercice_annee || '',
        anciennete_mois: locataire.anciennete_mois || '',
        references_locatives: locataire.references_locatives || '',
      });
    } else if (show) {
      // Reset completely when opening for a new locataire
      setFormData(initialFormData);
    }
    setError('');
  }, [locataire, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Map UI values to API values: 'physique' -> 'personne', 'morale' -> 'societe'
      const payload = {
        ...formData,
        type_personne: formData.type_personne === 'physique' ? 'personne' : 'societe',
      };
      if (isEdit) {
        await updateLocataire({ id: locataire.id, ...payload }).unwrap();
      } else {
        await createLocataire(payload).unwrap();
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
      <div className="modal-backdrop fade show" style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1040 }} onClick={onHide} />
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }} onClick={onHide}>
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
            <div className="modal-header border-0 pb-0 px-4 pt-4">
              <div>
                <h5 className="modal-title fw-bold mb-1" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.5rem' }}>
                  {isEdit ? 'Modifier le locataire' : 'Nouveau locataire'}
                </h5>
                <p className="text-muted small mb-0">Renseignez les informations du locataire</p>
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

              <form id="locataireForm" onSubmit={handleSubmit}>
                {/* Type de personne - compact pills */}
                <div className="mb-4">
                  <label className="form-label fw-semibold mb-2" style={{ color: '#1e293b' }}>Type</label>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <input type="radio" className="btn-check" name="type_personne" id="typePhysique" value="physique" checked={formData.type_personne === 'physique'} onChange={handleChange} />
                    <label className="btn btn-sm btn-outline-primary rounded-pill px-3" htmlFor="typePhysique">Personne</label>
                    <input type="radio" className="btn-check" name="type_personne" id="typeMorale" value="morale" checked={formData.type_personne === 'morale'} onChange={handleChange} />
                    <label className="btn btn-sm btn-outline-secondary rounded-pill px-3" htmlFor="typeMorale">Société</label>
                  </div>
                </div>

                {/* Informations personnelles / entreprise */}
                <div className="card border-0 rounded-4 mb-4" style={{ background: 'rgba(99, 102, 241, 0.05)' }}>
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3" style={{ color: '#4338ca' }}>{formData.type_personne === 'physique' ? 'Informations personnelles' : 'Informations entreprise'}</h6>
                    {formData.type_personne === 'physique' ? (
                      <div className="row g-3">
                        <div className="col-md-6"><label className="form-label">Nom *</label><input type="text" className="form-control" name="nom" value={formData.nom} onChange={handleChange} required /></div>
                        <div className="col-md-6"><label className="form-label">Nom (Arabe)</label><input type="text" className="form-control" name="nom_ar" value={formData.nom_ar} onChange={handleChange} dir="rtl" /></div>
                        <div className="col-md-6"><label className="form-label">Prénom *</label><input type="text" className="form-control" name="prenom" value={formData.prenom} onChange={handleChange} required /></div>
                        <div className="col-md-6"><label className="form-label">Prénom (Arabe)</label><input type="text" className="form-control" name="prenom_ar" value={formData.prenom_ar} onChange={handleChange} dir="rtl" /></div>
                        <div className="col-md-6"><label className="form-label">Date de naissance</label><input type="date" className="form-control" name="date_naissance" value={formData.date_naissance} onChange={handleChange} /></div>
                        <div className="col-md-6"><label className="form-label">Lieu de naissance</label><input type="text" className="form-control" name="lieu_naissance" value={formData.lieu_naissance} onChange={handleChange} /></div>
                        <div className="col-md-6"><label className="form-label">Nationalité</label><CountrySelect name="nationalite" value={formData.nationalite} onChange={handleChange} className="form-control" /></div>
                        <div className="col-md-6"><label className="form-label">CIN</label><input type="text" className="form-control" name="cin" value={formData.cin} onChange={handleChange} /></div>
                        <div className="col-md-6"><label className="form-label">Situation familiale</label>
                          <select className="form-select" name="situation_familiale" value={formData.situation_familiale} onChange={handleChange}>
                            <option value="">Sélectionner</option>
                            <option value="celibataire">Célibataire</option>
                            <option value="marie">Marié(e)</option>
                            <option value="divorce">Divorcé(e)</option>
                            <option value="veuf">Veuf(ve)</option>
                          </select>
                        </div>
                        <div className="col-md-6"><label className="form-label">Nb personnes au foyer</label><input type="number" className="form-control" name="nb_personnes_foyer" value={formData.nb_personnes_foyer} onChange={handleChange} min="0" /></div>
                      </div>
                    ) : (
                      <div className="row g-3">
                        <div className="col-12"><label className="form-label">Raison sociale *</label><input type="text" className="form-control" name="raison_sociale" value={formData.raison_sociale} onChange={handleChange} required /></div>
                        <div className="col-md-6"><label className="form-label">Date de création</label><input type="date" className="form-control" name="date_creation_entreprise" value={formData.date_creation_entreprise} onChange={handleChange} /></div>
                        <div className="col-md-6"><label className="form-label">RC</label><input type="text" className="form-control" name="rc" value={formData.rc} onChange={handleChange} /></div>
                        <div className="col-md-6"><label className="form-label">ICE</label><input type="text" className="form-control" name="ice" value={formData.ice} onChange={handleChange} /></div>
                        <div className="col-md-6"><label className="form-label">Identifiant fiscal</label><input type="text" className="form-control" name="ifiscale" value={formData.ifiscale} onChange={handleChange} /></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Coordonnées */}
                <div className="card border-0 rounded-4 mb-4" style={{ background: 'rgba(139, 92, 246, 0.05)' }}>
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3" style={{ color: '#7c3aed' }}>Coordonnées</h6>
                    <div className="row g-3">
                      <div className="col-md-6"><label className="form-label">Téléphone *</label><input type="tel" className="form-control" name="telephone" value={formData.telephone} onChange={handleChange} required /></div>
                      <div className="col-md-6"><label className="form-label">Email</label><input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} /></div>
                      <div className="col-12"><label className="form-label">Adresse actuelle</label><textarea className="form-control" name="adresse_actuelle" value={formData.adresse_actuelle} onChange={handleChange} rows="2" /></div>
                      <div className="col-12"><label className="form-label">Adresse (Arabe)</label><textarea className="form-control" name="adresse_ar" value={formData.adresse_ar} onChange={handleChange} rows="2" dir="rtl" /></div>
                      <div className="col-12"><label className="form-label">Adresse du bien loué</label><textarea className="form-control" name="adresse_bien_loue" value={formData.adresse_bien_loue} onChange={handleChange} rows="2" /></div>
                    </div>
                  </div>
                </div>

                {/* Informations professionnelles / financières */}
                <div className="card border-0 rounded-4 mb-4" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3" style={{ color: '#059669' }}>{formData.type_personne === 'physique' ? 'Informations professionnelles' : 'Informations financières'}</h6>
                    <div className="row g-3">
                      {formData.type_personne === 'physique' ? (
                        <>
                          <div className="col-md-6"><label className="form-label">Profession / Activité</label><input type="text" className="form-control" name="profession_activite" value={formData.profession_activite} onChange={handleChange} /></div>
                          <div className="col-md-6"><label className="form-label">Employeur</label><input type="text" className="form-control" name="employeur_denomination" value={formData.employeur_denomination} onChange={handleChange} /></div>
                          <div className="col-12"><label className="form-label">Adresse employeur</label><input type="text" className="form-control" name="employeur_adresse" value={formData.employeur_adresse} onChange={handleChange} /></div>
                          <div className="col-md-6"><label className="form-label">Type de contrat</label>
                            <select className="form-select" name="type_contrat" value={formData.type_contrat} onChange={handleChange}>
                              <option value="">Sélectionner</option>
                              <option value="CDI">CDI</option>
                              <option value="CDD">CDD</option>
                              <option value="freelance">Freelance</option>
                              <option value="autre">Autre</option>
                            </select>
                          </div>
                          <div className="col-md-6"><label className="form-label">Ancienneté (mois)</label><input type="number" className="form-control" name="anciennete_mois" value={formData.anciennete_mois} onChange={handleChange} min="0" /></div>
                          <div className="col-md-6"><label className="form-label">Revenu mensuel net (MAD)</label><input type="number" className="form-control" name="revenu_mensuel_net" value={formData.revenu_mensuel_net} onChange={handleChange} step="0.01" min="0" /></div>
                        </>
                      ) : (
                        <>
                          <div className="col-md-6"><label className="form-label">Chiffre d'affaires dernier ex. (MAD)</label><input type="number" className="form-control" name="chiffre_affaires_dernier_ex" value={formData.chiffre_affaires_dernier_ex} onChange={handleChange} step="0.01" min="0" /></div>
                          <div className="col-md-6"><label className="form-label">Année d'exercice</label><input type="number" className="form-control" name="exercice_annee" value={formData.exercice_annee} onChange={handleChange} min="1900" max="2100" /></div>
                        </>
                      )}
                      <div className="col-12"><label className="form-label">Références locatives</label><textarea className="form-control" name="references_locatives" value={formData.references_locatives} onChange={handleChange} rows="2" placeholder="Anciens propriétaires, coordonnées..." /></div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="modal-footer border-0 px-4 pb-4">
              <button type="button" className="btn btn-lg px-4 fw-semibold" onClick={onHide}
                style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Annuler
              </button>
              <button type="submit" form="locataireForm" className="btn btn-lg px-5 text-white fw-semibold shadow-sm d-flex align-items-center gap-2"
                disabled={isLoading}
                style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', border: 'none', borderRadius: '12px', transition: 'all 0.3s' }}
                onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(37, 99, 235, 0.3)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
              >
                {isLoading ? (<><span className="spinner-border spinner-border-sm" /><span>Enregistrement...</span></>) : (<><svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M15.854 6.354a.5.5 0 0 0-.708-.708L8 12.793 4.854 9.646a.5.5 0 0 0-.708.708l3.5 3.5a.5.5 0 0 0 .708 0l7.5-7.5z"/></svg><span>{isEdit ? 'Enregistrer' : 'Créer'}</span></>)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
