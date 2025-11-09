import React, { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGetBailQuery, useGetRemisesClesQuery, useCreateRemiseCleMutation } from '../api/baseApi';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';

export default function BailRemiseCles() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: bailData } = useGetBailQuery(id);
  const { can } = useAuthz();
  const bail = bailData?.data || bailData;

  const { data: remisesData, refetch } = useGetRemisesClesQuery(id);
  const remises = remisesData?.data || [];

  const [createRemise, { isLoading }] = useCreateRemiseCleMutation();

  const [dateRemise, setDateRemise] = useState(() => new Date().toISOString().slice(0,16)); // datetime-local
  const [portes, setPortes] = useState({ checked: false, nombre: 0 });
  const [boites, setBoites] = useState({ checked: false, nombre: 0 });
  const [portails, setPortails] = useState({ checked: false, nombre: 0 });
  const [autresList, setAutresList] = useState([{ label: '', nombre: 0 }]);
  const [remarques, setRemarques] = useState('');

  const addAutre = () => setAutresList(l => [...l, { label: '', nombre: 0 }]);
  const updateAutre = (idx, key, val) => setAutresList(l => l.map((a, i) => i === idx ? { ...a, [key]: val } : a));
  const removeAutre = (idx) => setAutresList(l => l.filter((_, i) => i !== idx));

  // Normalisation des différents formats possibles de stockage JSON (ancien objet vs nouveau tableau)
  const normalizeCles = (raw) => {
    if (Array.isArray(raw)) return raw; // nouveau format déjà OK
    if (raw && typeof raw === 'object') {
      const out = [];
      const mapping = {
        porte_principale: 'Porte principale',
        boite_lettres: 'Boîte aux lettres',
        portail_garage: 'Portail / Garage'
      };
      Object.entries(mapping).forEach(([key, label]) => {
        const node = raw[key];
        if (!node) return;
        const qty = node.nombre ?? node.count;
        const checked = node.checked === undefined || node.checked === true;
        if (checked && qty && qty > 0) {
          out.push({ type: key, label, nombre: qty });
        }
      });
      if (Array.isArray(raw.autres)) {
        raw.autres.forEach(a => {
          if (!a) return;
          const qty = a.nombre ?? a.count;
          if (a.label && qty && qty > 0) {
            out.push({ type: 'autre', label: a.label, nombre: qty });
          }
        });
      }
      return out;
    }
    return [];
  };

  const computeSelectedSummary = () => {
    const items = [];
    if (portes.checked && portes.nombre > 0) items.push(`Porte (${portes.nombre})`);
    if (boites.checked && boites.nombre > 0) items.push(`Boîte (${boites.nombre})`);
    if (portails.checked && portails.nombre > 0) items.push(`Portail (${portails.nombre})`);
    autresList.forEach(a => { if (a.label && a.nombre > 0) items.push(`${a.label} (${a.nombre})`); });
    return items;
  };

  const clearForm = () => {
    setRemarques('');
    setPortes({ checked: false, nombre: 0 });
    setBoites({ checked: false, nombre: 0 });
    setPortails({ checked: false, nombre: 0 });
    setAutresList([{ label: '', nombre: 0 }]);
    setDateRemise(new Date().toISOString().slice(0,16));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const cles = [];
    if (portes.checked && portes.nombre > 0) cles.push({ type: 'porte_principale', label: 'Porte principale', nombre: Number(portes.nombre) });
    if (boites.checked && boites.nombre > 0) cles.push({ type: 'boite_lettres', label: 'Boîte aux lettres', nombre: Number(boites.nombre) });
    if (portails.checked && portails.nombre > 0) cles.push({ type: 'portail_garage', label: 'Portail / Garage', nombre: Number(portails.nombre) });
    const autres = autresList
      .map(a => ({ ...a, nombre: Number(a.nombre) }))
      .filter(a => a.label && a.nombre > 0)
      .map(a => ({ type: 'autre', label: a.label, nombre: a.nombre }));
    const payload = {
      date_remise: new Date(dateRemise).toISOString(),
      cles: [...cles, ...autres],
      remarques: remarques || undefined,
    };
    if (payload.cles.length === 0) {
      alert('Veuillez sélectionner au moins une clé avec une quantité.');
      return;
    }
    try {
      await createRemise({ bailId: id, payload }).unwrap();
      setRemarques('');
      setPortes({ checked: false, nombre: 0 });
      setBoites({ checked: false, nombre: 0 });
      setPortails({ checked: false, nombre: 0 });
      setAutresList([{ label: '', nombre: 0 }]);
      refetch();
      alert('Remise de clés enregistrée');
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'enregistrement de la remise de clés");
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="rounded-4 mb-4 position-relative overflow-hidden" style={{background: 'linear-gradient(135deg,#0d6efd,#6610f2)', color:'#fff'}}>
        <div className="p-4">
          <nav aria-label="breadcrumb" className="small mb-2">
            <ol className="breadcrumb breadcrumb-alt mb-0">
              <li className="breadcrumb-item"><Link to="/baux" className="text-decoration-none text-white-50">Baux</Link></li>
              <li className="breadcrumb-item"><Link to={`/baux/${id}`} className="text-decoration-none text-white-50">Bail #{id}</Link></li>
              <li className="breadcrumb-item active text-white" aria-current="page">Remise de clés</li>
            </ol>
          </nav>
          <h3 className="fw-semibold d-flex align-items-center gap-2 mb-1">
            <span className="p-2 rounded-3 bg-white bg-opacity-10 d-inline-flex"><i className="bi bi-key" /></span>
            Remise de clés
          </h3>
          {bail && (
            <p className="mb-0 small text-white-50">Numéro: <span className="text-white fw-medium">{bail.numero_bail}</span> • Locataire: {bail.locataire?.prenom} {bail.locataire?.nom}</p>
          )}
        </div>
        <div className="position-absolute top-0 end-0 p-3">
          <button className="btn btn-light btn-sm" onClick={() => navigate(-1)}><i className="bi bi-arrow-left me-1" />Retour</button>
        </div>
      </div>

      <div className="row g-4">
  {can(PERMS.remises_cles.create) && (
  <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-lg rounded-4" style={{background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(6px)'}}>
            <div className="card-header border-0 bg-transparent pb-0">
              <div className="d-flex justify-content-between align-items-start">
                <h6 className="mb-0 fw-semibold d-flex align-items-center gap-2"><i className="bi bi-pencil-square text-primary"></i>Nouvelle remise</h6>
                {computeSelectedSummary().length > 0 && (
                  <div className="d-flex flex-wrap gap-1" style={{maxWidth: '60%'}}>
                    {computeSelectedSummary().map((t,i) => <span key={i} className="badge bg-primary-subtle text-primary border border-primary-subtle small">{t}</span>)}
                  </div>
                )}
              </div>
            </div>
            <div className="card-body pt-3">
              <form onSubmit={onSubmit} className="vstack gap-4">
                <div>
                  <label className="form-label fw-medium">Date & heure</label>
                  <input type="datetime-local" className="form-control form-control-lg" value={dateRemise} onChange={e => setDateRemise(e.target.value)} required />
                </div>

                <div className="vstack gap-3">
                  <label className="form-label fw-medium mb-0">Clés remises</label>
                  <div className="vstack gap-2">
                    <div className="row g-2 align-items-center">
                      <div className="col">
                        <div className="form-check form-switch">
                          <input type="checkbox" className="form-check-input" checked={portes.checked} onChange={e => setPortes(p => ({ ...p, checked: e.target.checked }))} id="porte_principale_chk" />
                          <label htmlFor="porte_principale_chk" className="form-check-label">Porte principale</label>
                        </div>
                      </div>
                      <div className="col-auto col-sm-4 col-md-3">
                        <input type="number" min="0" step="1" className="form-control" placeholder="Qté" value={portes.nombre} onChange={e => setPortes(p => ({ ...p, nombre: e.target.value }))} disabled={!portes.checked} />
                      </div>
                    </div>
                    <div className="row g-2 align-items-center">
                      <div className="col">
                        <div className="form-check form-switch">
                          <input type="checkbox" className="form-check-input" checked={boites.checked} onChange={e => setBoites(p => ({ ...p, checked: e.target.checked }))} id="boite_lettres_chk" />
                          <label htmlFor="boite_lettres_chk" className="form-check-label">Boîte aux lettres</label>
                        </div>
                      </div>
                      <div className="col-auto col-sm-4 col-md-3">
                        <input type="number" min="0" step="1" className="form-control" placeholder="Qté" value={boites.nombre} onChange={e => setBoites(p => ({ ...p, nombre: e.target.value }))} disabled={!boites.checked} />
                      </div>
                    </div>
                    <div className="row g-2 align-items-center">
                      <div className="col">
                        <div className="form-check form-switch">
                          <input type="checkbox" className="form-check-input" checked={portails.checked} onChange={e => setPortails(p => ({ ...p, checked: e.target.checked }))} id="portail_chk" />
                          <label htmlFor="portail_chk" className="form-check-label">Portail / Garage</label>
                        </div>
                      </div>
                      <div className="col-auto col-sm-4 col-md-3">
                        <input type="number" min="0" step="1" className="form-control" placeholder="Qté" value={portails.nombre} onChange={e => setPortails(p => ({ ...p, nombre: e.target.value }))} disabled={!portails.checked} />
                      </div>
                    </div>
                    <div className="mt-3 border-top pt-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="fw-semibold d-flex align-items-center gap-1"><i className="bi bi-grid me-1 text-primary" />Autres éléments</span>
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={addAutre}><i className="bi bi-plus-circle me-1"></i>Ajouter</button>
                      </div>
                      <div className="vstack gap-2">
                        {autresList.map((a, idx) => (
                          <div className="d-flex align-items-center gap-2" key={idx}>
                            <input type="text" className="form-control" placeholder="Ex: télécommande, badge" value={a.label} onChange={e => updateAutre(idx, 'label', e.target.value)} />
                            <input type="number" min="0" className="form-control" style={{ width: 110 }} placeholder="Qté" value={a.nombre} onChange={e => updateAutre(idx, 'nombre', e.target.value)} />
                            <button type="button" className="btn btn-icon btn-outline-danger" onClick={() => removeAutre(idx)} title="Retirer"><i className="bi bi-x-lg"></i></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="vstack gap-2">
                  <label className="form-label fw-medium">Remarques (optionnel)</label>
                  <textarea className="form-control" rows={3} value={remarques} placeholder="Observations, précisions sur les clés..." onChange={e => setRemarques(e.target.value)} />
                </div>

                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                  <div>
                    <button type="button" className="btn btn-sm btn-outline-secondary me-2" onClick={clearForm} title="Effacer le formulaire"><i className="bi bi-eraser me-1" />Effacer</button>
                  </div>
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>Annuler</button>
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                      {isLoading ? (<><span className="spinner-border spinner-border-sm me-2"></span>Enregistrement...</>) : (<>Enregistrer</>)}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
  </div>
  )}

  {can(PERMS.remises_cles.view) && (
    <div className="col-lg-5">
      <div className="card border-0 shadow-lg rounded-4 h-100 position-relative" style={{background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(6px)'}}>
        <div className="card-header bg-transparent border-0 pb-0 pt-3 pe-3">
          <h6 className="mb-0 fw-semibold d-flex align-items-center gap-2">
            <i className="bi bi-clock-history text-primary"></i>
            Historique
            <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle ms-1">{remises.length}</span>
          </h6>
        </div>
        <div className="card-body pt-3">
          {remises.length === 0 ? (
            <div className="text-center text-muted py-5">
              <div className="mb-3 p-4 rounded-circle bg-light d-inline-flex">
                <i className="bi bi-inbox display-4 text-muted"></i>
              </div>
              <div className="fw-semibold fs-6 mb-1">Aucune remise enregistrée</div>
              <p className="small text-muted mb-0">Les remises apparaîtront ici dès qu'elles seront ajoutées.</p>
            </div>
          ) : (
            <div className="timeline vstack gap-3" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
              {remises.map((r, index) => (
                <div 
                  key={r.id} 
                  className="position-relative rounded-4 overflow-hidden shadow-sm hover-lift transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.95) 100%)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                >
                  {/* Barre latérale colorée */}
                  <div 
                    className="position-absolute top-0 start-0 h-100" 
                    style={{
                      width: '4px',
                      background: `linear-gradient(180deg, ${index % 3 === 0 ? '#0d6efd' : index % 3 === 1 ? '#6610f2' : '#0dcaf0'}, ${index % 3 === 0 ? '#0a58ca' : index % 3 === 1 ? '#520dc2' : '#0aa2c0'})`
                    }}
                  />
                  
                  <div className="p-3 ps-4">
                    {/* En-tête avec date et statut */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className="p-2 rounded-3 d-inline-flex" style={{background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)'}}>
                          <i className="bi bi-calendar-event text-primary"></i>
                        </div>
                        <div>
                          <div className="small text-muted mb-0" style={{fontSize: '0.7rem', letterSpacing: '0.5px', textTransform: 'uppercase'}}>Date de remise</div>
                          <div className="fw-semibold text-dark">{new Date(r.date_remise).toLocaleString('fr-FR', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}</div>
                        </div>
                      </div>
                      <span 
                        className="badge d-flex align-items-center gap-1 px-3 py-2" 
                        style={{
                          background: 'linear-gradient(135deg, #d1e7dd, #a3cfbb)',
                          color: '#0f5132',
                          border: '1px solid rgba(15,81,50,0.15)',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}
                      >
                        <i className="bi bi-check-circle-fill"></i>
                        Enregistrée
                      </span>
                    </div>

                    {/* Section clés */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="p-1 rounded-2 d-inline-flex" style={{background: 'rgba(102,16,242,0.1)'}}>
                          <i className="bi bi-key-fill text-primary" style={{fontSize: '0.9rem'}}></i>
                        </div>
                        <span className="small fw-semibold text-muted" style={{fontSize: '0.75rem', letterSpacing: '0.3px', textTransform: 'uppercase'}}>Clés remises</span>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {normalizeCles(r.cles).map((c, idx) => (
                          <span 
                            key={idx} 
                            className="badge d-inline-flex align-items-center gap-2 px-3 py-2"
                            style={{
                              background: 'linear-gradient(135deg, rgba(13,110,253,0.1), rgba(13,110,253,0.15))',
                              color: '#0a58ca',
                              border: '1px solid rgba(13,110,253,0.2)',
                              fontSize: '0.8rem',
                              fontWeight: '500',
                              borderRadius: '8px'
                            }}
                          >
                            <span>{c.label || c.type}</span>
                            <span 
                              className="badge rounded-circle d-inline-flex align-items-center justify-content-center"
                              style={{
                                background: '#0d6efd',
                                color: 'white',
                                width: '22px',
                                height: '22px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}
                            >
                              {c.nombre}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Remarques si présentes */}
                    {r.remarques && (
                      <div 
                        className="mt-3 p-3 rounded-3 position-relative"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,243,205,0.4), rgba(255,236,179,0.4))',
                          border: '1px solid rgba(255,193,7,0.2)'
                        }}
                      >
                        <div className="d-flex align-items-start gap-2">
                          <i className="bi bi-chat-left-quote text-warning mt-1" style={{fontSize: '0.9rem'}}></i>
                          <div>
                            <div className="small fw-semibold text-dark mb-1">Remarques</div>
                            <div className="small text-dark" style={{lineHeight: '1.5'}}>{r.remarques}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer avec métadonnées */}
                    {r.user && (
                      <div className="mt-3 pt-2 border-top d-flex align-items-center gap-2" style={{borderColor: 'rgba(0,0,0,0.06)'}}>
                        <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style={{width: '24px', height: '24px'}}>
                          <i className="bi bi-person-fill text-primary" style={{fontSize: '0.75rem'}}></i>
                        </div>
                        <span className="small text-muted">Ajouté par <span className="fw-medium text-dark">{r.user.name || 'Utilisateur'}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )}
      </div>
    </div>
  );
}
