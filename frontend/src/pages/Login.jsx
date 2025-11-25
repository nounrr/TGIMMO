import { useState } from 'react';
import { useLoginMutation } from '../features/auth/authApi';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

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
      // Surface network errors (e.error) or backend message when available
      setError(e?.data?.message || e?.error || 'Échec de connexion');
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex w-1/2 bg-[#0f172a] relative overflow-hidden flex-col justify-between p-12 text-white" style={{ backgroundColor: '#001f3f' }}>
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#001f3f]/95 via-[#003366]/90 to-[#001f3f]/95"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center h-full justify-center">
          <div className="mb-8">
            <img src="/logo.png" alt="TGI Immo" className="h-24 w-auto object-contain" />
          </div>
          
          <div className="space-y-6 max-w-lg">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-sm font-medium backdrop-blur-xl">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
              Solution Premium v2.0
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Gestion Immobilière <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Nouvelle Génération
              </span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Une plateforme unifiée pour automatiser, optimiser et moderniser la gestion complète de votre patrimoine immobilier.
            </p>
          </div>

          <div className="mt-12 space-y-4 w-full">
            <div className="flex items-center justify-center gap-6 text-sm font-medium text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Interface intuitive</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Sécurité renforcée</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Support 24/7</span>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              © 2025 TGI Immo. Tous droits réservés.
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Connexion</h2>
            <p className="mt-2 text-sm text-slate-600">
              Entrez vos identifiants pour accéder à votre espace.
            </p>
          </div>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-900/5">
            <CardContent className="pt-6">
              <form onSubmit={onSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email professionnel</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="nom@entreprise.com"
                      className="pl-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                      value={form.email}
                      onChange={onChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                    <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-500">
                      Mot de passe oublié ?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                      value={form.password}
                      onChange={onChange}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      Se connecter <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="justify-center border-t bg-slate-50/50 py-4">
              <p className="text-xs text-slate-500 text-center">
                En vous connectant, vous acceptez nos <a href="#" className="underline hover:text-slate-900">Conditions d'utilisation</a> et notre <a href="#" className="underline hover:text-slate-900">Politique de confidentialité</a>.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
