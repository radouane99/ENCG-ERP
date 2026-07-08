import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Briefcase, FileText, Send, Calendar, Building2 } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { storeInternshipSchema, type StoreInternshipInput } from '@/schemas/internship.schema';
import { InternshipService } from '@/services/internship.service';
import { extractValidationErrors } from '@/api/axios';

export function InternshipApplyForm() {
  const { t } = useTranslation('internship');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<StoreInternshipInput>({
    resolver: zodResolver(storeInternshipSchema),
    defaultValues: {
      title: '',
      company_name: '',
      company_address: '',
      type: 'initiation',
      start_date: '',
      end_date: '',
    },
  });

  const onSubmit = async (data: StoreInternshipInput) => {
    try {
      setLoading(true);
      await InternshipService.createInternship(data);
      toast.success(t('apply.success'));
      navigate('/students/internships');
    } catch (err: any) {
      if (err.response?.status === 422) {
        const validationErrors = extractValidationErrors(err);
        Object.entries(validationErrors).forEach(([field, message]) => {
          setError(field as keyof StoreInternshipInput, { message });
        });
        toast.error(t('apply.error_validation'));
      } else {
        toast.error(err?.response?.data?.message || t('apply.error_general'));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm";
  const inputErrorCls = "border-red-500 focus:ring-red-500/20";
  const labelCls = "block text-xs font-bold text-muted-foreground uppercase mb-1.5";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-card border rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2 border-b pb-4 mb-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">{t('apply.form_title')}</h2>
        </div>
        
        {/* Title */}
        <div>
          <label className={labelCls}>{t('apply.subject')} *</label>
          <input 
            {...register('title')} 
            className={cn(inputCls, errors.title && inputErrorCls)} 
            placeholder={t('apply.subject_placeholder')} 
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
        </div>

        {/* Company Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t('apply.company')} *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                {...register('company_name')} 
                className={cn(inputCls, "pl-10", errors.company_name && inputErrorCls)} 
                placeholder={t('apply.company_placeholder')} 
              />
            </div>
            {errors.company_name && <p className="text-xs text-red-500 mt-1">{errors.company_name.message}</p>}
          </div>
          <div>
            <label className={labelCls}>{t('apply.company_address')}</label>
            <input 
              {...register('company_address')} 
              className={cn(inputCls, errors.company_address && inputErrorCls)} 
              placeholder={t('apply.company_address_placeholder')} 
            />
            {errors.company_address && <p className="text-xs text-red-500 mt-1">{errors.company_address.message}</p>}
          </div>
        </div>

        {/* Type & Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>{t('apply.type')} *</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select {...register('type')} className={cn(inputCls, "pl-10 appearance-none", errors.type && inputErrorCls)}>
                <option value="initiation">{t('apply.type_initiation')}</option>
                <option value="application">{t('apply.type_application')}</option>
                <option value="fin_etudes">{t('apply.type_fin_etudes')}</option>
              </select>
            </div>
            {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type.message}</p>}
          </div>
          <div>
            <label className={labelCls}>{t('apply.start_date')} *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="date" 
                {...register('start_date')} 
                className={cn(inputCls, "pl-10", errors.start_date && inputErrorCls)} 
              />
            </div>
            {errors.start_date && <p className="text-xs text-red-500 mt-1">{errors.start_date.message}</p>}
          </div>
          <div>
            <label className={labelCls}>{t('apply.end_date')} *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="date" 
                {...register('end_date')} 
                className={cn(inputCls, "pl-10", errors.end_date && inputErrorCls)} 
              />
            </div>
            {errors.end_date && <p className="text-xs text-red-500 mt-1">{errors.end_date.message}</p>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-2">
        <button 
          type="button" 
          onClick={() => navigate('/students/internships')} 
          className="px-6 py-2.5 font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
        >
          {t('apply.cancel')}
        </button>
        <button 
          type="submit" 
          disabled={loading} 
          className="px-6 py-2.5 font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm flex items-center gap-2 transition-all"
        >
          <Send className="w-4 h-4" /> 
          {loading ? t('apply.submitting') : t('apply.submit')}
        </button>
      </div>
    </form>
  );
}
