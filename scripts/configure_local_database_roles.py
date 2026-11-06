"""Provision least-privilege Laravel accounts for the local Compose stacks."""

import argparse
from pathlib import Path
import re
import secrets
import subprocess
from tempfile import NamedTemporaryFile


ROOT = Path(__file__).resolve().parents[1]


def docker(compose: list[str], *arguments: str, sql: str | None = None) -> str:
    result = subprocess.run(
        [*compose, *arguments], cwd=ROOT, input=sql, text=True, capture_output=True,
    )
    if result.returncode:
        # A PostgreSQL diagnostic for a failed SQL command can include credentials.
        if sql is None:
            print(result.stderr.strip())
        raise SystemExit(f"Compose step failed: {arguments[0]} (exit {result.returncode}).")
    return result.stdout.strip()


def configure(stack: str) -> None:
    compose = ["docker", "compose"]
    owner, database = "encg", "encg_erp"
    app_env = ROOT / "backend/.env"
    maintenance_env = ROOT / ".env.database-maintenance"
    if stack == "staging":
        compose += ["--env-file", ".env.staging", "-f", "docker-compose.staging.yml"]
        owner = database = "encg_staging"
        app_env = ROOT / ".env.staging"
        maintenance_env = ROOT / ".env.staging.database-maintenance"

    current_env = app_env.read_text(encoding="utf-8")
    if not maintenance_env.exists():
        owner_password = secrets.token_hex(32)
        with maintenance_env.open("x", encoding="utf-8") as handle:
            handle.write(
                f"DB_USERNAME={owner}\nDB_PASSWORD={owner_password}\n"
                f"POSTGRES_PASSWORD={owner_password}\n"
            )
        maintenance_env.chmod(0o600)
    maintenance = dict(line.split("=", 1) for line in maintenance_env.read_text().splitlines())
    owner_password = maintenance.get("DB_PASSWORD", "")
    if (
        maintenance.get("DB_USERNAME") != owner
        or maintenance.get("POSTGRES_PASSWORD") != owner_password
        or not re.fullmatch(r"[0-9a-f]{64}", owner_password)
    ):
        raise SystemExit("Maintenance credentials do not match this stack.")

    runtime = f"{owner}_app"
    current_credentials = dict(re.findall(r"^(DB_USERNAME|DB_PASSWORD)=([^\r\n]*)", current_env, re.M))
    runtime_password = current_credentials.get("DB_PASSWORD", "")
    if current_credentials.get("DB_USERNAME") != runtime or not re.fullmatch(r"[0-9a-f]{64}", runtime_password):
        runtime_password = secrets.token_hex(32)

    if not docker(compose, "ps", "-q", "--status", "running", "postgres"):
        docker(compose, "up", "-d", "--wait", "postgres")

    docker(
        compose, "exec", "-T", "postgres", "psql", "-X", "-q", "-v", "ON_ERROR_STOP=1",
        "-U", owner, "-d", database, "-f", "-",
        sql=f"""
BEGIN;
SET LOCAL password_encryption = 'scram-sha-256';
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '{runtime}') THEN
        CREATE ROLE {runtime};
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'encg_readonly') THEN
        ALTER ROLE encg_readonly NOLOGIN PASSWORD NULL;
    END IF;
END
$$;
ALTER ROLE {runtime} LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE
    NOREPLICATION NOBYPASSRLS PASSWORD '{runtime_password}';
REVOKE CREATE, TEMPORARY ON DATABASE {database} FROM PUBLIC, {runtime};
GRANT CONNECT ON DATABASE {database} TO {runtime};
REVOKE CREATE ON SCHEMA public FROM PUBLIC, {runtime};
GRANT USAGE ON SCHEMA public TO {runtime};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO {runtime};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO {runtime};
ALTER DEFAULT PRIVILEGES FOR ROLE {owner} IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO {runtime};
ALTER DEFAULT PRIVILEGES FOR ROLE {owner} IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO {runtime};
DO $$
DECLARE relation record;
BEGIN
    FOR relation IN SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' AND (tablename = 'migrations' OR tablename LIKE 'archived\\_%')
    LOOP
        EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON TABLE public.%I FROM %I', relation.tablename, '{runtime}');
    END LOOP;
END
$$;
ALTER ROLE {owner} PASSWORD '{owner_password}';
COMMIT;
""",
    )

    preserved = re.sub(
        r"^(?:DB_CONNECTION|DB_HOST|DB_PORT|DB_DATABASE|DB_USERNAME|DB_PASSWORD|DB_URL)=.*(?:\n|$)",
        "", current_env, flags=re.M,
    )
    with NamedTemporaryFile(
        mode="w", encoding="utf-8", dir=app_env.parent,
        prefix=".env.database-runtime-", suffix=".local", delete=False,
    ) as handle:
        replacement = Path(handle.name)
        try:
            handle.write(
                f"{preserved.rstrip()}\nDB_CONNECTION=pgsql\nDB_HOST=postgres\nDB_PORT=5432\n"
                f"DB_DATABASE={database}\nDB_USERNAME={runtime}\nDB_PASSWORD={runtime_password}\n"
            )
            handle.close()
            replacement.replace(app_env)
        finally:
            replacement.unlink(missing_ok=True)
    print(f"{stack}: database roles configured. Recreate the Laravel services to switch credentials.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("stack", choices=["local", "staging"])
    configure(parser.parse_args().stack)
