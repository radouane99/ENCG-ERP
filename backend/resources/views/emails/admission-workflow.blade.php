<!doctype html><html lang="fr"><body style="font-family:Arial,sans-serif;background:#f1f5f9;color:#172554;padding:24px">
<div style="max-width:560px;margin:auto;background:white;padding:28px;border-radius:12px">
<h1 style="font-size:22px">Votre dossier ENCG</h1><p>Référence : <strong>{{ $reference }}</strong></p>
@if($eventType === 'activation')
<p>Un accès à votre dossier a été préparé. Le lien d’activation est personnel, valable 30 minutes et utilisable une seule fois. Si vous n’avez pas demandé cet accès, contactez le service des admissions.</p>
@else
<p>Une mise à jour de votre dossier est disponible dans votre espace personnel. Consultez les étapes restantes et les éventuelles demandes de correction.</p>
@endif
<p><a href="{{ $link }}" style="display:inline-block;background:#17356b;color:white;padding:12px 18px;text-decoration:none;border-radius:6px">Ouvrir mon espace</a></p>
<p style="font-size:12px;color:#64748b">Le statut affiché dans votre espace fait foi. Ce message n’attribue pas de numéro officiel et ne vaut pas admission définitive.</p>
</div></body></html>
