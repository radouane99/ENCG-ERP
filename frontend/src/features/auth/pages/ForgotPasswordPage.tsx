import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import api from '@shared/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/v1/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#02060D] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#E60028]/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#1F3A5F]/20 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm mb-6">
            <ShieldCheck className="w-8 h-8 text-[#A80A0B]" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Mot de passe oublié
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Entrez votre adresse email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        <div className="bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl p-8">
          {success ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Email envoyé !
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                Si un compte correspond à <strong>{email}</strong>, un email avec les instructions a été envoyé.
              </p>
              <Link 
                to="/login"
                className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Adresse Email Universitaire
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#02060D] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#A80A0B] focus:border-transparent transition-all text-slate-900 dark:text-white"
                    placeholder="prenom.nom@usmba.ac.ma"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative flex items-center justify-center py-3 px-4 bg-gradient-to-r from-[#1F3A5F] to-[#0f172a] hover:from-[#2a4d7d] hover:to-[#1e293b] text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Envoyer le lien'}
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-[#A80A0B] dark:text-slate-400 dark:hover:text-white transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Retour à la connexion
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
