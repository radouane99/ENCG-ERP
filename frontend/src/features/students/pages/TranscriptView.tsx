import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@shared/components/ui/Card'
import { Badge } from '@shared/components/ui/Badge'

type ModuleResult = {
  average: number
  status: 'V' | 'RAT' | 'NV'
  missing_grades: boolean
}

type TranscriptRow = {
  module_id: number
  module_name: string
  coefficient: number
  result: ModuleResult
}

export default function TranscriptView() {
  const [transcript, setTranscript] = useState<TranscriptRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call for the Apogée Deliberation Engine
    setTimeout(() => {
      setTranscript([
        {
          module_id: 1,
          module_name: 'Comptabilité Générale II',
          coefficient: 3,
          result: { average: 14.5, status: 'V', missing_grades: false },
        },
        {
          module_id: 2,
          module_name: 'Management des Organisations',
          coefficient: 4,
          result: { average: 9.75, status: 'RAT', missing_grades: false },
        },
        {
          module_id: 3,
          module_name: 'Statistiques Appliquées',
          coefficient: 3,
          result: { average: 11.0, status: 'NV', missing_grades: false }, // NV due to exam < 5
        },
      ])
      setLoading(false)
    }, 1500)
  }, [])

  const getStatusBadge = (status: 'V' | 'RAT' | 'NV') => {
    switch (status) {
      case 'V':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Validé</Badge>
      case 'RAT':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Rattrapage</Badge>
      case 'NV':
        return <Badge className="bg-red-500 hover:bg-red-600">Non Validé</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relevé de Notes (Apogée)</h1>
          <p className="text-muted-foreground">Année Universitaire 2026-2027 • Semestre 2</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Résultats par Module</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-muted-foreground border-b">
                <div className="col-span-6">Module</div>
                <div className="col-span-2 text-center">Coef</div>
                <div className="col-span-2 text-center">Moyenne</div>
                <div className="col-span-2 text-right">Statut</div>
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
                ) : (
                  transcript.map((row) => (
                    <div key={row.module_id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50 transition-colors">
                      <div className="col-span-6 font-medium">{row.module_name}</div>
                      <div className="col-span-2 text-center text-muted-foreground">{row.coefficient}</div>
                      <div className="col-span-2 text-center font-bold">
                        {row.result.average.toFixed(2)}
                      </div>
                      <div className="col-span-2 text-right">
                        {getStatusBadge(row.result.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
