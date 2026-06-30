export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="w-12 h-12 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-primary animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">ENCG ERP</p>
          <p className="text-xs text-muted-foreground mt-0.5">Chargement en cours...</p>
        </div>
      </div>
    </div>
  )
}
