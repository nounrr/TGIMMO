import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGetMandatQuery, useUpdateMandatMutation } from '../api/baseApi';

// Helper to format date from backend to YYYY-MM-DD
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

export default function MandatEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const mandatState = location.state?.mandat;
  const { data, isFetching } = useGetMandatQuery(id, { skip: !!mandatState });
  const [updateMandat, { isLoading }] = useUpdateMandatMutation();
  const [form, setForm] = useState(null);

  useEffect(() => {
    const source = mandatState || data;
    if (source && !form) {
      setForm({
        proprietaire_id: source.proprietaire_id,
        reference: source.reference || '',
        date_debut: formatDateForInput(source.date_debut),
        date_fin: formatDateForInput(source.date_fin),
        taux_gestion_pct: source.taux_gestion_pct ?? '',
        assiette_honoraires: source.assiette_honoraires || 'loyers_encaisse',
        tva_applicable: !!source.tva_applicable,
        tva_taux: source.tva_taux ?? '',
        frais_min_mensuel: source.frais_min_mensuel ?? '',
        periodicite_releve: source.periodicite_releve || 'mensuel',
        charge_maintenance: source.charge_maintenance || 'proprietaire',
        mode_versement: source.mode_versement || 'virement',
        description_bien: source.description_bien || '',
        usage_bien: source.usage_bien || 'habitation',
        pouvoirs_accordes: source.pouvoirs_accordes || '',
        lieu_signature: source.lieu_signature || '',
        date_signature: formatDateForInput(source.date_signature),
        langue: source.langue || 'fr',
        notes_clauses: source.notes_clauses || '',
        statut: source.statut || 'brouillon',
      });
    }
  }, [data, mandatState]);

  if ((isFetching && !mandatState) || !form) {
    return <div className="p-3 p-lg-4 text-center"><span className="spinner-border" /></div>;
  }

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onSave = async () => {
    try {
      const payload = {
        ...form,
        taux_gestion_pct: form.taux_gestion_pct === '' ? null : Number(form.taux_gestion_pct),
        tva_taux: form.tva_taux === '' ? null : Number(form.tva_taux),
        frais_min_mensuel: form.frais_min_mensuel === '' ? null : Number(form.frais_min_mensuel),
      };
      await updateMandat({ id, payload }).unwrap();
      navigate('/mandats');
    } catch (err) {
      console.error(err);
      alert('Erreur de mise à jour du mandat');
    }
  };

  return (
    <div className="p-3 p-lg-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Mandat de Gestion #{id}</h1>
          <p className="text-muted mb-0">Référence: {form.reference || '—'}</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary px-4" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-2"></i>Retour
          </button>
          <button className="btn btn-primary px-4" disabled={isLoading} onClick={onSave}>
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Enregistrement...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2"></i>Enregistrer
              </>
            )}
          </button>
        </div>
      </div>

      {/* Linked proprietor info panel */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderLeft: '4px solid #0d6efd' }}>
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-person-badge fs-4 text-primary"></i>
              <div>
                <div className="small text-muted mb-1">Propriétaire</div>
                <strong className="fs-5">{(mandatState?.proprietaire?.nom_raison) || (data?.proprietaire?.nom_raison) || data?.proprietaire?.email || `#${data?.proprietaire_id}`}</strong>
              </div>
            </div>
            <div className="vr"></div>
            <div className="small">
              <div className="text-muted">ID: {data?.proprietaire_id}</div>
              {(mandatState?.proprietaire?.email || data?.proprietaire?.email) && <div className="text-muted">{mandatState?.proprietaire?.email || data?.proprietaire?.email}</div>}
            </div>
            {(mandatState?.proprietaire?.telephone || data?.proprietaire?.telephone) && (
              <>
                <div className="vr"></div>
                <div className="small">
                  <div className="text-muted">Téléphone</div>
                  <div>{mandatState?.proprietaire?.telephone || data?.proprietaire?.telephone}</div>
                </div>
              </>
            )}
            {(mandatState?.proprietaire?.type || data?.proprietaire?.type) && (
              <>
                <div className="vr"></div>
                <div className="small">
                  <div className="text-muted">Type</div>
                  <div className="text-capitalize">{mandatState?.proprietaire?.type || data?.proprietaire?.type}</div>
                </div>
              </>
            )}
            <div className="ms-auto">
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/proprietaires`)}>
                <i className="bi bi-arrow-right-circle me-1"></i>Voir fiche
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main form card */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom py-3">
          <h5 className="mb-0 fw-semibold">
            <i className="bi bi-file-text me-2 text-primary"></i>
            Informations du mandat
          </h5>
        </div>
        <div className="card-body p-4">
          {/* Section: Informations générales */}
          <div className="mb-4">
            <h6 className="text-uppercase text-muted fw-semibold mb-3 border-bottom pb-2">
              <i className="bi bi-info-circle me-2"></i>Informations générales
            </h6>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-medium">Référence</label>
                <input className="form-control" value={form.reference} onChange={e => onChange('reference', e.target.value)} placeholder="Générée automatiquement" disabled />
                <small className="form-text text-muted">Auto-générée lors de la création</small>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-medium">Date début <span className="text-danger">*</span></label>
                <input type="date" className="form-control" value={form.date_debut} onChange={e => onChange('date_debut', e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-medium">Date fin</label>
                <input type="date" className="form-control" value={form.date_fin || ''} onChange={e => onChange('date_fin', e.target.value)} />
                <small className="form-text text-muted">Optionnelle</small>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-medium">Langue</label>
                <select className="form-select" value={form.langue} onChange={e => onChange('langue', e.target.value)}>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="ar">🇲🇦 Arabe</option>
                  <option value="ar_fr">🇲🇦🇫🇷 Ar + Fr</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-medium">Statut</label>
                <select className="form-select" value={form.statut} onChange={e => onChange('statut', e.target.value)}>
                  <option value="brouillon">📝 Brouillon</option>
                  <option value="en_validation">⏳ En validation</option>
                  <option value="signe">✅ Signé</option>
                  <option value="actif">🟢 Actif</option>
                  <option value="resilie">🔴 Résilié</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Honoraires et facturation */}
          <div className="mb-4">
            <h6 className="text-uppercase text-muted fw-semibold mb-3 border-bottom pb-2">
              <i className="bi bi-cash-coin me-2"></i>Honoraires et facturation
            </h6>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-medium">Taux gestion (%)</label>
                <div className="input-group">
                  <input type="number" step="0.01" className="form-control" value={form.taux_gestion_pct} onChange={e => onChange('taux_gestion_pct', e.target.value)} placeholder="0.00" />
                  <span className="input-group-text">%</span>
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-medium">Assiette honoraires</label>
                <select className="form-select" value={form.assiette_honoraires} onChange={e => onChange('assiette_honoraires', e.target.value)}>
                  <option value="loyers_encaisse">Loyers encaissés</option>
                  <option value="loyers_factures">Loyers facturés</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-medium">Frais min. mensuel</label>
                <div className="input-group">
                  <input type="number" step="0.01" className="form-control" value={form.frais_min_mensuel} onChange={e => onChange('frais_min_mensuel', e.target.value)} placeholder="0.00" />
                  <span className="input-group-text">MAD</span>
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-medium">Périodicité relevé</label>
                <select className="form-select" value={form.periodicite_releve} onChange={e => onChange('periodicite_releve', e.target.value)}>
                  <option value="mensuel">Mensuel</option>
                  <option value="trimestriel">Trimestriel</option>
                  <option value="annuel">Annuel</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-medium d-block">TVA applicable</label>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" id="tva_applicable" checked={!!form.tva_applicable} onChange={e => onChange('tva_applicable', e.target.checked)} />
                  <label className="form-check-label" htmlFor="tva_applicable">
                    {form.tva_applicable ? 'Oui' : 'Non'}
                  </label>
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-medium">TVA taux (%)</label>
                <div className="input-group">
                  <input type="number" step="0.01" className="form-control" value={form.tva_taux} onChange={e => onChange('tva_taux', e.target.value)} disabled={!form.tva_applicable} placeholder="20.00" />
                  <span className="input-group-text">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Gestion et maintenance */}
          <div className="mb-4">
            <h6 className="text-uppercase text-muted fw-semibold mb-3 border-bottom pb-2">
              <i className="bi bi-gear me-2"></i>Gestion et maintenance
            </h6>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label fw-medium">Charge maintenance</label>
                <select className="form-select" value={form.charge_maintenance} onChange={e => onChange('charge_maintenance', e.target.value)}>
                  <option value="proprietaire">Propriétaire</option>
                  <option value="locataire">Locataire</option>
                  <option value="agence">Agence</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-medium">Mode versement</label>
                <select className="form-select" value={form.mode_versement} onChange={e => onChange('mode_versement', e.target.value)}>
                  <option value="virement">💳 Virement</option>
                  <option value="cheque">📄 Chèque</option>
                  <option value="espece">💵 Espèces</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-medium">Usage du bien</label>
                <select className="form-select" value={form.usage_bien} onChange={e => onChange('usage_bien', e.target.value)}>
                  <option value="habitation">🏠 Habitation</option>
                  <option value="commercial">🏢 Commercial</option>
                  <option value="mixte">🏘️ Mixte</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Description et pouvoirs */}
          <div className="mb-4">
            <h6 className="text-uppercase text-muted fw-semibold mb-3 border-bottom pb-2">
              <i className="bi bi-file-earmark-text me-2"></i>Description et pouvoirs
            </h6>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-medium">Description du bien</label>
                <textarea className="form-control" rows={3} value={form.description_bien} onChange={e => onChange('description_bien', e.target.value)} placeholder="Décrire le bien faisant l'objet du mandat..." />
              </div>
              <div className="col-12">
                <label className="form-label fw-medium">Pouvoirs accordés</label>
                <textarea className="form-control" rows={5} value={form.pouvoirs_accordes} onChange={e => onChange('pouvoirs_accordes', e.target.value)} placeholder="Détailler les pouvoirs et responsabilités accordés au gestionnaire..." />
              </div>
              <div className="col-12">
                <label className="form-label fw-medium">Notes / Clauses particulières</label>
                <textarea className="form-control" rows={4} value={form.notes_clauses} onChange={e => onChange('notes_clauses', e.target.value)} placeholder="Ajouter des notes ou clauses spécifiques..." />
              </div>
            </div>
          </div>

          {/* Section: Signature */}
          <div>
            <h6 className="text-uppercase text-muted fw-semibold mb-3 border-bottom pb-2">
              <i className="bi bi-pen me-2"></i>Signature
            </h6>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-medium">Lieu de signature</label>
                <input className="form-control" value={form.lieu_signature} onChange={e => onChange('lieu_signature', e.target.value)} placeholder="Ex: Casablanca, Maroc" />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-medium">Date de signature</label>
                <input type="date" className="form-control" value={form.date_signature} onChange={e => onChange('date_signature', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
