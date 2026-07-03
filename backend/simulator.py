import random
import math
from datetime import datetime

# Définition des 6 appareils IoT simulés
DEVICES = [
    {
        "id": "DEV-001",
        "name": "Machine-outil CNC",
        "type": "machine",
        "metrics": {
            "temperature": {"baseline": 65, "unit": "°C"},
            "vibrations": {"baseline": 120, "unit": "Hz"},
            "consommation": {"baseline": 3500, "unit": "W"},
        }
    },
    {
        "id": "DEV-002",
        "name": "Passerelle réseau",
        "type": "router",
        "metrics": {
            "connexions": {"baseline": 12, "unit": "conn"},
            "bande_passante": {"baseline": 45, "unit": "Mbps"},
            "paquets_par_seconde": {"baseline": 340, "unit": "pkt/s"},
        }
    },
    {
        "id": "DEV-003",
        "name": "Capteur ambiance",
        "type": "sensor",
        "metrics": {
            "temperature": {"baseline": 22, "unit": "°C"},
            "humidite": {"baseline": 55, "unit": "%"},
            "co2": {"baseline": 800, "unit": "ppm"},
        }
    },
    {
        "id": "DEV-004",
        "name": "Robot collaboratif",
        "type": "robot",
        "metrics": {
            "vitesse": {"baseline": 250, "unit": "mm/s"},
            "charge": {"baseline": 60, "unit": "%"},
            "cycles_par_heure": {"baseline": 45, "unit": "cycles/h"},
        }
    },
    {
        "id": "DEV-005",
        "name": "Compteur énergie",
        "type": "smartmeter",
        "metrics": {
            "consommation": {"baseline": 12.5, "unit": "kWh"},
            "tension": {"baseline": 230, "unit": "V"},
            "frequence": {"baseline": 50, "unit": "Hz"},
        }
    },
    {
        "id": "DEV-006",
        "name": "Caméra sécurité",
        "type": "camera",
        "metrics": {
            "fps": {"baseline": 25, "unit": "fps"},
            "bande_passante": {"baseline": 8, "unit": "Mbps"},
            "detections": {"baseline": 3, "unit": "det/h"},
        }
    },
]

# Stocke les anomalies actives par appareil
active_anomalies = {}

def generate_normal_value(baseline: float, noise_pct: float = 0.05) -> float:
    """Génère une valeur normale autour d'une baseline avec du bruit gaussien."""
    noise = random.gauss(0, baseline * noise_pct)
    return round(baseline + noise, 2)

def generate_metric_value(device_id: str, metric_name: str, baseline: float) -> float:
    """Génère une valeur pour une métrique selon l'état de l'appareil."""
    anomaly = active_anomalies.get(device_id)

    if not anomaly:
        return generate_normal_value(baseline)

    anomaly_type = anomaly["type"]

    if anomaly_type == "spike":
        # Valeur anormalement élevée (ex: surtension, scan réseau)
        return round(baseline * random.uniform(5, 10), 2)

    elif anomaly_type == "drift":
        # Dérive progressive depuis le début de l'anomalie
        elapsed = (datetime.now() - anomaly["started_at"]).seconds
        drift_factor = 1 + (elapsed / 60) * 0.5  # +50% par minute
        return round(generate_normal_value(baseline * drift_factor), 2)

    elif anomaly_type == "flatline":
        # Plus de variation — appareil bloqué
        return baseline

    elif anomaly_type == "noise":
        # Bruit excessif — signal instable
        return round(generate_normal_value(baseline, noise_pct=0.5), 2)

    return generate_normal_value(baseline)

def get_device_snapshot(device: dict) -> dict:
    """Génère un snapshot complet d'un appareil à l'instant T."""
    device_id = device["id"]
    anomaly = active_anomalies.get(device_id)

    metrics_values = {}
    for metric_name, metric_info in device["metrics"].items():
        metrics_values[metric_name] = {
            "value": generate_metric_value(device_id, metric_name, metric_info["baseline"]),
            "unit": metric_info["unit"],
            "baseline": metric_info["baseline"],
        }

    return {
        "id": device_id,
        "name": device["name"],
        "type": device["type"],
        "timestamp": datetime.now().isoformat(),
        "status": anomaly["type"] if anomaly else "normal",
        "metrics": metrics_values,
    }

def get_all_snapshots() -> list:
    """Retourne un snapshot de tous les appareils."""
    return [get_device_snapshot(device) for device in DEVICES]

def inject_anomaly(device_id: str, anomaly_type: str) -> dict:
    """Injecte une anomalie sur un appareil."""
    valid_types = ["spike", "drift", "flatline", "noise"]
    if anomaly_type not in valid_types:
        raise ValueError(f"Type d'anomalie invalide. Valeurs acceptées : {valid_types}")

    device_ids = [d["id"] for d in DEVICES]
    if device_id not in device_ids:
        raise ValueError(f"Appareil inconnu : {device_id}")

    active_anomalies[device_id] = {
        "type": anomaly_type,
        "started_at": datetime.now(),
    }

    return {"device_id": device_id, "anomaly_type": anomaly_type, "status": "injected"}

def clear_anomaly(device_id: str) -> dict:
    """Supprime une anomalie active sur un appareil."""
    if device_id in active_anomalies:
        del active_anomalies[device_id]
    return {"device_id": device_id, "status": "cleared"}

def get_devices_list() -> list:
    """Retourne la liste des appareils sans leurs métriques."""
    return [{"id": d["id"], "name": d["name"], "type": d["type"]} for d in DEVICES]