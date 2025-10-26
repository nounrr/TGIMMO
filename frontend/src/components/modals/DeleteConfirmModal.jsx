export default function DeleteConfirmModal({ show, onHide, onConfirm, title, message, isLoading }) {
  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onHide}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
          {/* Header */}
          <div className="modal-header border-0 pb-0">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center"
                   style={{
                     width: 48,
                     height: 48,
                     background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                     color: 'white'
                   }}>
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </svg>
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0">{title || 'Confirmer la suppression'}</h5>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onHide} disabled={isLoading}></button>
          </div>

          {/* Body */}
          <div className="modal-body px-4 pb-4">
            <p className="text-muted mb-0">
              {message || 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.'}
            </p>
          </div>

          {/* Footer */}
          <div className="modal-footer border-0 bg-light">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onHide}
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
