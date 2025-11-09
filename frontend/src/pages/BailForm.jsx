import React, { useEffect, useMemo, useState } from 'react';
import { useGetLocatairesQuery } from '../features/locataires/locatairesApi';
import { useGetUnitesQuery } from '../features/unites/unitesApi';

const empty = {
  numero_bail: '',
  locataire_id: '',
  unite_id: '',
  date_debut: '',
  date_fin: '',
  duree: '',
  montant_loyer: '',
  charges: '',
  depot_garantie: '',
  mode_paiement: 'virement',
  renouvellement_auto: true,
  clause_particuliere: '',
  observations: '',
  statut: 'en_attente',
};

export default function BailForm({ initialValue, onSubmit, saving }) {
  const [form, setForm] = useState(empty);
  const [locSearch, setLocSearch] = useState('');
  const [uniteSearch, setUniteSearch] = useState('');

  // Fetch locataires and unités for selects
  // Use 'search' param consumed by hook (translates to ?q=)
  const { data: locData } = useGetLocatairesQuery({ search: locSearch, per_page: 50 });
  const locataires = locData?.data || locData || [];
  // Request only vacant (available) units; hook translates 'search' to ?q=
  const { data: uniteData } = useGetUnitesQuery({ search: uniteSearch, per_page: 50, statut: 'vacant' });
  const unites = uniteData?.data || uniteData || [];

  useEffect(() => {
    if (initialValue) {
      setForm({ ...empty, ...initialValue });
    }
  }, [initialValue]);

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      numero_bail: form.numero_bail || undefined,
      locataire_id: form.locataire_id,
      unite_id: form.unite_id,
      date_debut: form.date_debut,
      date_fin: form.date_fin || undefined,
      duree: form.duree || undefined,
      montant_loyer: form.montant_loyer,
      charges: form.charges || 0,
      depot_garantie: form.depot_garantie || 0,
      mode_paiement: form.mode_paiement,
      renouvellement_auto: !!form.renouvellement_auto,
      clause_particuliere: form.clause_particuliere || undefined,
      observations: form.observations || undefined,
      statut: form.statut || undefined,
    };
    onSubmit && onSubmit(payload);
  };

  // Ensure selected options appear even if not in current page of results
  const mergedLocataires = useMemo(() => {
    if (!form.locataire_id) return locataires;
    const exists = Array.isArray(locataires) && locataires.some(l => String(l.id) === String(form.locataire_id));
    if (exists) return locataires;
    // If initialValue provided with nested locataire, include it
    const extra = initialValue?.locataire ? [initialValue.locataire] : [];
    return [...extra, ...(locataires || [])];
  }, [locataires, form.locataire_id, initialValue]);

  const mergedUnites = useMemo(() => {
    if (!form.unite_id) return unites;
    const exists = Array.isArray(unites) && unites.some(u => String(u.id) === String(form.unite_id));
    if (exists) return unites;
    const extra = initialValue?.unite ? [initialValue.unite] : [];
    return [...extra, ...(unites || [])];
  }, [unites, form.unite_id, initialValue]);

  const onSelectUnite = (uniteId) => {
    const id = uniteId ? Number(uniteId) : '';
    const u = (mergedUnites || []).find(x => String(x.id) === String(id));
    setForm(f => ({
      ...f,
      unite_id: id,
    }));
  };

  return (
    <form onSubmit={submit}>
      {/* Section 1: Identification */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-header bg-primary bg-opacity-10 border-0">
          <h6 className="mb-0 fw-semibold text-primary">
            <i className="bi bi-file-earmark-text me-2"></i>Identification du bail
          </h6>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold">
                <i className="bi bi-hash text-muted me-1"></i>Numéro bail
              </label>
              <input className="form-control" value={form.numero_bail} onChange={e => onChange('numero_bail', e.target.value)} placeholder="Généré automatiquement" />
              <div className="form-text">Laissez vide pour génération auto</div>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">
                <i className="bi bi-person text-primary me-1"></i>Locataire <span className="text-danger">*</span>
              </label>
              <div className="position-relative">
                <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  list="locataires-list"
                  className="form-control ps-5"
                  placeholder="Rechercher et sélectionner un locataire..."
                  value={form.locataire_id ? mergedLocataires?.find(l => String(l.id) === String(form.locataire_id))?.prenom ? `${mergedLocataires?.find(l => String(l.id) === String(form.locataire_id))?.prenom} ${mergedLocataires?.find(l => String(l.id) === String(form.locataire_id))?.nom || ''}`.trim() : (mergedLocataires?.find(l => String(l.id) === String(form.locataire_id))?.raison_sociale || '') : locSearch}
                  onChange={(e) => {
                    setLocSearch(e.target.value);
                    // Check if value matches a locataire
                    const match = mergedLocataires?.find(l => {
                      const name = l.prenom ? `${l.prenom} ${l.nom || ''}`.trim() : (l.raison_sociale || l.email || `#${l.id}`);
                      return name === e.target.value;
                    });
                    if (match) {
                      onChange('locataire_id', match.id);
                    } else if (!e.target.value) {
                      onChange('locataire_id', '');
                    }
                  }}
                  required
                />
                <datalist id="locataires-list">
                  {mergedLocataires?.map(l => (
                    <option key={l.id} value={l.prenom ? `${l.prenom} ${l.nom || ''}`.trim() : (l.raison_sociale || l.email || `#${l.id}`)}>
                      {l.email && `(${l.email})`}
                    </option>
                  ))}
                </datalist>
              </div>
              {form.locataire_id && (
                <div className="mt-2">
                  <span className="badge bg-primary bg-opacity-10 text-primary">
                    <i className="bi bi-check-circle me-1"></i>
                    Sélectionné: {mergedLocataires?.find(l => String(l.id) === String(form.locataire_id))?.prenom} {mergedLocataires?.find(l => String(l.id) === String(form.locataire_id))?.nom}
                  </span>
                </div>
              )}
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">
                <i className="bi bi-building text-success me-1"></i>Unité <span className="text-danger">*</span>
              </label>
              <div className="position-relative">
                <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  list="unites-list"
                  className="form-control ps-5"
                  placeholder="Rechercher et sélectionner une unité..."
                  value={form.unite_id ? (mergedUnites?.find(u => String(u.id) === String(form.unite_id))?.reference || mergedUnites?.find(u => String(u.id) === String(form.unite_id))?.numero_unite || '') : uniteSearch}
                  onChange={(e) => {
                    setUniteSearch(e.target.value);
                    // Check if value matches a unite
                    const match = mergedUnites?.find(u => {
                      const ref = u.reference || u.numero_unite || `#${u.id}`;
                      return ref === e.target.value;
                    });
                    if (match) {
                      onSelectUnite(match.id);
                    } else if (!e.target.value) {
                      onSelectUnite('');
                    }
                  }}
                  required
                />
                <datalist id="unites-list">
                  {mergedUnites?.map(u => (
                    <option key={u.id} value={u.reference || u.numero_unite || `#${u.id}`}>
                      {u.adresse_complete && `${u.adresse_complete} - `}{u.type_unite} ({u.statut})
                    </option>
                  ))}
                </datalist>
              </div>
              {form.unite_id && (
                <div className="mt-2">
                  <span className="badge bg-success bg-opacity-10 text-success">
                    <i className="bi bi-check-circle me-1"></i>
                    Sélectionné: {mergedUnites?.find(u => String(u.id) === String(form.unite_id))?.numero_unite}
                  </span>
                </div>
              )}
              <div className="form-text mt-1">
                <i className="bi bi-info-circle me-1"></i>Seules les unités vacantes sont listées
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unit details panel */}
      {form.unite_id && (
        <div className="card mb-4 border-0 shadow-sm bg-light">
          <div className="card-body">
            <div className="d-flex align-items-start gap-3">
              <div className="bg-white rounded-circle p-3 shadow-sm">
                <i className="bi bi-house-gear fs-3 text-success"></i>
              </div>
              <div className="flex-grow-1">
                <h6 className="fw-semibold mb-2 text-success">
                  <i className="bi bi-check-circle-fill me-1"></i>Détails de l'unité sélectionnée
                </h6>
                {(() => {
                  const u = (mergedUnites || []).find(x => String(x.id) === String(form.unite_id));
                  if (!u) return null;
                  const equip = Array.isArray(u.equipements) ? u.equipements : (typeof u.equipements === 'string' ? u.equipements.split(',').map(s => s.trim()).filter(Boolean) : []);
                  return (
                    <div className="row g-3">
                      <div className="col-md-3">
                        <div className="small text-muted mb-1">Type</div>
                        <div className="fw-semibold">
                          <i className="bi bi-tag me-1 text-primary"></i>{u.type_unite}
                        </div>
                      </div>
                      <div className="col-md-5">
                        <div className="small text-muted mb-1">Adresse</div>
                        <div className="fw-semibold">
                          <i className="bi bi-geo-alt me-1 text-danger"></i>{u.adresse_complete}
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="small text-muted mb-1">Superficie</div>
                        <div className="fw-semibold">
                          <i className="bi bi-rulers me-1 text-info"></i>{u.superficie_m2 ?? '—'} m²
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="small text-muted mb-1">Pièces / SDB</div>
                        <div className="fw-semibold">
                          <i className="bi bi-door-open me-1 text-warning"></i>{u.nb_pieces ?? '—'} / {u.nb_sdb ?? '—'}
                        </div>
                      </div>
                      {equip.length > 0 && (
                        <div className="col-12">
                          <div className="small text-muted mb-2">Équipements</div>
                          <div className="d-flex flex-wrap gap-2">
                            {equip.map((eq, idx) => (
                              <span key={idx} className="badge rounded-pill bg-white text-dark border shadow-sm">
                                <i className="bi bi-check2 text-success me-1"></i>{eq}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Période */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-header bg-info bg-opacity-10 border-0">
          <h6 className="mb-0 fw-semibold text-info">
            <i className="bi bi-calendar-range me-2"></i>Période du bail
          </h6>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold">
                <i className="bi bi-calendar-check text-success me-1"></i>Date début <span className="text-danger">*</span>
              </label>
              <input type="date" className="form-control" value={form.date_debut} onChange={e => onChange('date_debut', e.target.value)} required />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">
                <i className="bi bi-calendar-x text-danger me-1"></i>Date fin
              </label>
              <input type="date" className="form-control" value={form.date_fin || ''} onChange={e => onChange('date_fin', e.target.value)} />
              <div className="form-text">Optionnel si renouvellement auto</div>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">
                <i className="bi bi-hourglass-split text-warning me-1"></i>Durée (mois)
              </label>
              <input type="number" className="form-control" value={form.duree} onChange={e => onChange('duree', e.target.value)} placeholder="Ex: 12" />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Aspects financiers */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-header bg-success bg-opacity-10 border-0">
          <h6 className="mb-0 fw-semibold text-success">
            <i className="bi bi-cash-stack me-2"></i>Aspects financiers
          </h6>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold">
                <i className="bi bi-currency-exchange text-success me-1"></i>Loyer mensuel <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input type="number" step="0.01" className="form-control" value={form.montant_loyer} onChange={e => onChange('montant_loyer', e.target.value)} required placeholder="0.00" />
                <span className="input-group-text bg-success text-white">MAD</span>
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">
                <i className="bi bi-receipt text-info me-1"></i>Charges mensuelles
              </label>
              <div className="input-group">
                <input type="number" step="0.01" className="form-control" value={form.charges} onChange={e => onChange('charges', e.target.value)} placeholder="0.00" />
                <span className="input-group-text bg-info text-white">MAD</span>
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">
                <i className="bi bi-shield-check text-warning me-1"></i>Dépôt de garantie
              </label>
              <div className="input-group">
                <input type="number" step="0.01" className="form-control" value={form.depot_garantie} onChange={e => onChange('depot_garantie', e.target.value)} placeholder="0.00" />
                <span className="input-group-text bg-warning text-dark">MAD</span>
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                <i className="bi bi-credit-card text-primary me-1"></i>Mode de paiement
              </label>
              <select className="form-select" value={form.mode_paiement} onChange={e => onChange('mode_paiement', e.target.value)}>
                <option value="virement">🏦 Virement bancaire</option>
                <option value="cheque">📝 Chèque</option>
                <option value="especes">💵 Espèces</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold d-block">
                <i className="bi bi-arrow-repeat text-info me-1"></i>Renouvellement automatique
              </label>
              <div className="form-check form-switch mt-2">
                <input className="form-check-input" type="checkbox" role="switch" id="renouvellement" checked={!!form.renouvellement_auto} onChange={e => onChange('renouvellement_auto', e.target.checked)} />
                <label className="form-check-label fw-semibold" htmlFor="renouvellement">
                  {form.renouvellement_auto ? '✓ Activé' : '✗ Désactivé'}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Clauses et observations */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-header bg-warning bg-opacity-10 border-0">
          <h6 className="mb-0 fw-semibold text-warning">
            <i className="bi bi-pencil-square me-2"></i>Clauses et observations
          </h6>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label fw-semibold">
                <i className="bi bi-file-earmark-richtext text-warning me-1"></i>Clause particulière
              </label>
              <textarea className="form-control" rows={3} value={form.clause_particuliere} onChange={e => onChange('clause_particuliere', e.target.value)} placeholder="Conditions ou clauses spécifiques du bail..." />
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold">
                <i className="bi bi-journal-text text-secondary me-1"></i>Observations
              </label>
              <textarea className="form-control" rows={2} value={form.observations} onChange={e => onChange('observations', e.target.value)} placeholder="Remarques additionnelles..." />
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Statut */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-header bg-secondary bg-opacity-10 border-0">
          <h6 className="mb-0 fw-semibold text-secondary">
            <i className="bi bi-flag me-2"></i>Statut du bail
          </h6>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold">
                <i className="bi bi-toggle-on text-secondary me-1"></i>Statut
              </label>
              <select className="form-select" value={form.statut} onChange={e => onChange('statut', e.target.value)}>
                <option value="en_attente">⏳ En attente</option>
                <option value="actif">✅ Actif</option>
                <option value="resilie">❌ Résilié</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Submit button */}
      <div className="d-flex justify-content-end gap-2 mt-4">
        <button type="submit" className="btn btn-primary btn-lg px-5 shadow" disabled={!!saving}>
          {saving ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Enregistrement en cours...
            </>
          ) : (
            <>
              <i className="bi bi-check-circle me-2"></i>
              Enregistrer le bail
            </>
          )}
        </button>
      </div>
    </form>
  );
}
