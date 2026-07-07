import { useTranslation } from 'react-i18next'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { BookOpen, Calendar, Clock, Trophy, FileText, Download, CheckCircle2, XCircle } from 'lucide-react'

const performanceData = [
  { subject: 'Math', A: 14, fullMark: 20 },
  { subject: 'Accounting', A: 16, fullMark: 20 },
  { subject: 'Marketing', A: 13, fullMark: 20 },
  { subject: 'Law', A: 15, fullMark: 20 },
  { subject: 'Economics', A: 12, fullMark: 20 },
];

const attendanceData = [
  { name: 'Week 1', hours: 24 },
  { name: 'Week 2', hours: 22 },
  { name: 'Week 3', hours: 24 },
  { name: 'Week 4', hours: 20 },
];

export default function StudentDashboard() {
  const { t } = useTranslation('common')

  const schedule = [
    { time: '08:30 - 10:15', course: 'Financial Accounting II', room: 'Amphi 1', prof: 'Dr. Bennani' },
    { time: '10:30 - 12:15', course: 'Corporate Finance', room: 'Room 204', prof: 'Dr. Alaoui' },
    { time: '14:00 - 15:45', course: 'Business English', room: 'Lab 3', prof: 'Ms. Smith' },
  ]

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, Youssef! ðŸ‘‹</h1>
          <p className="text-muted-foreground mt-1">Semester 3 â€¢ Financial Commerce</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg font-medium shadow-sm hover:bg-muted/80 transition-colors">
            <Download className="w-4 h-4" />
            Certificat de Scolarité
          </button>
        </div>
      </div>

      {/* Quick Actions / Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-sm font-medium opacity-80">Current Average</p>
            <h3 className="text-3xl font-bold mt-1">14.2<span className="text-xl font-normal opacity-80">/20</span></h3>
            <p className="text-xs mt-2 opacity-80 flex items-center gap-1"><Trophy className="w-3 h-3" /> Ranked 12th in class</p>
          </div>
          <Trophy className="absolute right-[-10px] bottom-[-10px] w-32 h-32 opacity-10" />
        </div>

        <div className="p-6 rounded-xl bg-card border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary/10 text-secondary rounded-lg"><Clock className="w-4 h-4" /></div>
            <h3 className="font-semibold text-foreground">Absences</h3>
          </div>
          <p className="text-2xl font-bold text-foreground">2 <span className="text-sm font-normal text-muted-foreground">sessions</span></p>
          <div className="w-full bg-muted rounded-full h-1.5 mt-3">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '10%' }}></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Well below the 3-absence limit</p>
        </div>

        <div className="p-6 rounded-xl bg-card border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/10 text-accent-foreground rounded-lg"><FileText className="w-4 h-4" /></div>
            <h3 className="font-semibold text-foreground">Pending Exams</h3>
          </div>
          <p className="text-2xl font-bold text-foreground">1 <span className="text-sm font-normal text-muted-foreground">midterm</span></p>
          <p className="text-sm text-accent-foreground mt-2 font-medium">Corporate Finance (Tomorrow)</p>
        </div>

        <div className="p-6 rounded-xl bg-card border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-muted rounded-lg text-foreground"><BookOpen className="w-4 h-4" /></div>
            <h3 className="font-semibold text-foreground">Library Loans</h3>
          </div>
          <p className="text-2xl font-bold text-foreground">3 <span className="text-sm font-normal text-muted-foreground">books</span></p>
          <p className="text-sm text-destructive mt-2 font-medium">1 book overdue</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="p-6 rounded-xl bg-card border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Today's Schedule</h3>
            <button className="text-sm text-primary hover:underline font-medium">View Full</button>
          </div>
          <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {schedule.map((item, i) => (
              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Timeline dot */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-background bg-muted text-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <Calendar className="w-4 h-4" />
                </div>
                {/* Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg bg-card border shadow-sm my-2 ml-4 md:ml-0 hover:border-primary/50 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-primary font-bold text-sm">{item.time}</span>
                    <span className="font-semibold text-foreground mt-1">{item.course}</span>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground font-medium">
                      <span className="bg-muted px-2 py-1 rounded-md">{item.room}</span>
                      <span>{item.prof}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Academic Radar */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-card border shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Skills Breakdown (Spider Web)</h3>
            <p className="text-sm text-muted-foreground">Your performance relative to the maximum score (20)</p>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 20]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Radar name="Score" dataKey="A" stroke="hsl(var(--color-primary))" fill="hsl(var(--color-primary))" fillOpacity={0.5} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Grades Table */}
      <div className="p-6 rounded-xl bg-card border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Semester 3 Grades</h3>
            <p className="text-sm text-muted-foreground">Official deliberation results</p>
          </div>
          <button className="text-sm text-primary hover:underline font-medium">Download Transcript</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th scope="col" className="px-6 py-3 font-semibold">Module</th>
                <th scope="col" className="px-6 py-3 font-semibold">Professor</th>
                <th scope="col" className="px-6 py-3 font-semibold text-center">Score / 20</th>
                <th scope="col" className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.map((grade, index) => (
                <tr key={index} className="bg-card border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">
                    {grade.subject}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    Staff
                  </td>
                  <td className="px-6 py-4 text-center font-bold">
                    <span className={grade.A >= 12 ? 'text-green-600 dark:text-green-500' : 'text-orange-500 dark:text-orange-400'}>
                      {grade.A.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {grade.A >= 12 ? (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-500 text-xs font-medium bg-green-500/10 px-2 py-1 rounded-full w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Validé
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-orange-600 dark:text-orange-500 text-xs font-medium bg-orange-500/10 px-2 py-1 rounded-full w-fit">
                        <XCircle className="w-3.5 h-3.5" /> Rattrapage
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
