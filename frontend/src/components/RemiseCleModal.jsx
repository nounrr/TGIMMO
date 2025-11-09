import React, { useState } from 'react';
import { useCreateRemiseCleMutation } from '../api/baseApi';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';

export default function RemiseCleModal({ bailId, bail, onClose, onCreated }) {
  const { can } = useAuthz();
  const [createRemise, { isLoading }] = useCreateRemiseCleMutation();

  const [dateRemise, setDateRemise] = useState(() => new Date().toISOString().slice(0,16));
  const [portes, setPortes] = useState({ checked: false, nombre: 0 });
  const [boites, setBoites] = useState({ checked: false, nombre: 0 });
  const [portails, setPortails] = useState({ checked: false, nombre: 0 });
  const [autresList, setAutresList] = useState([{ label: '', nombre: 0 }]);
  const [remarques, setRemarques] = useState('');

  const addAutre = () => setAutresList(l => [...l, { label: '', nombre: 0 }]);
  const updateAutre = (idx, key, val) => setAutresList(l => l.map((a,i) => i===idx ? { ...a, [key]: val } : a));
  const removeAutre = (idx) => setAutresList(l => l.filter((_,i) => i!==idx));

  const onSubmit = async (e) => {
    e.preventDefault();
    const items = [];
    if (portes.checked && portes.nombre > 0) items.push({ type: 'porte_principale', label: 'Porte principale', nombre: Number(portes.nombre) });
    if (boites.checked && boites.nombre > 0) items.push({ type: 'boite_lettres', label: 'Boîte aux lettres', nombre: Number(boites.nombre) });
    if (portails.checked && portails.nombre > 0) items.push({ type: 'portail_garage', label: 'Portail / Garage', nombre: Number(portails.nombre) });
    const autres = autresList
      .map(a => ({ ...a, nombre: Number(a.nombre) }))
      .filter(a => a.label && a.nombre > 0)
      .map(a => ({ type: 'autre', label: a.label, nombre: a.nombre }));
    const payload = {
      date_remise: new Date(dateRemise).toISOString(),
      cles: [...items, ...autres],
      remarques: remarques || undefined,
    };
    if (payload.cles.length === 0) {
      alert('Sélectionnez au moins une clé et quantité.');
      return;
    }
    try {
      await createRemise({ bailId, payload }).unwrap();
      if (onCreated) onCreated();
      // Reset simple
      setRemarques('');
      setPortes({ checked: false, nombre: 0 });
      setBoites({ checked: false, nombre: 0 });
      setPortails({ checked: false, nombre: 0 });
      setAutresList([{ label: '', nombre: 0 }]);
      // UX: auto-close after success for faster workflow
      onClose();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'enregistrement");
    }
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100" style={{ backdropFilter: 'blur(8px)', background: 'rgba(15,23,42,0.45)', zIndex: 2000 }}>
      <div className="position-absolute top-50 start-50 translate-middle" style={{ width: 'min(720px, 94vw)' }}>
        <div className="rounded-4 shadow-lg" style={{ background: 'linear-gradient(135deg,#ffffff 0%,#f1f5f9 60%,#e2e8f0 100%)', border: '1px solid #e2e8f0' }}>
          <div className="px-4 py-3 d-flex align-items-center justify-content-between border-bottom" style={{ background: 'linear-gradient(90deg,#f8fafc,#f1f5f9)' }}>
            <div className="d-flex align-items-center gap-2">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width:40,height:40, background:'#eef2ff' }}>
                <i className="bi bi-key-fill text-primary"></i>
              </div>
              <div className="lh-sm">
                <strong className="d-block">Remise de clés</strong>
                <small className="text-muted">Bail #{bailId}</small>
              </div>
            </div>
            <button className="btn btn-sm btn-outline-secondary rounded-circle" onClick={onClose} title="Fermer" style={{ width:34,height:34 }}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="p-4">
            {can(PERMS.remises_cles.create) ? (
              <form className="vstack gap-4" onSubmit={onSubmit}>
                    <div>
                      <label className="form-label fw-semibold small text-uppercase text-secondary">Date et heure</label>
                      <input type="datetime-local" className="form-control form-control-lg" value={dateRemise} onChange={e=>setDateRemise(e.target.value)} required />
                    </div>
                    <div className="vstack gap-3">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className="form-check d-flex align-items-center gap-2 p-3 rounded-3" style={{ background:'#f1f5f9' }}>
                            <input type="checkbox" className="form-check-input" checked={portes.checked} onChange={e=>setPortes(p=>({ ...p, checked: e.target.checked }))} id="modal_porte" />
                            <label htmlFor="modal_porte" className="form-check-label fw-medium me-auto">Porte principale</label>
                            <input type="number" min="0" className="form-control form-control-sm" style={{ width:90 }} placeholder="Qté" value={portes.nombre} onChange={e=>setPortes(p=>({ ...p, nombre: e.target.value }))} />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-check d-flex align-items-center gap-2 p-3 rounded-3" style={{ background:'#f1f5f9' }}>
                            <input type="checkbox" className="form-check-input" checked={boites.checked} onChange={e=>setBoites(p=>({ ...p, checked: e.target.checked }))} id="modal_boite" />
                            <label htmlFor="modal_boite" className="form-check-label fw-medium me-auto">Boîte aux lettres</label>
                            <input type="number" min="0" className="form-control form-control-sm" style={{ width:90 }} placeholder="Qté" value={boites.nombre} onChange={e=>setBoites(p=>({ ...p, nombre: e.target.value }))} />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-check d-flex align-items-center gap-2 p-3 rounded-3" style={{ background:'#f1f5f9' }}>
                            <input type="checkbox" className="form-check-input" checked={portails.checked} onChange={e=>setPortails(p=>({ ...p, checked: e.target.checked }))} id="modal_portail" />
                            <label htmlFor="modal_portail" className="form-check-label fw-medium me-auto">Portail / Garage</label>
                            <input type="number" min="0" className="form-control form-control-sm" style={{ width:90 }} placeholder="Qté" value={portails.nombre} onChange={e=>setPortails(p=>({ ...p, nombre: e.target.value }))} />
                          </div>
                        </div>
                      </div>
                      <div className="border rounded-3 p-3" style={{ background:'#f8fafc' }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="fw-semibold small text-uppercase text-secondary">Autres clés</span>
                          <button type="button" className="btn btn-sm btn-outline-primary" onClick={addAutre}><i className="bi bi-plus-circle me-1"></i>Ajouter</button>
                        </div>
                        <div className="vstack gap-2">
                          {autresList.map((a, idx) => (
                            <div key={idx} className="d-flex align-items-center gap-2">
                              <input type="text" className="form-control" placeholder="Libellé" value={a.label} onChange={e=>updateAutre(idx,'label', e.target.value)} />
                              <input type="number" min="0" className="form-control" style={{ width:90 }} placeholder="Qté" value={a.nombre} onChange={e=>updateAutre(idx,'nombre', e.target.value)} />
                              <button type="button" className="btn btn-outline-danger" onClick={()=>removeAutre(idx)} title="Retirer"><i className="bi bi-x"></i></button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="form-label fw-semibold small text-uppercase text-secondary">Remarques</label>
                        <textarea className="form-control" rows={3} value={remarques} onChange={e=>setRemarques(e.target.value)} placeholder="Notes complémentaires (facultatif)" />
                      </div>
                    </div>
                    <div className="d-flex justify-content-end gap-2 pt-2">
                      <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Annuler</button>
                      <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Enregistrement…' : 'Enregistrer'}</button>
                    </div>
                  </form>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-shield-lock fs-1 text-secondary opacity-50"></i>
                <p className="mt-3 text-muted">Vous n'avez pas l'autorisation de créer une remise de clés.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
