@extends('pdf.layouts.pdf_master')

@section('title', 'Convention de Stage')

@section('meta_info', 'N° : ' . date('Y') . '/CONV/' . str_pad($student->id ?? '0001', 4, '0', STR_PAD_LEFT) . ' &nbsp;&nbsp;&nbsp; Date : ' . date('d/m/Y'))

@section('document_title', 'CONVENTION DE STAGE')
@section('title_color', 'blue')

@section('styles')
<style>
    .document-title { color: #0f2863 !important; }
    .document-subtitle { display: none; }
    .document-title-container { background: none; border: 1px solid #0f2863; border-radius: 5px; padding: 10px; margin-bottom: 20px;}
    .parties { margin-bottom: 20px; font-size: 11px;}
    .parties ol { padding-left: 20px; margin-top: 5px; line-height: 1.8;}
    .parties li span.red { color: #c01844; font-weight: bold; }
    .article-title { color: #0f2863; font-weight: bold; font-size: 11px; margin-top: 15px; margin-bottom: 5px; }
    .article-text { font-size: 10px; color: #4a5568; line-height: 1.5; text-align: justify; }
</style>
@endsection

@section('content')
<div style="text-align: center; font-size: 22px; font-weight: bold; color: #002e5b; letter-spacing: 2px; margin: 20px 0 30px 0; text-transform: uppercase; border-bottom: 2px solid #002e5b; padding-bottom: 12px;">
    CONVENTION DE STAGE
</div>

<div class="parties">
    <strong>Entre les soussignés :</strong>
    <ol>
        <li><span class="red">1.</span> <strong>L'École Nationale de Commerce et de Gestion de Fès (ENCG)</strong>, représentée par son Directeur.</li>
        <li><span class="red">2.</span> <strong>L'Entreprise d'Accueil :</strong> {{ $company ?? 'Entreprise Partenaire ENCG' }} (à compléter par l'organisme d'accueil).</li>
        <li><span class="red">3.</span> <strong>L'Étudiant(e) :</strong> Nom et Prénom : <strong>{{ strtoupper($student->last_name ?? '') }} {{ ucfirst($student->first_name ?? '') }}</strong><br>
            N° d'immatriculation : <strong>{{ $student->student_number ?? 'N/A' }}</strong> | CNE/Massar : <strong>{{ $student->cne ?? 'N/A' }}</strong> | Inscrit(e) au titre de l'année universitaire <strong>{{ $year }}</strong>.
        </li>
    </ol>
</div>

@if($student->latestPathway ?? null)
<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 15px; margin-bottom: 15px; font-size: 10px;">
    <strong style="color: #002e5b;">Filière :</strong> {{ $student->latestPathway->filiere->name ?? 'N/A' }}
</div>
@endif

<div style="border-top: 1px dashed #cbd5e1; margin: 15px 0;"></div>

<div class="article-title">Article 1 : Objet de la convention</div>
<div class="article-text">
    La présente convention a pour objet de définir les conditions dans lesquelles l'étudiant(e) effectuera son stage au sein de l'entreprise d'accueil dans le cadre de son cursus académique à l'ENCG.
</div>

<div class="article-title">Article 2 : Durée et déroulement</div>
<div class="article-text">
    Le stage a pour finalité l'application pratique des connaissances théoriques acquises à l'université. Les dates exactes ainsi que le sujet d'étude de stage seront définis d'un commun accord avec l'entreprise d'accueil.
</div>

<div class="article-title">Article 3 : Encadrement et Suivi</div>
<div class="article-text">
    L'étudiant(e) sera soumis(e) au règlement intérieur de l'entreprise d'accueil. Il/Elle rédigera un rapport de stage qui fera l'objet d'une évaluation par l'établissement.
</div>

@endsection

@section('signature_left')
    POUR L'ENCG
    <div class="stamp" style="margin-top: 20px;">
        ★ ENCG FÈS ★<br>
        ADMINISTRATION
    </div>
@endsection

@section('signature_right')
    <div style="width: 100%;">
        <div style="float:left; width: 45%; text-align:center;">
            POUR L'ENTREPRISE
            <div style="font-size: 8px; font-weight: normal; margin-top: 40px; color:#cbd5e1;">Sceau &amp; Signature<br>(à compléter)</div>
        </div>
        <div style="float:right; width: 45%; text-align:center;">
            L'ÉTUDIANT(E)
            <div style="font-size: 9px; margin-top: 5px; color: #002e5b; font-weight: bold;">{{ strtoupper($student->last_name ?? '') }} {{ ucfirst($student->first_name ?? '') }}</div>
            <div style="font-size: 8px; font-weight: normal; margin-top: 30px; color:#cbd5e1;">Signature précédée de la mention<br>"Lu et approuvé"</div>
        </div>
        <div style="clear:both;"></div>
    </div>
@endsection
