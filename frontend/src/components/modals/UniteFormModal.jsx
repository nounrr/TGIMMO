import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { useCreateUniteMutation, useUpdateUniteMutation } from '../../features/unites/unitesApi';
import { useGetLocatairesQuery } from '../../features/locataires/locatairesApi';

export default function UniteFormModal({ show, onHide, unite }) {
  const isEdit = Boolean(unite);
  const [createUnite, { isLoading: isCreating, error: createError }] = useCreateUniteMutation();
  const [updateUnite, { isLoading: isUpdating, error: updateError }] = useUpdateUniteMutation();
  const { data: locataires } = useGetLocatairesQuery({ page: 1, per_page: 1000 });
  
  const [formData, setFormData] = useState({
    numero_unite: '',
    adresse_complete: '',
    immeuble: '',
    bloc: '',
    etage: '',
    type_unite: 'appartement',
    superficie_m2: '',
    nb_pieces: '',
    nb_sdb: '',
    equipements: '',
    mobilier: '',
    statut: 'vacant',
    locataire_actuel_id: '',
    bail_actuel_id: '',
    date_entree_actuelle: '',
  });

  useEffect(() => {
    if (unite) {
      setFormData({
        numero_unite: unite.numero_unite || '',
        adresse_complete: unite.adresse_complete || '',
        immeuble: unite.immeuble || '',
        bloc: unite.bloc || '',
        etage: unite.etage || '',
        type_unite: unite.type_unite || 'appartement',
        superficie_m2: unite.superficie_m2 || '',
        nb_pieces: unite.nb_pieces || '',
        nb_sdb: unite.nb_sdb || '',
        equipements: unite.equipements || '',
        mobilier: unite.mobilier || '',
        statut: unite.statut || 'vacant',
        locataire_actuel_id: unite.locataire_actuel_id || '',
        bail_actuel_id: unite.bail_actuel_id || '',
        date_entree_actuelle: unite.date_entree_actuelle || '',
      });
    } else {
      setFormData({
        numero_unite: '',
        adresse_complete: '',
        immeuble: '',
        bloc: '',
        etage: '',
        type_unite: 'appartement',
        superficie_m2: '',
        nb_pieces: '',
        nb_sdb: '',
        equipements: '',
        mobilier: '',
        statut: 'vacant',
        locataire_actuel_id: '',
        bail_actuel_id: '',
        date_entree_actuelle: '',
      });
    }
  }, [unite, show]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onHide();
    };
    if (show) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [show, onHide]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await updateUnite({ id: unite.id, ...formData }).unwrap();
      } else {
        await createUnite(formData).unwrap();
      }
      onHide();
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
    }
  };

  const error = createError || updateError;

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="lg"
      backdrop="static"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        borderRadius: '24px',
        overflow: 'hidden',
        border: 'none'
      }}>
        <Modal.Header 
          closeButton 
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            border: 'none',
            padding: '24px 32px'
          }}
        >
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5ZM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5 5 5Z"/>
            </svg>
            {isEdit ? 'Modifier l\'unité' : 'Nouvelle unité'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ padding: '32px', maxHeight: '70vh', overflowY: 'auto' }}>
          {error && (
            <div className="alert alert-danger rounded-3 mb-4" role="alert">
              <div className="d-flex align-items-center gap-2">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </svg>
                <span>Une erreur est survenue. Veuillez vérifier les informations saisies.</span>
              </div>
            </div>
          )}

          <form id="unite-form" onSubmit={handleSubmit}>
            {/* Identification */}
            <div className="rounded-4 p-4 mb-4" style={{ background: 'rgba(99, 102, 241, 0.05)' }}>
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#4f46e5' }}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1H2zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7z"/>
                </svg>
                Identification
              </h6>
              
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">
                    Numéro d'unité <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    name="numero_unite"
                    value={formData.numero_unite}
                    onChange={handleChange}
                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                    required
                    placeholder="Ex: A-101"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">Type d'unité <span className="text-danger">*</span></label>
                  <select
                    className="form-select rounded-3"
                    name="type_unite"
                    value={formData.type_unite}
                    onChange={handleChange}
                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                    required
                  >
                    <option value="appartement">Appartement</option>
                    <option value="bureau">Bureau</option>
                    <option value="local_commercial">Local commercial</option>
                    <option value="garage">Garage</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold small">
                    Adresse complète <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    name="adresse_complete"
                    value={formData.adresse_complete}
                    onChange={handleChange}
                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                    required
                    placeholder="Adresse complète de l'unité"
                  />
                </div>
              </div>
            </div>

            {/* Localisation */}
            <div className="rounded-4 p-4 mb-4" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#059669' }}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                </svg>
                Localisation
              </h6>
              
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">Immeuble</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    name="immeuble"
                    value={formData.immeuble}
                    onChange={handleChange}
                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                    placeholder="Nom de l'immeuble"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">Bloc</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    name="bloc"
                    value={formData.bloc}
                    onChange={handleChange}
                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                    placeholder="Bloc ou bâtiment"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">Étage</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    name="etage"
                    value={formData.etage}
                    onChange={handleChange}
                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                    placeholder="RDC, 1er, 2ème..."
                  />
                </div>
              </div>
            </div>

            {/* Caractéristiques */}
            <div className="rounded-4 p-4 mb-4" style={{ background: 'rgba(245, 158, 11, 0.05)' }}>
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#d97706' }}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z"/>
                </svg>
                Caractéristiques
              </h6>
              
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">Superficie (m²)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control rounded-3"
                    name="superficie_m2"
                    value={formData.superficie_m2}
                    onChange={handleChange}
                    onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                    placeholder="0.00"
                    min="0"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">Nombre de pièces</label>
                  <input
                    type="number"
                    className="form-control rounded-3"
                    name="nb_pieces"
                    value={formData.nb_pieces}
                    onChange={handleChange}
                    onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">Salles de bain</label>
                  <input
                    type="number"
                    className="form-control rounded-3"
                    name="nb_sdb"
                    value={formData.nb_sdb}
                    onChange={handleChange}
                    onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold small">Équipements</label>
                  <textarea
                    className="form-control rounded-3"
                    name="equipements"
                    value={formData.equipements}
                    onChange={handleChange}
                    onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                    rows="2"
                    placeholder="Climatisation, chauffage, cuisine équipée..."
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold small">Mobilier</label>
                  <textarea
                    className="form-control rounded-3"
                    name="mobilier"
                    value={formData.mobilier}
                    onChange={handleChange}
                    onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                    rows="2"
                    placeholder="Meublé, non meublé, détails du mobilier..."
                  />
                </div>
              </div>
            </div>

            {/* Statut et location */}
            <div className="rounded-4 p-4 mb-4" style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#2563eb' }}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                </svg>
                Statut et location
              </h6>
              
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">Statut</label>
                  <select
                    className="form-select rounded-3"
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                  >
                    <option value="vacant">Vacant</option>
                    <option value="loue">Loué</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="reserve">Réservé</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">Date d'entrée actuelle</label>
                  <input
                    type="date"
                    className="form-control rounded-3"
                    name="date_entree_actuelle"
                    value={formData.date_entree_actuelle}
                    onChange={handleChange}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">Locataire actuel</label>
                  <select
                    className="form-select rounded-3"
                    name="locataire_actuel_id"
                    value={formData.locataire_actuel_id}
                    onChange={handleChange}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                  >
                    <option value="">Aucun locataire</option>
                    {locataires?.data?.map(locataire => (
                      <option key={locataire.id} value={locataire.id}>
                        {locataire.nom} {locataire.prenom}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">ID Bail actuel</label>
                  <input
                    type="number"
                    className="form-control rounded-3"
                    name="bail_actuel_id"
                    value={formData.bail_actuel_id}
                    onChange={handleChange}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                    placeholder="ID du bail (optionnel)"
                  />
                </div>
              </div>
            </div>

          </form>
        </Modal.Body>

        <Modal.Footer style={{ 
          border: 'none', 
          padding: '24px 32px',
          background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)'
        }}>
          <button
            type="button"
            className="btn px-4 rounded-3"
            onClick={onHide}
            style={{
              background: '#f3f4f6',
              color: '#4b5563',
              border: 'none',
              fontWeight: '600',
              padding: '0.5rem 1.25rem'
            }}
          >
            Annuler
          </button>
          <button
            type="submit"
            form="unite-form"
            className="btn px-4 text-white rounded-3"
            disabled={isCreating || isUpdating}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              fontWeight: '600',
              padding: '0.5rem 1.25rem'
            }}
          >
            {isCreating || isUpdating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Enregistrement...
              </>
            ) : (
              isEdit ? 'Mettre à jour' : 'Créer l\'unité'
            )}
          </button>
        </Modal.Footer>
      </div>
    </Modal>
  );
}
