"""Check the local monitoring chain without printing credentials or ERP records."""
import base64
import json
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen


def get(url: str, headers=None):
    with urlopen(Request(url, headers=headers or {}), timeout=15) as response:
        return json.load(response)


def check():
    root = Path(__file__).resolve().parents[1]
    prometheus = "http://127.0.0.1:9090"
    grafana = "http://127.0.0.1:3001"
    targets = get(prometheus + "/api/v1/targets")["data"]["activeTargets"]
    statuses = {target["labels"]["job"]: target["health"] for target in targets}
    if not all(statuses.get(job) == "up" for job in ["encg-application", "encg-readiness", "prometheus"]):
        raise RuntimeError("One or more monitoring targets are unavailable")
    password = (root / ".monitoring-secrets/grafana-password").read_text(encoding="utf-8")
    headers = {"Authorization": "Basic " + base64.b64encode(("admin:" + password).encode()).decode()}
    if get(grafana + "/api/health")["database"] != "ok":
        raise RuntimeError("Grafana storage is unavailable")
    dashboard = get(grafana + "/api/dashboards/uid/encg-operations", headers)
    if not dashboard["meta"]["provisioned"]:
        raise RuntimeError("Grafana dashboard provisioning is unavailable")
    for panel in dashboard["dashboard"]["panels"]:
        for target in panel.get("targets", []):
            if get(prometheus + "/api/v1/query?query=" + quote(target["expr"], safe=""))["status"] != "success":
                raise RuntimeError("Invalid dashboard expression")
    health = get(grafana + "/api/datasources/uid/encg-prometheus/health", headers)
    if health["status"].lower() not in ["ok", "success"]:
        raise RuntimeError("Grafana cannot query Prometheus")
    data = get(grafana + "/api/datasources/proxy/uid/encg-prometheus/api/v1/query?query=encg_database_up", headers)
    if not data["data"]["result"]:
        raise RuntimeError("ERP metrics did not reach Grafana")
    print(json.dumps({"targets": statuses, "grafana_database": "ok", "dashboard_panels": len(dashboard["dashboard"]["panels"]), "grafana_prometheus_connection": "ok"}))


if __name__ == "__main__":
    check()
