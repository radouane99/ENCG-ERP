"""Exercise real staging authentication with synthetic accounts; never print credentials."""
from http.cookiejar import CookieJar
import argparse
import json
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import HTTPCookieProcessor, Request, build_opener

BASE = 'http://127.0.0.1:8088'


def check(student_id=None):
    environment = dict(line.split('=', 1) for line in (Path(__file__).resolve().parents[1] / '.env.staging').read_text(encoding='utf-8').splitlines() if '=' in line and not line.startswith('#'))
    password = environment['STAGING_SMOKE_PASSWORD']
    results = {}
    for role in ['student', 'professor', 'institution-admin']:
        cookies = CookieJar()
        client = build_opener(HTTPCookieProcessor(cookies))

        def call(path, data=None, binary=False):
            request = Request(BASE + '/api' + path, data=json.dumps(data).encode() if data is not None else None,
                              headers={'Accept': 'application/json', 'Content-Type': 'application/json', 'Origin': BASE})
            try:
                with client.open(request, timeout=30) as response:
                    return response.status, response.read() if binary else json.load(response)
            except HTTPError as error:
                try:
                    return error.code, json.load(error)
                except ValueError:
                    return error.code, {}

        assert call('/v1/auth/me')[0] == 401, 'Unauthenticated staging access was not rejected'
        status, _ = call('/v1/auth/login', {'email': role + '@staging.example.test', 'password': password})
        assert status == 200, f'{role}: staging login failed (HTTP {status})'
        assert any(cookie.name == 'encg_staging_auth_token' and any(key.lower() == 'httponly' for key in cookie._rest) for cookie in cookies), 'Isolated HttpOnly cookie missing: ' + str([(cookie.name, list(cookie._rest)) for cookie in cookies])
        assert call('/v1/auth/me')[0] == 200, f'{role}: staging session unavailable'
        if role != 'institution-admin':
            assert call('/admin/institution-settings')[0] == 403, f'{role}: administration boundary failed'
            if student_id is not None:
                assert call('/documents/generate', {'student_id': student_id, 'document_type_id': 1})[0] == 403, f'{role}: PDF issuance should be forbidden'
        else:
            status, body = call('/admin/institution-settings')
            assert status == 200, f'Administration access unavailable: HTTP {status}, password_change={bool(body.get("must_change_password"))}, two_factor={bool(body.get("requires_2fa_setup"))}'
            if student_id is not None:
                status, body = call('/dashboard/document-types')
                assert status == 200, 'Cannot load document types'
                document_type = next(item for item in body['data'] if item['code'] == 'ATT_SCOL' and item['is_active'])
                status, body = call('/documents/generate', {'student_id': student_id, 'document_type_id': document_type['id']})
                assert status == 201 and body['data']['verification_token'], f'PDF issuance failed (HTTP {status})'
                request_id = body['data']['request_id']
                status, pdf = call(f'/admin/document-requests/{request_id}/download', binary=True)
                assert status == 200 and pdf.startswith(b'%PDF-'), f'PDF download failed (HTTP {status})'
                results['document_request_id'] = request_id
        assert call('/v1/auth/logout', {})[0] == 200, 'Staging logout failed'
        assert call('/v1/auth/me')[0] == 401, 'Staging logout did not revoke access'
        results[role] = 'login / isolated cookie / access / logout verified'
    print(json.dumps(results))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--student-id', type=int, help='Enable PDF tests for this synthetic staging student.')
    check(parser.parse_args().student_id)
