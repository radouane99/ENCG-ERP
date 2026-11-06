"""Generate independent staging secrets; never read production environment files."""
import base64
from pathlib import Path
import secrets


def setup(root: Path) -> None:
    destination = root / '.env.staging'
    if destination.exists():
        existing = destination.read_text(encoding='utf-8')
        if not any(line.startswith('STAGING_SMOKE_PASSWORD=') for line in existing.splitlines()):
            with destination.open('a', encoding='utf-8', newline='\n') as output:
                output.write(f'\nSTAGING_SMOKE_PASSWORD={secrets.token_hex(24)}\n')
        print('Existing staging configuration preserved.')
        return
    key = base64.b64encode(secrets.token_bytes(32)).decode()
    with destination.open('x', encoding='utf-8', newline='\n') as output:
        output.write(f'APP_KEY=base64:{key}\nDB_PASSWORD={secrets.token_hex(32)}\nSTAGING_SMOKE_PASSWORD={secrets.token_hex(24)}\n')
    destination.chmod(0o600)
    print('Independent staging configuration generated. No production credentials copied.')


if __name__ == '__main__':
    setup(Path(__file__).resolve().parents[1])
