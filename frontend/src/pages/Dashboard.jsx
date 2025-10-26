import { useLogoutMutation } from '../features/auth/authApi';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [logout, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {}
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-700">TGI</h1>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-sm text-gray-500">Tableau de bord</div>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
              title="Se déconnecter"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
                </svg>
              )}
              <span>{isLoading ? 'Déconnexion...' : 'Déconnexion'}</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Bienvenue</h2>
          <p className="text-gray-600">Vous êtes connecté. Naviguez via le menu pour gérer les ressources.</p>
        </div>
      </main>
    </div>
  );
}
