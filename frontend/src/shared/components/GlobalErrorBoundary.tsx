import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from './ui/Button';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 max-w-lg w-full text-center space-y-6">
            <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={40} />
            </div>
            
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Oops! Une erreur s'est produite.
            </h1>
            
            <p className="text-slate-500 font-medium">
              L'application a rencontré un problème inattendu. Nos équipes ont été notifiées.
            </p>
            
            {this.state.error && (
              <div className="bg-slate-100 rounded-xl p-4 text-left overflow-x-auto">
                <code className="text-xs text-slate-600 whitespace-pre-wrap font-mono">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                icon={<RefreshCcw size={16} />}
              >
                Recharger la page
              </Button>
              <Link to="/">
                <Button 
                  variant="primary"
                  className="w-full bg-[#0f2863] hover:bg-[#1a387e]"
                  icon={<Home size={16} />}
                >
                  Retour à l'accueil
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
