import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@shared/components/ui/Card'
import { Badge } from '@shared/components/ui/Badge'
import api from '@shared/lib/api'

type TranscriptStatus = 'V' | 'VC' | 'RAT' | 'NV' | 'FRAUDE' | 'DISCIPLINE'

type ModuleResult = {
  average: number
  rattrapage_average?: number
  status: TranscriptStatus
  missing_grades: boolean
}

type TranscriptRow = {
  module_id: number
  module_name: string
  coefficient: number
  result: ModuleResult
}

type NormalizedTranscript = {
  rows: TranscriptRow[]
  subtitle?: string
}

const normalizeStatus = (value: unknown): TranscriptStatus => {
  const status = String(value || 'NV').toUpperCase()

  if (status === 'V' || status === 'VC' || status === 'RAT' || status === 'NV' || status === 'FRAUDE' || status === 'DISCIPLINE') {
    return status
  }

  if (status === 'VAR') return 'VC'
  if (status === 'R') return 'RAT'

  return 'NV'
}

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const average = (values: number[]) => {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const normalizeTranscriptRows = (rawRows: any[]): TranscriptRow[] => {
  return rawRows
    .map((row, index) => {
      const result = row?.result ?? row
      const moduleId = toNumber(row?.module_id ?? row?.id ?? index + 1)
      const moduleName = row?.module_name ?? row?.module?.name ?? `Module ${moduleId}`
      const coefficient = toNumber(row?.coefficient ?? row?.module?.coefficient ?? 1) || 1
      const rattrapageAverage = result?.rattrapage_average ?? result?.resit_average ?? row?.rattrapage_average

      return {
        module_id: moduleId,
        module_name: moduleName,
        coefficient,
        result: {
          average: toNumber(result?.average ?? row?.average ?? row?.moyenne_normale ?? row?.moyenne_finale),
          rattrapage_average: rattrapageAverage == null ? undefined : toNumber(rattrapageAverage),
          status: normalizeStatus(result?.status ?? row?.status ?? row?.decision_finale ?? row?.decision_normale),
          missing_grades: Boolean(result?.missing_grades ?? row?.missing_grades),
        },
      }
    })
    .filter((row) => row.module_name)
}

const extractTranscriptPayload = (payload: any): NormalizedTranscript => {
  const root = payload?.data ?? payload

  if (Array.isArray(root)) {
    return { rows: normalizeTranscriptRows(root) }
  }

  if (Array.isArray(root?.rows)) {
    return {
      rows: normalizeTranscriptRows(root.rows),
      subtitle: root?.subtitle,
    }
  }

  const moduleResults = root?.module_results
  const modules = Array.isArray(root?.modules) ? root.modules : []

  if (moduleResults && typeof moduleResults === 'object') {
    const rows = Object.entries(moduleResults).map(([moduleKey, moduleResult]: [string, any]) => {
      const moduleMeta = modules.find((module: any) => String(module?.id) === String(moduleKey))
      const moduleId = toNumber(moduleMeta?.id ?? moduleKey)

      return {
        module_id: moduleId,
        module_name: moduleMeta?.name ?? moduleResult?.module_name ?? `Module ${moduleId}`,
        coefficient: toNumber(moduleMeta?.coefficient ?? moduleResult?.coefficient ?? 1) || 1,
        result: {
          average: toNumber(moduleResult?.average),
          rattrapage_average: moduleResult?.rattrapage_average == null ? undefined : toNumber(moduleResult?.rattrapage_average),
          status: normalizeStatus(moduleResult?.status),
          missing_grades: Boolean(moduleResult?.missing_grades),
        },
      }
    })

    const subtitleParts = [root?.academic_year, root?.semester].filter(Boolean)

    return {
      rows,
      subtitle: subtitleParts.length > 0 ? subtitleParts.join(' • ') : undefined,
    }
  }

  return { rows: [] }
}

const extractGradesPayload = (payload: any): NormalizedTranscript => {
  const root = payload?.data ?? payload
  const grades = Array.isArray(root?.data) ? root.data : Array.isArray(root) ? root : []

  const modules = new Map<number, {
    module_id: number
    module_name: string
    coefficient: number
    normalScores: number[]
    normalWeightedSum: number
    normalWeightSum: number
    resitScores: number[]
    resitWeightedSum: number
    resitWeightSum: number
    decisions: string[]
  }>()

  grades.forEach((grade: any, index: number) => {
    const module = grade?.module ?? grade?.gradeComponent?.module ?? grade?.assessment?.module
    const moduleId = toNumber(module?.id ?? grade?.module_id ?? grade?.gradeComponent?.module_id ?? grade?.assessment?.module_id ?? index + 1)
    const moduleName = module?.name ?? grade?.module_name ?? `Module ${moduleId}`
    const coefficient = toNumber(module?.coefficient ?? grade?.coefficient ?? 1) || 1
    const sessionType = String(grade?.examSession?.type ?? grade?.session_type ?? '').toLowerCase()
    const decision = String(grade?.decision_finale ?? grade?.decision_normale ?? '').toUpperCase()
    const weight = toNumber(grade?.assessment?.weight ?? grade?.gradeComponent?.weight)
    const value = grade?.absent ? 0 : toNumber(grade?.value ?? grade?.score)

    if (!modules.has(moduleId)) {
      modules.set(moduleId, {
        module_id: moduleId,
        module_name: moduleName,
        coefficient,
        normalScores: [],
        normalWeightedSum: 0,
        normalWeightSum: 0,
        resitScores: [],
        resitWeightedSum: 0,
        resitWeightSum: 0,
        decisions: [],
      })
    }

    const currentModule = modules.get(moduleId)!
    currentModule.decisions.push(decision)

    const isResit = sessionType.includes('rat') || decision === 'RAT'

    if (isResit) {
      currentModule.resitScores.push(value)
      currentModule.resitWeightedSum += value * weight
      currentModule.resitWeightSum += weight
      return
    }

    currentModule.normalScores.push(value)
    currentModule.normalWeightedSum += value * weight
    currentModule.normalWeightSum += weight
  })

  const rows = Array.from(modules.values()).map((module) => {
    const normalAverage = module.normalWeightSum > 0
      ? module.normalWeightedSum / module.normalWeightSum
      : average(module.normalScores)

    const resitAverage = module.resitScores.length > 0
      ? (module.resitWeightSum > 0
        ? module.resitWeightedSum / module.resitWeightSum
        : average(module.resitScores))
      : undefined

    const explicitStatus = module.decisions.find(Boolean)
    let status = normalizeStatus(explicitStatus)

    if (!explicitStatus) {
      if (resitAverage != null) {
        status = resitAverage >= 10 ? 'V' : 'NV'
      } else if (normalAverage >= 10) {
        status = 'V'
      } else {
        status = 'RAT'
      }
    }

    return {
      module_id: module.module_id,
      module_name: module.module_name,
      coefficient: module.coefficient,
      result: {
        average: Number(normalAverage.toFixed(2)),
        rattrapage_average: resitAverage == null ? undefined : Number(resitAverage.toFixed(2)),
        status,
        missing_grades: false,
      },
    }
  })

  return {
    rows,
    subtitle: 'Notes publiées par module',
  }
}

export default function TranscriptView() {
  const [transcript, setTranscript] = useState<TranscriptRow[]>([])
  const [subtitle, setSubtitle] = useState('Résultats publiés par le backend')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadTranscript = async () => {
      setLoading(true)
      setError(null)

      try {
        const transcriptResponse = await api.get('/v1/student-portal/transcript')
        const normalizedTranscript = extractTranscriptPayload(transcriptResponse.data)

        if (active && normalizedTranscript.rows.length > 0) {
          setTranscript(normalizedTranscript.rows)
          setSubtitle(normalizedTranscript.subtitle || 'Résultats délibérés publiés')
          setLoading(false)
          return
        }
      } catch {
        // Fallback below to the published grades endpoint.
      }

      try {
        const gradesResponse = await api.get('/v1/student-portal/grades')
        const normalizedGrades = extractGradesPayload(gradesResponse.data)

        if (!active) return

        setTranscript(normalizedGrades.rows)
        setSubtitle(normalizedGrades.subtitle || 'Notes publiées par module')
      } catch (err: any) {
        if (!active) return

        setError(err?.response?.data?.message || 'Impossible de charger le relevé de notes.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadTranscript()

    return () => {
      active = false
    }
  }, [])

  const getStatusBadge = (status: TranscriptStatus) => {
    switch (status) {
      case 'V':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Validé</Badge>
      case 'VC':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Compensation</Badge>
      case 'RAT':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Rattrapage</Badge>
      case 'FRAUDE':
      case 'DISCIPLINE':
        return <Badge className="bg-slate-700 hover:bg-slate-800">Discipline</Badge>
      case 'NV':
      default:
        return <Badge className="bg-red-500 hover:bg-red-600">Non Validé</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relevé de Notes</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Résultats par Module</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-muted-foreground border-b">
                <div className="col-span-5">Module</div>
                <div className="col-span-1 text-center">Coef</div>
                <div className="col-span-2 text-center">N. Normale</div>
                <div className="col-span-2 text-center">N. Rattrapage</div>
                <div className="col-span-2 text-right">Statut Final</div>
              </div>

              <div className="divide-y">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center">
                      <div className="col-span-6"><div className="h-4 w-[250px] animate-pulse bg-muted rounded" /></div>
                      <div className="col-span-2 flex justify-center"><div className="h-4 w-8 animate-pulse bg-muted rounded" /></div>
                      <div className="col-span-2 flex justify-center"><div className="h-4 w-12 animate-pulse bg-muted rounded" /></div>
                      <div className="col-span-2 flex justify-end"><div className="h-6 w-20 animate-pulse bg-muted rounded" /></div>
                    </div>
                  ))
                ) : transcript.length > 0 ? (
                  transcript.map((row: TranscriptRow) => (
                    <div key={row.module_id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50 transition-colors">
                      <div className="col-span-5 font-medium">
                        <div>{row.module_name}</div>
                        {row.result.missing_grades && (
                          <div className="text-xs text-amber-600 mt-1">Notes incomplètes</div>
                        )}
                      </div>
                      <div className="col-span-1 text-center text-muted-foreground">{row.coefficient}</div>
                      <div className="col-span-2 text-center">
                        <span className={row.result.rattrapage_average != null ? 'text-muted-foreground line-through' : 'font-bold'}>
                          {row.result.average.toFixed(2)}
                        </span>
                      </div>
                      <div className="col-span-2 text-center font-bold text-amber-600">
                        {row.result.rattrapage_average != null ? row.result.rattrapage_average.toFixed(2) : '-'}
                      </div>
                      <div className="col-span-2 text-right flex justify-end items-center gap-2 flex-wrap">
                        {row.result.status === 'VC' && (
                          <Badge variant="outline" className="text-[10px]">Validé par compensation</Badge>
                        )}
                        {row.result.rattrapage_average != null && row.result.status === 'V' && (
                          <Badge variant="outline" className="text-[10px]">Validé après rattrapage</Badge>
                        )}
                        {getStatusBadge(row.result.status)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-sm text-muted-foreground text-center">
                    Aucun résultat publié n&apos;est disponible pour le moment.
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
