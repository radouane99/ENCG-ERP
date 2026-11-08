import gzip
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]


@unittest.skipIf(os.name == "nt", "Release scripts run on Linux. Use the isolated Linux test container.")
class ReleaseToolsTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        for directory in ["scripts", "backend", ".deploy", "certbot/conf/live/encg-erp", "bin"]:
            (self.root / directory).mkdir(parents=True, exist_ok=True)
        for script in ["deploy-release.sh", "deploy-preflight.sh", "backup-postgres.sh", "release-smoke.sh"]:
            shutil.copy(ROOT / "scripts" / script, self.root / "scripts" / script)
        (self.root / "backend/.env.production").write_text(
            "APP_ENV=production\nAPP_DEBUG=false\nAPP_KEY=base64:synthetic\n"
            "APP_URL=https://erp.example.test\nDB_PASSWORD=synthetic-test-only\n"
            "REDIS_PASSWORD=synthetic-test-only\n",
            encoding="utf-8",
        )
        for filename in ["fullchain.pem", "privkey.pem"]:
            (self.root / "certbot/conf/live/encg-erp" / filename).touch()
        self.log = self.root / "calls.log"
        self.environment = {
            **os.environ,
            "PATH": str(self.root / "bin") + os.pathsep + os.environ["PATH"],
            "RELEASE_TEST_LOG": str(self.log),
        }
        self.tool("git", 'echo "git $*" >> "$RELEASE_TEST_LOG"')
        self.tool("flock", "exit 0")
        self.tool("docker", '''
echo "docker $*" >> "$RELEASE_TEST_LOG"
case "$*" in
  *"printenv POSTGRES_USER"*) echo release_test ;;
  *"printenv POSTGRES_DB"*) echo encg_release_test ;;
  *"ps --status running --services"*) echo backend ;;
  *" pg_dump "*) printf 'SELECT 1;\n' ;;
  *" tar -czf "*) printf 'synthetic-storage' | gzip ;;
  *" php artisan migrate "*)
    if [ "${RELEASE_FAIL_MIGRATION:-0}" = 1 ]; then exit 1; fi ;;
esac
''')
        self.tool("curl", '''
if [ "${RELEASE_FAIL_HTTP:-0}" = 1 ]; then exit 22; fi
case "$*" in
  *"/api/health/ready"*) printf '{"ready":true}' ;;
  *"/login"*) printf '<div id="root"></div>' ;;
  *"/api/v1/auth/me"*) printf '401' ;;
esac
''')

    def tool(self, name, content):
        path = self.root / "bin" / name
        path.write_text("#!/usr/bin/env bash\nset -eu\n" + content + "\n", encoding="utf-8")
        path.chmod(0o755)

    def manifest(self, character):
        return (
            f"ERP_RELEASE_COMMIT={character * 40}\n"
            f"ERP_BACKEND_IMAGE=ghcr.io/example/erp/backend@sha256:{character * 64}\n"
            f"ERP_WEB_IMAGE=ghcr.io/example/erp/web@sha256:{character * 64}\n"
        )

    def deploy(self, character="a", extra_environment=None, rollback=False):
        path = self.root / ".deploy/candidate.env"
        path.write_text(self.manifest(character), encoding="utf-8")
        arguments = ["--rollback"] if rollback else ["--release", str(path)]
        return subprocess.run(
            ["bash", str(self.root / "scripts/deploy-release.sh"), *arguments],
            env={**self.environment, **(extra_environment or {})},
            capture_output=True,
            text=True,
            check=False,
        )

    def test_release_backs_up_before_migrating_and_records_only_after_smoke(self):
        result = self.deploy()
        self.assertEqual(result.returncode, 0, result.stderr)
        calls = self.log.read_text()
        self.assertLess(calls.index(" pg_dump "), calls.index(" php artisan migrate "))
        self.assertIn("operations:check-deployment-queue", calls)
        self.assertEqual((self.root / ".deploy/current.env").read_text(), self.manifest("a"))
        self.assertFalse((self.root / ".deploy/pending.env").exists())
        backups = list((self.root / ".deploy/backups").glob("*.sql.gz"))
        self.assertEqual(len(backups), 1)
        with gzip.open(backups[0], "rt") as stream:
            self.assertIn("SELECT 1", stream.read())

    def test_failed_migration_keeps_last_good_release_and_rollback_uses_it(self):
        current = self.root / ".deploy/current.env"
        current.write_text(self.manifest("a"))
        result = self.deploy("b", {"RELEASE_FAIL_MIGRATION": "1"})
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(current.read_text(), self.manifest("a"))
        self.assertTrue((self.root / ".deploy/pending.env").exists())
        result = self.deploy(rollback=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(current.read_text(), self.manifest("a"))

    def test_failed_http_probe_does_not_promote_release(self):
        current = self.root / ".deploy/current.env"
        current.write_text(self.manifest("a"))
        result = self.deploy("b", {"RELEASE_FAIL_HTTP": "1"})
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(current.read_text(), self.manifest("a"))

    def test_rollback_restores_previous_images_without_running_migrations(self):
        self.assertEqual(self.deploy("a").returncode, 0)
        self.assertEqual(self.deploy("b").returncode, 0)
        self.log.write_text("")
        result = self.deploy(rollback=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual((self.root / ".deploy/current.env").read_text(), self.manifest("a"))
        self.assertNotIn(" php artisan migrate ", self.log.read_text())

    def test_mutable_image_tag_is_rejected_before_docker_is_called(self):
        self.manifest = lambda _: (
            "ERP_RELEASE_COMMIT=" + "a" * 40 + "\n"
            "ERP_BACKEND_IMAGE=ghcr.io/example/backend:latest\n"
            "ERP_WEB_IMAGE=ghcr.io/example/web:latest\n"
        )
        self.assertNotEqual(self.deploy().returncode, 0)
        self.assertFalse(self.log.exists())

    def test_failed_database_backup_does_not_leave_an_apparently_complete_dump(self):
        self.tool("docker", 'if [ "$1" = inspect ]; then exit 0; fi\nprintf partial-data\nexit 1')
        output = self.root / "backups"
        result = subprocess.run(
            ["bash", str(self.root / "scripts/backup-postgres.sh")],
            env={**self.environment, "PG_CONTAINER": "isolated", "BACKUP_DIR": str(output)},
            capture_output=True,
            check=False,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(list(output.iterdir()), [])
