import React from 'react';
import { createPortal } from 'react-dom';

// Reusable modal rendered via portal on document.body
export default function GenerationResultModal({ open, items = [], onClose, onGotoMandats, onGotoAvenants }) {
  if (!open) return null;

  const mandats = items.filter((i) => i.type === 'mandat');
  const avenants = items.filter((i) => i.type === 'avenant');

  const modal = (
    <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.45)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4 shadow">
          <div className="modal-header">
            <h5 className="modal-title">Documents générés</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {items.length === 0 ? (
              <div className="text-center py-3">
                <div className="mb-3">
                  <svg width="48" height="48" fill="currentColor" viewBox="0 0 16 16" className="text-warning">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                  </svg>
                </div>
                <p className="mb-2 fw-semibold">Aucun document généré</p>
                <p className="mb-0 text-muted small">La répartition a été enregistrée, mais aucun mandat ou avenant n'a été créé. Vérifiez que l'option "Générer automatiquement" était cochée.</p>
              </div>
            ) : (
              <>
                <div className="alert alert-success d-flex align-items-center gap-2 mb-3">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                  </svg>
                  <span className="fw-semibold">Documents générés avec succès!</span>
                </div>
                {mandats.length > 0 && (
                  <div className="mb-3">
                    <h6 className="fw-semibold">Mandats créés</h6>
                    <ul className="mb-0">
                      {mandats.map((m, idx) => (
                        <li key={`m-${idx}`}>Mandat #{m.id} — Propriétaire #{m.proprietaire_id}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {avenants.length > 0 && (
                  <div className="mb-2">
                    <h6 className="fw-semibold">Avenants créés</h6>
                    <ul className="mb-0">
                      {avenants.map((a, idx) => (
                        <li key={`a-${idx}`}>Avenant #{a.id} — Propriétaire #{a.proprietaire_id}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="modal-footer d-flex justify-content-between">
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-outline-primary" onClick={onGotoMandats} disabled={mandats.length === 0}>Voir mandats</button>
              <button type="button" className="btn btn-outline-secondary" onClick={onGotoAvenants} disabled={avenants.length === 0}>Voir avenants</button>
            </div>
            <button type="button" className="btn btn-primary" onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
