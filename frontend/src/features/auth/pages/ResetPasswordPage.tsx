import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import api from '@shared/lib/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !email) {
      setError("Lien de réinitialisation invalide ou expiré.");
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      await api.post('/v1/auth/reset-password', {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#02060D] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#0f172a] p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-slate-200 dark:border-white/10">
          <div className="text-red-500 mb-4 text-5xl">⚠️</div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Lien invalide</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Le lien de réinitialisation est incomplet ou expiré.</p>
          <Link to="/forgot-password" className="text-[#A80A0B] hover:underline font-medium">Demander un nouveau lien</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#02060D] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#E60028]/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#1F3A5F]/20 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm mb-6">
            <ShieldCheck className="w-8 h-8 text-[#A80A0B]" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Nouveau Mot de passe</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Définissez un nouveau mot de passe pour {email}</p>
        </div>

        <div className="bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl p-8">
          {success ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Réinitialisation réussie !</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8">Votre mot de passe a été mis à jour avec succès.</p>
              <Link to="/login" className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-gradient-to-r from-[#1F3A5F] to-[#0f172a] text-white font-medium hover:shadow-lg transition-all">
                Se connecter maintenant
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nouveau mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#02060D] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#A80A0B] focus:border-transparent transition-all text-slate-900 dark:text-white"
                      placeholder="8 caractères minimum"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirmer le mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#02060D] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#A80A0B] focus:border-transparent transition-all text-slate-900 dark:text-white"
                      placeholder="Confirmez le mot de passe"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative flex items-center justify-center py-3 px-4 bg-gradient-to-r from-[#1F3A5F] to-[#0f172a] hover:from-[#2a4d7d] hover:to-[#1e293b] text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Mettre à jour le mot de passe'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
