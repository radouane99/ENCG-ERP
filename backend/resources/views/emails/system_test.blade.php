<!doctype html>
<html lang="{{ app()->getLocale() }}" dir="{{ app()->isLocale('ar') ? 'rtl' : 'ltr' }}">
<body>
    <p>{{ __('Bonjour :name,', ['name' => $recipientName]) }}</p>
    <p>{{ __('Ce message confirme la réception du test de messagerie demandé depuis les paramètres du portail ENCG.') }}</p>
    <p>ENCG Fès</p>
</body>
</html>
