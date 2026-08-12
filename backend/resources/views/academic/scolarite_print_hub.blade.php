<!DOCTYPE html>
<html lang="fr" class="h-full bg-slate-900">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🖨️ HUB D'IMPRESSION GUICHET — {{ strtoupper($studentName) }} (ENCG FÈS)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="h-full flex flex-col overflow-hidden text-slate-100 bg-slate-950">

    <!-- ── TOP ROYAL NAVY HEADER BAR ── -->
    <header class="bg-[#0f2863] border-b border-blue-900/60 px-4 py-3 shrink-0 flex items-center justify-between shadow-xl">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center font-black text-amber-400 text-lg shadow-inner">
                🎓
            </div>
            <div>
                <div class="flex items-center gap-2">
                    <h1 class="text-sm font-black uppercase tracking-wide text-white">{{ $studentName }}</h1>
                    <span class="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold uppercase">
                        ✓ Inscription Validée
                    </span>
                </div>
                <p class="text-xs text-blue-200/80 font-medium">
                    CNE: <code class="font-mono text-amber-300 font-bold">{{ $cne }}</code> &nbsp;•&nbsp; CNIE: <span class="font-mono font-bold">{{ $cin }}</span> &nbsp;•&nbsp; {{ $filiere }}
                </p>
            </div>
        </div>

        <!-- Primary Action Buttons -->
        <div class="flex items-center gap-2">
            <button
                onclick="printAllDocumentsComplet()"
                class="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center gap-2 border border-emerald-400/40"
            >
                <svg class="w-4 h-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17H17.01M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z" /></svg>
                <span>⚡ TOUT IMPRIMER (DOSSIER 3 PAGES)</span>
            </button>
            <button
                onclick="printCurrentTab()"
                class="px-3 py-2 bg-blue-900/60 hover:bg-blue-800/80 text-blue-200 border border-blue-700/60 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
            >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17H17.01M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z" /></svg>
                Imprimer Document Actuel
            </button>
            <button
                onclick="window.close()"
                class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer"
            >
                Fermer ✕
            </button>
        </div>
    </header>

    <!-- ── NAVIGATION TABS BAR & INDIVIDUAL PRINT BUTTONS ── -->
    <div class="bg-slate-900 border-b border-slate-800 px-4 py-2 shrink-0 flex items-center justify-between">
        <div class="flex items-center gap-2">
            <button
                id="tab-complet"
                onclick="switchTab('complet')"
                class="tab-btn active px-3.5 py-1.5 rounded-lg font-extrabold text-xs transition-all flex items-center gap-2 bg-emerald-600 text-white shadow-md cursor-pointer"
            >
                <span>⚡ Dossier Complet (3 Pages)</span>
            </button>
            <button
                id="tab-attestation"
                onclick="switchTab('attestation')"
                class="tab-btn px-3.5 py-1.5 rounded-lg font-extrabold text-xs transition-all flex items-center gap-2 bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
            >
                <span>📜 Attestation d'Inscription</span>
            </button>
            <button
                id="tab-engagement"
                onclick="switchTab('engagement')"
                class="tab-btn px-3.5 py-1.5 rounded-lg font-extrabold text-xs transition-all flex items-center gap-2 bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
            >
                <span>📝 Fiche d'Engagement (تعهد)</span>
            </button>
            <button
                id="tab-medical"
                onclick="switchTab('medical')"
                class="tab-btn px-3.5 py-1.5 rounded-lg font-extrabold text-xs transition-all flex items-center gap-2 bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
            >
                <span>🩺 Fiche Médicale (الملف الطبي)</span>
            </button>
        </div>

        <div class="flex items-center gap-1.5">
            <button onclick="openPdf('complet')" class="px-2.5 py-1 bg-gradient-to-r from-emerald-700 to-teal-700 text-white rounded-md text-[11px] font-black hover:opacity-90">
                🖨️ Dossier Complet (3-in-1)
            </button>
            <button onclick="openPdf('attestation')" class="px-2.5 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 rounded-md text-[11px] font-bold hover:bg-emerald-900">
                🖨️ Attestation
            </button>
            <button onclick="openPdf('engagement')" class="px-2.5 py-1 bg-amber-950/80 text-amber-300 border border-amber-800/80 rounded-md text-[11px] font-bold hover:bg-amber-900">
                🖨️ Engagement
            </button>
            <button onclick="openPdf('medical')" class="px-2.5 py-1 bg-teal-950/80 text-teal-300 border border-teal-800/80 rounded-md text-[11px] font-bold hover:bg-teal-900">
                🖨️ Fiche Médicale
            </button>
        </div>
    </div>

    <!-- ── MAIN PDF VIEWPORT CONTAINER ── -->
    <main class="flex-1 bg-slate-950 p-2 relative overflow-hidden">
        @php
            $dossierCompletUrl = '/api/v1/enrollments/dossier-complet-pdf?cne=' . urlencode($cne) . '&student_id=' . ($student?->id ?? 1);
        @endphp
        <iframe
            id="pdf-frame"
            src="{{ $dossierCompletUrl }}"
            class="w-full h-full rounded-2xl border border-slate-800 shadow-2xl bg-white"
        ></iframe>
    </main>

    <script>
        const urls = {
            complet: @json($dossierCompletUrl),
            attestation: @json($attestationUrl),
            engagement: @json($engagementUrl),
            medical: @json($ficheMedicaleUrl)
        };

        let currentTabKey = 'complet';

        function switchTab(tabKey) {
            currentTabKey = tabKey;
            const frame = document.getElementById('pdf-frame');
            frame.src = urls[tabKey];

            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.className = 'tab-btn px-3.5 py-1.5 rounded-lg font-extrabold text-xs transition-all flex items-center gap-2 bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer';
            });

            const activeBtn = document.getElementById(`tab-${tabKey}`);
            if (activeBtn) {
                activeBtn.className = 'tab-btn active px-3.5 py-1.5 rounded-lg font-extrabold text-xs transition-all flex items-center gap-2 bg-emerald-600 text-white shadow-md cursor-pointer';
            }
        }

        function openPdf(tabKey) {
            window.open(urls[tabKey], '_blank');
        }

        function printCurrentTab() {
            openPdf(currentTabKey);
        }

        function printAllDocumentsComplet() {
            openPdf('complet');
        }
    </script>
</body>
</html>
