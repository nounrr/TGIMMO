import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGetAvenantQuery, useUpdateAvenantMutation, useGetMeQuery } from '../api/baseApi';

// Helper to format date from backend to YYYY-MM-DD
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

export default function AvenantEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const avenantState = location.state?.avenant;
  const { data, isFetching } = useGetAvenantQuery(id, { skip: !!avenantState });
  const { data: me } = useGetMeQuery();
  const [updateAvenant, { isLoading }] = useUpdateAvenantMutation();
  const [form, setForm] = useState(null);

  useEffect(() => {
    const source = avenantState || data;
    if (source && !form) {
      setForm({
        mandat_id: source.mandat_id,
        reference: source.reference || '',
        date_pouvoir_initial: formatDateForInput(source.date_pouvoir_initial),
        objet_resume: source.objet_resume || '',
        modifs_text: source.modifs_text || '',
        date_effet: formatDateForInput(source.date_effet),
        lieu_signature: source.lieu_signature || '',
        date_signature: formatDateForInput(source.date_signature),
        rep_b_user_id: source.rep_b_user_id || me?.id || '',
        statut: source.statut || 'brouillon',
        fichier_url: source.fichier_url || '',
        created_by: source.created_by || '',
      });
    }
  }, [data, avenantState]);

  if ((isFetching && !avenantState) || !form) {
    return <div className="p-3 p-lg-4 text-center"><span className="spinner-border" /></div>;
  }

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onSave = async () => {
    try {
      let payload = {
        ...form,
        mandat_id: Number(form.mandat_id),
        rep_b_user_id: form.rep_b_user_id ? Number(form.rep_b_user_id) : undefined,
        created_by: form.created_by ? Number(form.created_by) : undefined,
      };
      if (form.file) {
        payload.file = form.file; // handled in api layer -> mapped to 'fichier'
      }
      await updateAvenant({ id, payload }).unwrap();
      navigate('/avenants');
    } catch (err) {
      console.error(err);
      alert('Erreur de mise à jour de l\'avenant');
    }
  };

  return (
    <div className="p-3 p-lg-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Avenant au Mandat #{id}</h1>
          <p className="text-muted mb-0">Référence: {form.reference || '—'} • Mandat: #{form.mandat_id}</p>
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

      {/* Linked mandat info panel */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderLeft: '4px solid #ffc107' }}>
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-file-text fs-4 text-warning"></i>
              <div>
                <div className="small text-muted mb-1">Mandat parent</div>
                <strong className="fs-5">
                  {(avenantState?.mandat?.reference) || data?.mandat?.reference || `Mandat #${data?.mandat_id}`}
                </strong>
              </div>
            </div>
            <div className="vr"></div>
            <div className="small">
              <div className="text-muted">ID</div>
              <div>{data?.mandat_id}</div>
            </div>
            {(avenantState?.mandat?.proprietaire || data?.mandat?.proprietaire) && (
              <>
                <div className="vr"></div>
                <div className="small">
                  <div className="text-muted">Propriétaire</div>
                  <div>{(avenantState?.mandat?.proprietaire?.nom_raison) || (data?.mandat?.proprietaire?.nom_raison) || (data?.mandat?.proprietaire?.email) || `#${data?.mandat?.proprietaire_id}`}</div>
                </div>
              </>
            )}
            {(avenantState?.mandat?.date_debut || data?.mandat?.date_debut) && (
              <>
                <div className="vr"></div>
                <div className="small">
                  <div className="text-muted">Date début mandat</div>
                  <div>{new Date(avenantState?.mandat?.date_debut || data.mandat.date_debut).toLocaleDateString('fr-FR')}</div>
                </div>
              </>
            )}
            {(avenantState?.mandat?.statut || data?.mandat?.statut) && (
              <>
                <div className="vr"></div>
                <div className="small">
                  <div className="text-muted">Statut mandat</div>
                  <div className="text-capitalize">{avenantState?.mandat?.statut || data.mandat.statut}</div>
                </div>
              </>
            )}
            <div className="ms-auto">
              <button type="button" className="btn btn-sm btn-outline-warning" onClick={() => navigate(`/mandats/${data?.mandat_id}`)}>
                <i className="bi bi-arrow-right-circle me-1"></i>Voir mandat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main form card */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom py-3">
          <h5 className="mb-0 fw-semibold">
            <i className="bi bi-file-earmark-plus me-2 text-primary"></i>
            Informations de l'avenant
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
                <input className="form-control" value={form.reference} onChange={e => onChange('reference', e.target.value)} placeholder="Référence avenant" />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-medium">Date pouvoir initial</label>
                <input type="date" className="form-control" value={form.date_pouvoir_initial || ''} onChange={e => onChange('date_pouvoir_initial', e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-medium">Date effet <span className="text-danger">*</span></label>
                <input type="date" className="form-control" value={form.date_effet || ''} onChange={e => onChange('date_effet', e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-medium">Statut</label>
                <select className="form-select" value={form.statut} onChange={e => onChange('statut', e.target.value)}>
                  <option value="brouillon">📝 Brouillon</option>
                  <option value="signe">✅ Signé</option>
                  <option value="actif">🟢 Actif</option>
                  <option value="annule">🔴 Annulé</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Objet et modifications */}
          <div className="mb-4">
            <h6 className="text-uppercase text-muted fw-semibold mb-3 border-bottom pb-2">
              <i className="bi bi-pencil-square me-2"></i>Objet et modifications
            </h6>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-medium">Objet résumé</label>
                <input className="form-control" value={form.objet_resume} onChange={e => onChange('objet_resume', e.target.value)} placeholder="Résumé de l'objet de l'avenant" />
              </div>
              <div className="col-12">
                <label className="form-label fw-medium">Modifications / Texte détaillé</label>
                <textarea rows={5} className="form-control" value={form.modifs_text} onChange={e => onChange('modifs_text', e.target.value)} placeholder="Décrire en détail les modifications apportées au mandat..." />
              </div>
            </div>
          </div>

          {/* Section: Signature et document */}
          <div className="mb-4">
            <h6 className="text-uppercase text-muted fw-semibold mb-3 border-bottom pb-2">
              <i className="bi bi-pen me-2"></i>Signature et document
            </h6>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-medium">Lieu de signature</label>
                <input className="form-control" value={form.lieu_signature} onChange={e => onChange('lieu_signature', e.target.value)} placeholder="Ex: Casablanca, Maroc" />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-medium">Date de signature</label>
                <input type="date" className="form-control" value={form.date_signature || ''} onChange={e => onChange('date_signature', e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-medium">Signataire interne (ID) <span className="text-danger">*</span></label>
                <input className="form-control" type="number" value={form.rep_b_user_id || ''} onChange={e => onChange('rep_b_user_id', e.target.value)} placeholder={`Ex: ${me?.id || '1'}`} />
                <small className="form-text text-muted">ID de l'utilisateur signataire</small>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-medium">
                  <i className="bi bi-upload me-2"></i>Fichier (upload)
                </label>
                <input className="form-control" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => onChange('file', e.target.files?.[0])} />
                {form.fichier_url && (
                  <div className="mt-2">
                    <div className="alert alert-info d-flex align-items-center py-2 mb-0">
                      <i className="bi bi-file-earmark-pdf me-2"></i>
                      <span className="me-auto">Fichier actuel disponible</span>
                      <a href={form.fichier_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                        <i className="bi bi-eye me-1"></i>Ouvrir
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-medium">Créé par (ID)</label>
                <input className="form-control" type="number" value={form.created_by || ''} onChange={e => onChange('created_by', e.target.value)} placeholder="ID utilisateur créateur" disabled />
                <small className="form-text text-muted">Créateur de l'avenant (non modifiable)</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
