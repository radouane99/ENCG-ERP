import importlib.util
from pathlib import Path
from types import SimpleNamespace
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


def module(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / f'{name}.py')
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


class ReliabilityToolsTest(unittest.TestCase):
    def test_staging_does_not_copy_production_secrets_and_preserves_existing_keys(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / '.env').write_text('PRIVATE_PRODUCTION_SECRET', encoding='utf-8')
            module('setup_staging').setup(root)
            first = (root / '.env.staging').read_text(encoding='utf-8')
            self.assertNotIn('PRIVATE_PRODUCTION_SECRET', first)
            self.assertIn('APP_KEY=base64:', first)
            module('setup_staging').setup(root)
            self.assertEqual(first, (root / '.env.staging').read_text(encoding='utf-8'))

    def test_load_probe_rejects_external_targets_mutations_and_excessive_pressure(self):
        validate = module('load_smoke').validate
        for url, requests, workers in [
            ('https://erp.example.org/up', 1, 1),
            ('http://localhost/api/admin/import', 1, 1),
            ('http://localhost/up?token=secret', 1, 1),
            ('http://localhost/up', 201, 1),
            ('http://localhost/up', 1, 9),
        ]:
            with self.assertRaises(ValueError):
                validate(SimpleNamespace(url=url, requests=requests, workers=workers))
