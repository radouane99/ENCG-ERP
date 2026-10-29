import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("monitoring_setup", Path(__file__).parents[1] / "setup_monitoring.py")
setup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(setup)


class MonitoringSetupTest(unittest.TestCase):
    def test_existing_application_secrets_and_monitoring_credentials_are_preserved(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "backend").mkdir()
            environment = root / "backend/.env"
            environment.write_text("APP_KEY=synthetic-preserve\nGEMINI_API_KEY=synthetic-preserve\n", encoding="utf-8")
            setup.configure(root, "test_encgnet")
            token = (root / ".monitoring-secrets/metrics-token").read_text(encoding="utf-8")
            password = (root / ".monitoring-secrets/grafana-password").read_text(encoding="utf-8")
            setup.configure(root, "test_encgnet")
            self.assertEqual(token, (root / ".monitoring-secrets/metrics-token").read_text(encoding="utf-8"))
            self.assertEqual(password, (root / ".monitoring-secrets/grafana-password").read_text(encoding="utf-8"))
            self.assertIn("GEMINI_API_KEY=synthetic-preserve", environment.read_text(encoding="utf-8"))
            self.assertEqual(1, environment.read_text(encoding="utf-8").count("OBSERVABILITY_METRICS_TOKEN="))

    def test_invalid_network_name_cannot_modify_environment(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "backend").mkdir()
            environment = root / "backend/.env"
            environment.write_text("APP_KEY=synthetic\n", encoding="utf-8")
            with self.assertRaises(ValueError):
                setup.configure(root, "invalid\nTOKEN=unsafe")
            self.assertEqual("APP_KEY=synthetic\n", environment.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
