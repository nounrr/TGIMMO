import React, { useState } from 'react';
import { 
  useGetApprocheProprietairesQuery,
  useCreateApprocheProprietaireMutation,
  useDeleteApprocheProprietaireMutation,
  useGetApprocheLocatairesQuery,
  useCreateApprocheLocataireMutation,
  useDeleteApprocheLocataireMutation
} from '../../api/baseApi';

// Simple demo component listing and creating approaches
export default function ApprocheExample({ proprietaireId, locataireId }) {
  const [descriptionP, setDescriptionP] = useState('');
  const [descriptionL, setDescriptionL] = useState('');

  const { data: approchesProp } = useGetApprocheProprietairesQuery({ proprietaire_id: proprietaireId, per_page: 10 }, { skip: !proprietaireId });
  const { data: approchesLoc } = useGetApprocheLocatairesQuery({ locataire_id: locataireId, per_page: 10 }, { skip: !locataireId });

  const [createProp, { isLoading: savingP }] = useCreateApprocheProprietaireMutation();
  const [createLoc, { isLoading: savingL }] = useCreateApprocheLocataireMutation();
  const [deleteProp] = useDeleteApprocheProprietaireMutation();
  const [deleteLoc] = useDeleteApprocheLocataireMutation();

  return (
    <div className="row g-4">
      <div className="col-md-6">
        <h5>Approches Propriétaire</h5>
        {proprietaireId ? (
          <>
            <form onSubmit={async e => { e.preventDefault(); if (!descriptionP.trim()) return; await createProp({ proprietaire_id: proprietaireId, description: descriptionP }); setDescriptionP(''); }} className="d-flex gap-2 mb-2">
              <input className="form-control" value={descriptionP} onChange={e => setDescriptionP(e.target.value)} placeholder="Nouvelle prospection..." />
              <button className="btn btn-primary" disabled={savingP}>Ajouter</button>
            </form>
            <ul className="list-group small">
              {approchesProp?.data?.map(a => (
                <li key={a.id} className="list-group-item d-flex justify-content-between align-items-start">
                  <span>{a.description || <em className="text-muted">(vide)</em>}</span>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => deleteProp(a.id)}>&times;</button>
                </li>
              )) || <li className="list-group-item">Aucune</li>}
            </ul>
          </>
        ) : <p className="text-muted">Sélectionnez un propriétaire.</p>}
      </div>
      <div className="col-md-6">
        <h5>Approches Locataire</h5>
        {locataireId ? (
          <>
            <form onSubmit={async e => { e.preventDefault(); if (!descriptionL.trim()) return; await createLoc({ locataire_id: locataireId, description: descriptionL }); setDescriptionL(''); }} className="d-flex gap-2 mb-2">
              <input className="form-control" value={descriptionL} onChange={e => setDescriptionL(e.target.value)} placeholder="Nouvelle prospection..." />
              <button className="btn btn-primary" disabled={savingL}>Ajouter</button>
            </form>
            <ul className="list-group small">
              {approchesLoc?.data?.map(a => (
                <li key={a.id} className="list-group-item d-flex justify-content-between align-items-start">
                  <span>{a.description || <em className="text-muted">(vide)</em>}</span>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => deleteLoc(a.id)}>&times;</button>
                </li>
              )) || <li className="list-group-item">Aucune</li>}
            </ul>
          </>
        ) : <p className="text-muted">Sélectionnez un locataire.</p>}
      </div>
    </div>
  );
}