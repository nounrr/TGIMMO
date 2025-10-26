import { useMemo, useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useMeQuery, useUploadPhotoMutation, useUpdateMeMutation } from '../features/auth/authApi';

export default function Profile() {
  // Redux state
  const authUser = useSelector((state) => state.auth?.user);
  // Always fetch fresh user on page (will be cached by RTK Query)
  const { data: me, isFetching } = useMeQuery();
  const [uploadPhoto, { isLoading: isUploading }] = useUploadPhotoMutation();
  const [updateMe, { isLoading: isSaving }] = useUpdateMeMutation();
  const fileRef = useRef(null);
  const [uploadError, setUploadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Resolve current user early to avoid temporal dead zone
  const user = me || authUser;

  const [form, setForm] = useState({ name: '', telephone_interne: '' });
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        telephone_interne: user.telephone_interne || '',
      });
    }
  }, [user]);

  const fullName = useMemo(() => {
    if (!user) return '';
    return (user.name || '').trim() || user.email || '';
  }, [user]);

  const initials = useMemo(() => {
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0]?.charAt(0) || '';
    const last = parts[1]?.charAt(0) || '';
    return (first + last).toUpperCase() || (user?.email?.slice(0, 2) || 'U').toUpperCase();
  }, [fullName, user]);

  // Backend Laravel returns photo_url with full URL (http://localhost:8000/storage/avatars/...)
  const photoUrl = user?.photo_url || null;

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <div className="p-3 p-lg-4" style={{ width: '100%', boxSizing: 'border-box' }}>
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden" 
                 style={{
                   background: 'rgba(255, 255, 255, 0.9)',
                   backdropFilter: 'blur(20px)'
                 }}>
            <div className="card-body p-1 p-lg-1">
              <div className="d-flex align-items-start gap-4 flex-wrap">
                {/* Avatar */}
                <div className="position-relative">
                  <div className="rounded-circle border border-white shadow-lg" 
                       style={{ 
                         width: 160, 
                         height: 160,
                         padding: '4px',
                         background: 'white'
                       }}>
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={fullName}
                        className="rounded-circle w-100 h-100 object-fit-cover"
                      />
                    ) : (
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                        style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #1e40af, #7c3aed)'
                        }}
                      >
                        <span style={{ fontSize: 36 }}>{initials}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Header info */}
                <div className="flex-grow-1">
                  <div className="d-flex flex-column flex-md-row align-items-md-end gap-2 gap-md-3">
                    <h1 className="h2 fw-bold mb-0" style={{
                      background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>{fullName || 'Utilisateur'}</h1>
                    {user?.statut && (
                      <span className={`badge rounded-pill px-3 py-2 ${user.statut === 'actif' ? 'text-bg-success' : 'text-bg-secondary'}`}
                            style={{ fontSize: '0.875rem' }}>
                        {user.statut}
                      </span>
                    )}
                  </div>
                  {user?.email && (
                    <div className="text-muted mt-2 d-flex align-items-center gap-2">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z"/>
                      </svg>
                      {user.email}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="ms-auto mt-3 mt-md-0">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="d-none"
                    onChange={async (e) => {
                      setUploadError('');
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        await uploadPhoto(file).unwrap();
                      } catch (err) {
                        setUploadError(err?.data?.message || 'Erreur lors du téléversement');
                      } finally {
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2 shadow-sm"
                    style={{
                      borderRadius: '12px',
                      padding: '10px 20px',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => fileRef.current?.click()}
                    disabled={isUploading}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    {isUploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" />
                        <span>Envoi…</span>
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <span>Changer la photo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Details */}
              <div className="row g-3 mt-4">
                {user?.fonction && (
                  <div className="col-12 col-lg-3 col-md-6">
                    <div className="p-4 rounded-4 bg-white d-flex align-items-center gap-3 shadow-sm border-0"
                         style={{
                           transition: 'all 0.3s ease',
                           cursor: 'default'
                         }}
                         onMouseEnter={(e) => {
                           e.currentTarget.style.transform = 'translateY(-4px)';
                           e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.style.transform = 'translateY(0)';
                           e.currentTarget.style.boxShadow = '';
                         }}>
                      <div className="rounded-3 d-flex align-items-center justify-content-center" 
                           style={{
                             width: 48, 
                             height: 48,
                             background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                             color: 'white'
                           }}>
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1h-3zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5z"/>
                        </svg>
                      </div>
                      <div className="flex-grow-1">
                        <div className="text-muted small fw-medium">Fonction</div>
                        <div className="fw-semibold">{user.fonction}</div>
                      </div>
                    </div>
                  </div>
                )}

                {user?.service && (
                  <div className="col-12 col-lg-3 col-md-6">
                    <div className="p-4 rounded-4 bg-white d-flex align-items-center gap-3 shadow-sm border-0"
                         style={{
                           transition: 'all 0.3s ease',
                           cursor: 'default'
                         }}
                         onMouseEnter={(e) => {
                           e.currentTarget.style.transform = 'translateY(-4px)';
                           e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.style.transform = 'translateY(0)';
                           e.currentTarget.style.boxShadow = '';
                         }}>
                      <div className="rounded-3 d-flex align-items-center justify-content-center" 
                           style={{
                             width: 48, 
                             height: 48,
                             background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                             color: 'white'
                           }}>
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M4 2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zM4 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zM7.5 5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zM4.5 8a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1z"/>
                          <path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V1zm11 0H3v14h3v-2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V15h3V1z"/>
                        </svg>
                      </div>
                      <div className="flex-grow-1">
                        <div className="text-muted small fw-medium">Service</div>
                        <div className="fw-semibold">{user.service}</div>
                      </div>
                    </div>
                  </div>
                )}

                {user?.telephone_interne && (
                  <div className="col-12 col-lg-3 col-md-6">
                    <div className="p-4 rounded-4 bg-white d-flex align-items-center gap-3 shadow-sm border-0"
                         style={{
                           transition: 'all 0.3s ease',
                           cursor: 'default'
                         }}
                         onMouseEnter={(e) => {
                           e.currentTarget.style.transform = 'translateY(-4px)';
                           e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.style.transform = 'translateY(0)';
                           e.currentTarget.style.boxShadow = '';
                         }}>
                      <div className="rounded-3 d-flex align-items-center justify-content-center" 
                           style={{
                             width: 48, 
                             height: 48,
                             background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                             color: 'white'
                           }}>
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                          <path fillRule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/>
                        </svg>
                      </div>
                      <div className="flex-grow-1">
                        <div className="text-muted small fw-medium">Téléphone interne</div>
                        <div className="fw-semibold">{user.telephone_interne}</div>
                      </div>
                    </div>
                  </div>
                )}

                {user?.email && (
                  <div className="col-12 col-lg-3 col-md-6">
                    <div className="p-4 rounded-4 bg-white d-flex align-items-center gap-3 shadow-sm border-0"
                         style={{
                           transition: 'all 0.3s ease',
                           cursor: 'default'
                         }}
                         onMouseEnter={(e) => {
                           e.currentTarget.style.transform = 'translateY(-4px)';
                           e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.style.transform = 'translateY(0)';
                           e.currentTarget.style.boxShadow = '';
                         }}>
                      <div className="rounded-3 d-flex align-items-center justify-content-center" 
                           style={{
                             width: 48, 
                             height: 48,
                             background: 'linear-gradient(135deg, #10b981, #059669)',
                             color: 'white'
                           }}>
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z"/>
                        </svg>
                      </div>
                      <div className="flex-grow-1">
                        <div className="text-muted small fw-medium">Email</div>
                        <div className="fw-semibold text-truncate">{user.email}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Edit form */}
              <div className="mt-4 p-4 rounded-4 shadow-sm border-0"
                   style={{
                     background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                     backdropFilter: 'blur(10px)'
                   }}>
                <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
                  <div className="rounded-3 d-flex align-items-center justify-content-center shadow-sm"
                       style={{
                         width: 48,
                         height: 48,
                         background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                         color: 'white'
                       }}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                      <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="h5 fw-bold mb-0">Modifier le profil</h2>
                    <p className="text-muted small mb-0">Mettez à jour vos informations personnelles</p>
                  </div>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSaveError('');
                    setSaveSuccess('');
                    try {
                      const payload = {
                        name: form.name?.trim() || null,
                        telephone_interne: form.telephone_interne || null,
                      };
                      await updateMe(payload).unwrap();
                      setSaveSuccess('Modifications enregistrées');
                    } catch (err) {
                      setSaveError(err?.data?.message || 'Échec de la mise à jour');
                    }
                  }}
                >
                  <div className="row g-4 align-items-end">
                    <div className="col-12 col-lg-4">
                      <label className="form-label fw-semibold text-dark d-flex align-items-center gap-2" htmlFor="name">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                        </svg>
                        Nom complet
                      </label>
                      <input
                        id="name"
                        type="text"
                        className="form-control form-control-lg rounded-3 shadow-sm"
                        style={{ border: '1px solid #e5e7eb' }}
                        placeholder="Votre nom et prénom"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        maxLength={255}
                      />
                    </div>
                    <div className="col-12 col-lg-4">
                      <label className="form-label fw-semibold text-dark d-flex align-items-center gap-2" htmlFor="telephone_interne">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path fillRule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/>
                        </svg>
                        Téléphone interne
                      </label>
                      <input
                        id="telephone_interne"
                        type="text"
                        className="form-control form-control-lg rounded-3 shadow-sm"
                        style={{ border: '1px solid #e5e7eb' }}
                        placeholder="Extension téléphonique"
                        value={form.telephone_interne}
                        onChange={(e) => setForm((f) => ({ ...f, telephone_interne: e.target.value }))}
                        maxLength={50}
                      />
                    </div>
                    <div className="col-12 col-lg-4">
                      <div className="d-flex align-items-center gap-3">
                        <button
                          type="submit"
                          className="btn btn-lg px-5 text-white fw-semibold shadow"
                          style={{
                            background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                            border: 'none',
                            borderRadius: '12px',
                            transition: 'all 0.3s ease'
                          }}
                          disabled={isSaving}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(37, 99, 235, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '';
                          }}
                        >
                          {isSaving ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" />
                              Enregistrement…
                            </>
                          ) : (
                            'Enregistrer'
                          )}
                        </button>
                        {saveSuccess && (
                          <div className="d-flex align-items-center gap-2 text-success small">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                            </svg>
                            <span className="fw-medium">{saveSuccess}</span>
                          </div>
                        )}
                        {saveError && (
                          <div className="d-flex align-items-center gap-2 text-danger small">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
                            </svg>
                            <span className="fw-medium">{saveError}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Loading state */}
              {isFetching && (
                <div className="mt-4 d-flex align-items-center gap-2 text-muted small">
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  <span>Mise à jour des informations…</span>
                </div>
              )}

              {uploadError && (
                <div className="mt-3 alert alert-danger py-2 small mb-0" role="alert">{uploadError}</div>
              )}
            </div>
          </div>
        </div>
    </div>
  );    
}
