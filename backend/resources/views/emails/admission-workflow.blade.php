<!doctype html><html lang="{{ app()->getLocale() }}" dir="{{ app()->isLocale('ar') ? 'rtl' : 'ltr' }}"><body style="font-family:Arial,sans-serif;background:#f1f5f9;color:#172554;padding:24px">
<div style="max-width:560px;margin:auto;background:white;padding:28px;border-radius:12px">
<h1 style="font-size:22px">{{ __('admission_mail.title') }}</h1><p>{{ __('admission_mail.reference') }} <strong dir="ltr">{{ $reference }}</strong></p>
@if($eventType === 'activation')
<p>{{ __('admission_mail.activation') }}</p>
@else
<p>{{ __('admission_mail.update') }}</p>
@endif
<p><a href="{{ $link }}" style="display:inline-block;background:#17356b;color:white;padding:12px 18px;text-decoration:none;border-radius:6px">{{ __('admission_mail.open') }}</a></p>
<p style="font-size:12px;color:#64748b">{{ __('admission_mail.notice') }}</p>
</div></body></html>
