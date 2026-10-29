"""Prepare local monitoring secrets without printing or committing credentials."""
import argparse
import os
from pathlib import Path
import re
import secrets


def configure(root: Path, network: str, backend_env: str = "backend/.env") -> None:
    if not re.fullmatch(r"[A-Za-z0-9_.-]{1,128}", network):
        raise ValueError("Invalid Docker network name")
    environment = (root / backend_env).resolve()
    if not environment.is_relative_to(root.resolve()) or not environment.is_file():
        raise ValueError("The backend environment file must exist inside the project")
    content = environment.read_text(encoding="utf-8-sig")
    match = re.search(r"^OBSERVABILITY_METRICS_TOKEN=([^\r\n]*)", content, re.M)
    token = match.group(1).strip().strip("\"'") if match else ""
    if not re.fullmatch(r"[A-Za-z0-9_-]{32,128}", token):
        token = secrets.token_hex(32)
    updates = {"OBSERVABILITY_ENABLED": "true", "OBSERVABILITY_METRICS_TOKEN": token,
               "OBSERVABILITY_CACHE_STORE": "redis"}
    for key, value in updates.items():
        pattern = rf"^{key}=[^\r\n]*"
        content = re.sub(pattern, f"{key}={value}", content, flags=re.M) if re.search(pattern, content, re.M) else content.rstrip() + f"\n{key}={value}\n"
    environment.write_text(content, encoding="utf-8")
    directory = root / ".monitoring-secrets"
    directory.mkdir(mode=0o700, exist_ok=True)
    os.chmod(directory, 0o700)
    (directory / "metrics-token").write_text(token, encoding="utf-8")
    password = directory / "grafana-password"
    if not password.exists():
        password.write_text(secrets.token_urlsafe(32), encoding="utf-8")
    # Parent directory is private; bind-mounted secrets must be readable by container UIDs.
    for file in [directory / "metrics-token", password]:
        os.chmod(file, 0o644)
    monitoring_env = root / ".env.monitoring"
    existing = monitoring_env.read_text(encoding="utf-8") if monitoring_env.exists() else ""
    if re.search(r"^ERP_NETWORK=", existing, re.M):
        existing = re.sub(r"^ERP_NETWORK=[^\r\n]*", f"ERP_NETWORK={network}", existing, flags=re.M)
    else:
        existing += f"ERP_NETWORK={network}\n"
    monitoring_env.write_text(existing, encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--network", required=True, help="Existing ERP Compose network")
    parser.add_argument("--backend-env", default="backend/.env")
    args = parser.parse_args()
    configure(Path(__file__).resolve().parents[1], args.network, args.backend_env)
    print("Monitoring prepared. Grafana login: admin. Password stored in .monitoring-secrets/grafana-password.")
