import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Briefcase, FileText, DollarSign, Calculator, Search, Plus
} from 'lucide-react';
import api from '@/shared/lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next'
import { Spinner } from '@shared/components/ui/Spinner';

export default function VacatairesManager() { 
  const { t } = useTranslation('modules');
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'contracts' | 'payments'>('contracts');

  // Fetch real data from the backend
  const { data: vacataires, isLoading } = useQuery({
    queryKey: ['vacataires'],
    queryFn: () => api.get('/admin/hr/vacataires').then(res => res.data.data),
  });

  const generatePaymentMutation = useMutation({
    mutationFn: (contractId: number) => {
      return api.post(`/admin/hr/vacataires/contracts/${contractId}/payments`, {
        hours_declared: 40 // simple test value
      });
    },
    onSuccess: () => {
      toast.success(t('vacataires.messages.success'));
      queryClient.invalidateQueries({ queryKey: ['vacataires'] });
    },
    onError: () => {
      toast.error(t('vacataires.messages.error'));
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" />{t('vacataires.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('vacataires.subtitle')}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="border-b border-border">
          <div className="flex gap-6 px-6">
            <button
              onClick={() => setActiveTab('contracts')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'contracts'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" /> {t('vacataires.tabs.contracts')} </div>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'payments'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> {t('vacataires.tabs.payments')} </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'contracts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t('vacataires.search')}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-input bg-background text-sm"
                  />
                </div>
                <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium">
                  <Plus className="w-4 h-4" /> {t('vacataires.new_btn')}</button>
              </div>

              {isLoading ? (
                <div className="flex justify-center p-12"><Spinner /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vacataires?.map((contract: any) => (
                    <div key={contract.id} className="border border-border/50 bg-muted/20 rounded-xl p-5 hover:border-border transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold text-foreground">{contract.first_name} {contract.last_name}</h4>
                          <p className="text-sm text-muted-foreground">{contract.module || 'Aucun module assigné'}</p>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-600 text-xs px-2 py-1 rounded-full font-medium">
                          {contract.status === 'active' ? t('vacataires.card.active') : contract.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>{t('vacataires.card.hours')}</span>
                          <span className="font-medium text-foreground">{contract.agreed_hours || 0}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('vacataires.card.rate')}</span>
                          <span className="font-medium text-foreground">{contract.hourly_rate || 0} DH/h</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border/50 flex gap-2">
                        <button className="flex-1 bg-background border border-border hover:bg-muted text-foreground py-1.5 rounded-lg text-sm transition-colors">
                          {t('vacataires.card.btn_hours')}
                        </button>
                        <button 
                          onClick={() => generatePaymentMutation.mutate(contract.id)}
                          disabled={generatePaymentMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                          <Calculator className="w-3 h-3" /> {t('vacataires.card.btn_pay')}
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!vacataires || vacataires.length === 0) && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      Aucun vacataire trouvé.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">{t('vacataires.payments_empty.title')}</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-2">{t('vacataires.payments_empty.desc')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
