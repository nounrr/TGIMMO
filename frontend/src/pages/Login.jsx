import { useState } from 'react';
import { useLoginMutation } from '../features/auth/authApi';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login(form).unwrap();
      if (res?.access_token) {
        navigate('/dashboard');
      }
    } catch (e) {
      setError(e?.data?.message || 'Échec de connexion');
    }
  };

  return (
    <div className="vh-100 vw-100 d-flex overflow-hidden" style={{margin: 0, padding: 0}}>
      {/* Left Side - Branding */}
      <div className="d-none d-lg-flex flex-column justify-content-between p-5 position-relative overflow-hidden" 
           style={{
             width: '50%',
             height: '100%',
             background: 'linear-gradient(135deg, #1e40af 0%, #4f46e5 50%, #7c3aed 100%)'
           }}>
        {/* Animated background */}
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{zIndex: 0}}>
          <div className="position-absolute rounded-circle" 
               style={{
                 top: '5rem',
                 left: '5rem',
                 width: '18rem',
                 height: '18rem',
                 background: 'rgba(96, 165, 250, 0.2)',
                 filter: 'blur(80px)',
                 animation: 'pulse 3s ease-in-out infinite'
               }}></div>
          <div className="position-absolute rounded-circle" 
               style={{
                 bottom: '5rem',
                 right: '5rem',
                 width: '24rem',
                 height: '24rem',
                 background: 'rgba(167, 139, 250, 0.2)',
                 filter: 'blur(80px)',
                 animation: 'pulse 3s ease-in-out infinite 0.7s'
               }}></div>
        </div>
        
        <div className="position-relative" style={{zIndex: 1}}>
          <div className="d-inline-flex align-items-center gap-3 mb-4 px-4 py-2 rounded-4" 
               style={{
                 background: 'rgba(255, 255, 255, 0.1)',
                 backdropFilter: 'blur(10px)',
                 border: '1px solid rgba(255, 255, 255, 0.2)'
               }}>
            <div className="bg-white rounded-3 shadow-lg d-flex align-items-center justify-content-center" 
                 style={{width: '2.5rem', height: '2.5rem'}}>
              <svg className="text-primary" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-white fs-3 fw-bold mb-0">TGI</h1>
          </div>
          
          <div className="text-white mt-5">
            <div className="mb-3">
              <span className="badge rounded-pill px-3 py-2" 
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(5px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      fontSize: '0.875rem'
                    }}>
                ✨ Solution Premium
              </span>
            </div>
            <h2 className="display-4 fw-bold mb-3" style={{lineHeight: '1.2'}}>
              Gestion Immobilière<br />Nouvelle Génération
            </h2>
            <p className="fs-5 mb-4" style={{color: 'rgba(255, 255, 255, 0.9)', maxWidth: '32rem'}}>
              Automatisez, optimisez et modernisez la gestion complète de votre patrimoine immobilier.
            </p>

            <div className="d-flex flex-wrap gap-3 mb-4">
              {['Interface intuitive', 'Sécurité renforcée', 'Support 24/7'].map((feature, i) => (
                <div key={i} className="d-flex align-items-center gap-2" style={{color: 'rgba(255, 255, 255, 0.95)'}}>
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="small">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="position-relative" style={{zIndex: 1}}>
          <div className="row g-3 text-white">
            {[
              { value: '500+', label: 'Propriétés' },
              { value: '98%', label: 'Satisfaction' },
              { value: '24/7', label: 'Disponible' }
            ].map((stat, i) => (
              <div key={i} className="col-4">
                <div className="p-4 rounded-4 h-100" 
                     style={{
                       background: 'rgba(255, 255, 255, 0.1)',
                       backdropFilter: 'blur(10px)',
                       border: '1px solid rgba(255, 255, 255, 0.2)',
                       transition: 'all 0.3s ease'
                     }}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                       e.currentTarget.style.transform = 'scale(1.05)';
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                       e.currentTarget.style.transform = 'scale(1)';
                     }}>
                  <div className="display-6 fw-bold mb-1">{stat.value}</div>
                  <div className="small fw-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="d-flex align-items-center justify-content-center p-4 p-lg-5 position-relative overflow-auto" 
           style={{
             width: '100%',
             height: '100%',
             background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #ddd6fe 100%)'
           }}>
        {/* Decorative orbs */}
        <div className="position-absolute top-0 end-0 rounded-circle" 
             style={{width: '16rem', height: '16rem', background: 'rgba(147, 197, 253, 0.3)', filter: 'blur(80px)'}}></div>
        <div className="position-absolute bottom-0 start-0 rounded-circle" 
             style={{width: '16rem', height: '16rem', background: 'rgba(196, 181, 253, 0.3)', filter: 'blur(80px)'}}></div>
        
        <div className="w-100 position-relative" style={{maxWidth: '28rem', zIndex: 1}}>
          {/* Mobile Logo */}
          <div className="text-center mb-4 d-lg-none">
            <div className="d-inline-flex align-items-center gap-3 px-4 py-3 rounded-4 shadow-lg" 
                 style={{
                   background: 'rgba(255, 255, 255, 0.8)',
                   backdropFilter: 'blur(10px)',
                   border: '1px solid rgba(229, 231, 235, 1)'
                 }}>
              <div className="rounded-3 shadow d-flex align-items-center justify-content-center" 
                   style={{
                     width: '2.25rem',
                     height: '2.25rem',
                     background: 'linear-gradient(135deg, #2563eb, #4f46e5)'
                   }}>
                <svg className="text-white" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="fs-4 fw-bold mb-0" style={{
                background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>TGI</h1>
            </div>
          </div>

          {/* Login Card */}
          <div className="card border-0 shadow-lg rounded-4" 
               style={{
                 background: 'rgba(255, 255, 255, 0.7)',
                 backdropFilter: 'blur(20px)',
                 border: '1px solid rgba(255, 255, 255, 0.5) !important'
               }}>
            <div className="card-body p-4 p-lg-5">
              <div className="mb-4">
                <h2 className="fw-bold mb-2" style={{fontSize: '1.875rem'}}>Bon retour</h2>
                <p className="text-muted mb-0">Connectez-vous pour accéder à votre tableau de bord</p>
              </div>

              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label fw-semibold small">Email</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 rounded-start-3">
                      <svg width="20" height="20" className="text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      className="form-control border-start-0 rounded-end-3 py-3"
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={onChange}
                      placeholder="vous@example.com"
                      required
                      style={{
                        border: '1px solid #e5e7eb',
                        fontSize: '0.9375rem'
                      }}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label fw-semibold small">Mot de passe</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 rounded-start-3">
                      <svg width="20" height="20" className="text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control border-start-0 border-end-0 rounded-0 py-3"
                      id="password"
                      name="password"
                      value={form.password}
                      onChange={onChange}
                      placeholder="Votre mot de passe"
                      required
                      style={{
                        border: '1px solid #e5e7eb',
                        fontSize: '0.9375rem'
                      }}
                    />
                    <button
                      type="button"
                      className="input-group-text bg-white border-start-0 rounded-end-3"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      style={{ cursor: 'pointer' }}
                    >
                      {showPassword ? (
                        // Eye-slash icon
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a21.77 21.77 0 0 1 5.06-7.19"/>
                          <path d="M1 1l22 22"/>
                          <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88"/>
                          <path d="M14.12 14.12 9.88 9.88"/>
                        </svg>
                      ) : (
                        // Eye icon
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s3-7 11-7 11 7 11 7-3 7-11 7S1 12 1 12z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="alert alert-danger d-flex align-items-start gap-2 rounded-3" role="alert">
                    <svg width="20" height="20" className="flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <small className="fw-medium mb-0">{error}</small>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-lg w-100 text-white fw-semibold rounded-3 shadow d-flex align-items-center justify-content-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                    border: 'none',
                    padding: '0.875rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(37, 99, 235, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(37, 99, 235, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}>
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Connexion en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Se connecter</span>
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 pt-4 border-top">
                <div className="d-flex align-items-center justify-content-center gap-2 text-muted small">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="fw-medium">Connexion sécurisée SSL/TLS</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-muted small mt-4 mb-0">
            © 2025 TGI. Tous droits réservés.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .form-control:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25) !important;
        }
        .input-group-text {
          transition: color 0.2s ease;
        }
        .input-group:focus-within .input-group-text svg {
          color: #2563eb !important;
        }
      `}</style>
    </div>
  );
}
