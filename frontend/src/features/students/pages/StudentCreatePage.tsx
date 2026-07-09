import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, User, FileText, Activity } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { StudentsService } from '@/services/students.service'
import { storeStudentSchema, type StoreStudentInput } from '@/schemas/student.schema'
import { cn } from '@shared/lib/utils'
import { useTranslation } from 'react-i18next'

export default function StudentCreatePage() {
  const { t } = useTranslation('students')
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StoreStudentInput>({
    resolver: zodResolver(storeStudentSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      cin: '',
      cne: '',
      massar_code: '',
      birth_date: '',
      gender: 'male',
      status: 'active',
      scholarship_type: '',
    },
  })

  const onSubmit = async (data: StoreStudentInput) => {
    try {
      setLoading(true)
      await StudentsService.createStudent(data)
      toast.success(t('create.success'))
      navigate('/students')
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } } };
      if (e.response?.status === 422) {
        toast.error(t('create.error_validation'))
      } else {
        toast.error(e?.response?.data?.message || t('create.error_general'))
      }
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-4 py-2.5 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
  const inputErrorCls = "border-red-500 focus:ring-red-500/20"
  const labelCls = "block text-xs font-bold text-muted-foreground uppercase mb-1.5"

  return (
    <div className="space-y-6 animate-in p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-card border rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('create.title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('create.subtitle')}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informations Personnelles */}
          <div className="bg-card border rounded-2xl shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 border-b pb-3 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-lg">{t('create.personal_info')}</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('create.first_name')} *</label>
                <input {...register('first_name')} className={cn(inputCls, errors.first_name && inputErrorCls)} placeholder={t('create.first_name_placeholder')} />
                {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className={labelCls}>{t('create.last_name')} *</label>
                <input {...register('last_name')} className={cn(inputCls, errors.last_name && inputErrorCls)} placeholder={t('create.last_name_placeholder')} />
                {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
              </div>
            </div>

            <div>
              <label className={labelCls}>{t('create.email')} *</label>
              <input type="email" {...register('email')} className={cn(inputCls, errors.email && inputErrorCls)} placeholder={t('create.email_placeholder')} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            
            <div>
              <label className={labelCls}>{t('create.phone')}</label>
              <input {...register('phone')} className={cn(inputCls, errors.phone && inputErrorCls)} placeholder={t('create.phone_placeholder')} />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('create.birth_date')}</label>
                <input type="date" {...register('birth_date')} className={cn(inputCls, errors.birth_date && inputErrorCls)} />
                {errors.birth_date && <p className="text-xs text-red-500 mt-1">{errors.birth_date.message}</p>}
              </div>
              <div>
                <label className={labelCls}>{t('create.gender')} *</label>
                <select {...register('gender')} className={cn(inputCls, errors.gender && inputErrorCls)}>
                  <option value="male">{t('create.male')}</option>
                  <option value="female">{t('create.female')}</option>
                </select>
                {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender.message}</p>}
              </div>
            </div>
          </div>

          {/* Informations Académiques & Identifiants */}
          <div className="space-y-6">
            <div className="bg-card border rounded-2xl shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 border-b pb-3 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">{t('create.official_ids')}</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{t('create.cin')}</label>
                  <input {...register('cin')} className={cn(inputCls, errors.cin && inputErrorCls)} placeholder={t('create.cin_placeholder')} />
                  {errors.cin && <p className="text-xs text-red-500 mt-1">{errors.cin.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>{t('create.cne')} *</label>
                  <input {...register('cne')} className={cn(inputCls, errors.cne && inputErrorCls)} placeholder={t('create.cne_placeholder')} />
                  {errors.cne && <p className="text-xs text-red-500 mt-1">{errors.cne.message}</p>}
                </div>
              </div>
              <div>
                <label className={labelCls}>{t('create.massar_code')}</label>
                <input {...register('massar_code')} className={cn(inputCls, errors.massar_code && inputErrorCls)} placeholder={t('create.massar_placeholder')} />
                {errors.massar_code && <p className="text-xs text-red-500 mt-1">{errors.massar_code.message}</p>}
              </div>
            </div>

            <div className="bg-card border rounded-2xl shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 border-b pb-3 mb-4">
                <Activity className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">{t('create.status_section')}</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{t('create.current_status')} *</label>
                  <select {...register('status')} className={cn(inputCls, errors.status && inputErrorCls)}>
                    <option value="active">{t('create.active')}</option>
                    <option value="suspended">{t('create.suspended')}</option>
                    <option value="graduated">{t('create.graduated')}</option>
                    <option value="withdrawn">{t('create.withdrawn')}</option>
                  </select>
                  {errors.status && <p className="text-xs text-red-500 mt-1">{errors.status.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>{t('create.scholarship_type')}</label>
                  <select {...register('scholarship_type')} className={cn(inputCls, errors.scholarship_type && inputErrorCls)}>
                    <option value="">{t('create.none')}</option>
                    <option value="minhaty">{t('create.minhaty')}</option>
                    <option value="excellence">{t('create.excellence')}</option>
                    <option value="social">{t('create.social')}</option>
                  </select>
                  {errors.scholarship_type && <p className="text-xs text-red-500 mt-1">{errors.scholarship_type.message}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 font-medium text-muted-foreground hover:bg-muted rounded-lg">{t('create.cancel')}</button>
          <button type="submit" disabled={loading} className="px-6 py-2.5 font-medium bg-primary text-white hover:bg-primary/90 rounded-lg shadow-sm flex items-center gap-2">
            <Save className="w-4 h-4" /> {loading ? t('create.saving') : t('create.save')}
          </button>
        </div>
      </form>
    </div>
  )
}
