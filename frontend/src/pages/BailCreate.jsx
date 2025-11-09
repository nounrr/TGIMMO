import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useCreateBailMutation } from '../api/baseApi';
import BailForm from './BailForm';

export default function BailCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [createBail, { isLoading }] = useCreateBailMutation();
  const [prefilledData, setPrefilledData] = useState(null);

  // Check URL params for pre-selection
  useEffect(() => {
    const locataireId = searchParams.get('locataire_id');
    const uniteId = searchParams.get('unite_id');
    
    if (locataireId || uniteId) {
      setPrefilledData({
        locataire_id: locataireId ? Number(locataireId) : '',
        unite_id: uniteId ? Number(uniteId) : '',
      });
    }
  }, [searchParams]);

  const onSubmit = async (payload) => {
    try {
      const res = await createBail(payload).unwrap();
      navigate(`/baux/${res?.data?.id ?? res?.id ?? ''}`);
    } catch (e) {
      alert('Erreur lors de la création du bail');
      console.error(e);
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/baux" className="text-decoration-none">Baux</Link></li>
          <li className="breadcrumb-item active" aria-current="page">Nouveau bail</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <div className="bg-success bg-opacity-10 p-2 rounded">
              <i className="bi bi-file-plus text-success fs-5"></i>
            </div>
            Créer un nouveau bail
          </h4>
          <p className="text-muted mb-0 small">Remplissez les informations du contrat de location</p>
        </div>
      </div>

      {/* Form */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
          <h5 className="mb-0">
            <i className="bi bi-clipboard-check me-2"></i>Formulaire de création
          </h5>
        </div>
        <div className="card-body p-4">
          {prefilledData && (
            <div className="alert alert-info d-flex align-items-center mb-4">
              <i className="bi bi-info-circle fs-4 me-3"></i>
              <div>
                <strong>Pré-sélection automatique</strong>
                <div className="small">
                  {prefilledData.locataire_id && 'Le locataire a été pré-sélectionné. '}
                  {prefilledData.unite_id && 'L\'unité a été pré-sélectionnée.'}
                </div>
              </div>
            </div>
          )}
          <BailForm initialValue={prefilledData} onSubmit={onSubmit} saving={isLoading} />
        </div>
      </div>
    </div>
  );
}
