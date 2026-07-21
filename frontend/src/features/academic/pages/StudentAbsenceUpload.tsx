import { useState, type ChangeEvent } from 'react'
import { AlertTriangle, UploadCloud, CheckCircle2, FileText, AlertCircle } from 'lucide-react'
import api from '@/shared/lib/api'
import { toast } from 'sonner'

type SubmissionState = {
  attendanceId: number
  status: string
  message: string
}

export default function StudentAbsenceUpload() {

  const [file, setFile] = useState<File | null>(null)
  const [attendanceId, setAttendanceId] = useState(() => new URLSearchParams(window.location.search).get('attendanceId') || '')
  const [reason, setReason] = useState('medical')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submission, setSubmission] = useState<SubmissionState | null>(null)



  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file || !attendanceId) return

    const formData = new FormData()
    formData.append('attendance_id', attendanceId)
    formData.append('reason', reason)
    formData.append('description', description)
    formData.append('document', file)

    setUploading(true)

    try {
      const response = await api.post('/v1/student-portal/absences', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const payload = response.data?.data ?? response.data
      const message = response.data?.message || 'Certificat médical envoyé avec succès. En attente de validation.'

      setSubmission({
        attendanceId: Number(payload?.attendance_id ?? attendanceId),
        status: String(payload?.status ?? 'pending'),
        message,
      })

      toast.success(message)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Échec de l'envoi du justificatif.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white/90">Régularisation d&apos;Absence</h1>
            <p className="text-sm text-white/50">Portail Étudiant — dépôt API d&apos;un justificatif d&apos;absence</p>
          </div>
        </div>
      </div>

      {!submission ? (
        <>
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <h3 className="text-red-800 font-bold text-lg mb-1">Dépôt d&apos;un justificatif réel via API</h3>
                <p className="text-red-700 text-sm mb-2">
                  Cette page ne repose plus sur des données fictives. Elle envoie maintenant le justificatif au backend via
                  <strong className="text-red-900"> `POST /api/v1/student-portal/absences`</strong>.
                </p>
                <p className="text-red-700 text-sm">
                  Renseignez la référence d&apos;absence (`attendance_id`) transmise par le portail ou la page d&apos;absences,
                  puis joignez votre document justificatif.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-white/10 p-8 rounded-2xl shadow-sm space-y-6">
            <div>
              <h2 className="font-bold text-lg mb-2">Soumettre un certificat médical</h2>
              <p className="text-sm text-slate-500">
                Le justificatif sera enregistré avec le statut <strong>pending</strong> côté backend, en attente de validation.
              </p>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Référence d&apos;absence (`attendance_id`)</label>
                <input
                  type="number"
                  min="1"
                  value={attendanceId}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setAttendanceId(e.target.value)}
                  placeholder="Ex. 42"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Motif</label>
                <select
                  value={reason}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setReason(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm text-slate-800"
                >
                  <option value="medical">Médical</option>
                  <option value="family">Familial</option>
                  <option value="sports">Sportif</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Description complémentaire</label>
              <textarea
                value={description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                rows={4}
                placeholder="Précisez, si nécessaire, le contexte de l&apos;absence."
                className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm resize-none text-slate-800"
              />
            </div>

            <div className="max-w-md">
              <label
                htmlFor="file-upload"
                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white hover:bg-slate-50 hover:border-gray-400'}`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {file ? (
                    <>
                      <FileText className="w-12 h-12 text-blue-500 mb-3" />
                      <p className="text-sm font-bold text-blue-700">{file.name}</p>
                      <p className="text-xs text-blue-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez</p>
                      <p className="text-xs text-slate-500">PDF, JPG ou PNG (Max 5MB)</p>
                    </>
                  )}
                </div>
                <input id="file-upload" type="file" className="hidden" accept=".pdf,image/png,image/jpeg" onChange={handleFileChange} />
              </label>
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || !attendanceId || uploading}
              className={`w-full py-3 rounded-xl font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${
                !file || !attendanceId || uploading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
              }`}
            >
              {uploading ? 'Envoi en cours...' : 'Soumettre le justificatif'}
            </button>
          </div>
        </>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-emerald-800 mb-2">Justificatif reçu</h2>
          <p className="text-emerald-700 max-w-md mx-auto mb-6">{submission.message}</p>
          <div className="bg-white p-4 rounded-xl inline-block text-sm border border-emerald-100 text-left">
            <div><span className="text-slate-500">Absence liée :</span> <span className="font-bold ml-2">#{submission.attendanceId}</span></div>
            <div className="mt-1"><span className="text-slate-500">Statut backend :</span> <span className="font-bold text-orange-500 ml-2">{submission.status}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}
