import React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useGetBailQuery, useUpdateBailMutation } from '../api/baseApi';
import BailForm from './BailForm';
import BailStatusBadge from '../components/BailStatusBadge';

export default function BailEdit() {
  const { id } = useParams();
  const location = useLocation();
  const bailState = location.state?.bail;
  const skipFetch = !!bailState; // if we have state, skip network fetch
  const { data, isLoading } = useGetBailQuery(id, { skip: skipFetch });
  const [updateBail, { isLoading: saving }] = useUpdateBailMutation();

  const bail = bailState || data?.data || data;

  const onSubmit = async (payload) => {
    try {
      await updateBail({ id, payload }).unwrap();
      alert('Bail mis à jour avec succès !');
    } catch (e) {
      alert('Erreur lors de la mise à jour du bail');
      console.error(e);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      const token = localStorage.getItem('token');
      const res = await fetch(`${base}/baux/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Echec du téléchargement');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `bail_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error(e);
      alert("Impossible de télécharger le PDF du bail.");
    }
  };

  if (!bail && isLoading) {
    return (
      <div className="container-fluid py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="text-muted mt-3">Chargement du bail...</p>
      </div>
    );
  }

  if (!bail) {
    return (
      <div className="container-fluid py-5 text-center">
        <div className="alert alert-danger d-inline-block">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Bail introuvable
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/baux" className="text-decoration-none">Baux</Link></li>
          <li className="breadcrumb-item active" aria-current="page">Bail #{bail.id}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <div className="bg-primary bg-opacity-10 p-2 rounded">
              <i className="bi bi-file-text text-primary fs-5"></i>
            </div>
            Modifier le bail #{bail.id}
          </h4>
          <p className="text-muted mb-0 small">
            <i className="bi bi-hash me-1"></i>{bail.numero_bail}
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <Link className="btn btn-outline-primary d-flex align-items-center gap-2" to={`/baux/${id}/remise-cles`}>
            <i className="bi bi-key"></i>
            Remise de clés
          </Link>
          <button 
            className="btn btn-success shadow-sm d-flex align-items-center gap-2"
            onClick={handleDownloadPdf}
          >
            <i className="bi bi-file-earmark-pdf"></i>
            Télécharger PDF
          </button>
          <BailStatusBadge statut={bail.statut} />
        </div>
      </div>

      {/* Summary card */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-header bg-light border-0">
          <h6 className="mb-0 fw-semibold">
            <i className="bi bi-info-circle me-2"></i>Informations rapides
          </h6>
        </div>
        <div className="card-body">
          <div className="row g-4">
            <div className="col-md-3">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-primary bg-opacity-10 rounded p-3">
                  <i className="bi bi-hash text-primary fs-4"></i>
                </div>
                <div>
                  <div className="small text-muted mb-1">Numéro de bail</div>
                  <div className="fw-semibold">{bail.numero_bail}</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-info bg-opacity-10 rounded p-3">
                  <i className="bi bi-person text-info fs-4"></i>
                </div>
                <div>
                  <div className="small text-muted mb-1">Locataire</div>
                  <div className="fw-semibold">
                    {bail.locataire?.prenom} {bail.locataire?.nom}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-success bg-opacity-10 rounded p-3">
                  <i className="bi bi-building text-success fs-4"></i>
                </div>
                <div>
                  <div className="small text-muted mb-1">Unité</div>
                  <div className="fw-semibold">
                    {bail.unite?.numero_unite || bail.unite?.reference || `#${bail.unite_id}`}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-warning bg-opacity-10 rounded p-3">
                  <i className="bi bi-cash-stack text-warning fs-4"></i>
                </div>
                <div>
                  <div className="small text-muted mb-1">Loyer total</div>
                  <div className="fw-semibold text-success">{bail.loyer_total} MAD</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <h5 className="mb-0">
            <i className="bi bi-pencil-square me-2"></i>Formulaire de modification
          </h5>
        </div>
        <div className="card-body p-4">
          <BailForm initialValue={bail} onSubmit={onSubmit} saving={saving} />
        </div>
      </div>
    </div>
  );
}
