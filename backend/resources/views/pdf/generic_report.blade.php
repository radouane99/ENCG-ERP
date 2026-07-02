@extends('pdf.layout')

@section('title', $title ?? 'Rapport Administratif')

@section('document_title', strtoupper($title ?? 'RAPPORT ADMINISTRATIF'))
@section('title_color', 'blue')

@section('meta_info', 'Généré le : ' . date('d/m/Y H:i'))

@section('content')
<div style="text-align: center; margin-bottom: 30px;">
    <p>Ce document a été généré automatiquement par le système central de l'ENCG ERP.</p>
</div>

<div style="border: 1px dashed #cbd5e1; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
    @if(isset($content))
        {!! $content !!}
    @else
        <p style="text-align: center; color: #64748b;">(Contenu du rapport vide ou en cours de génération...)</p>
    @endif
</div>
@endsection

@section('signature_right')
    <div style="margin-top: 30px;">
        DIRECTION ACADÉMIQUE
    </div>
@endsection
