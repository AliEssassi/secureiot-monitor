import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from datetime import datetime

class AnomalyDetector:
    def __init__(self, device_id: str, metric_names: list):
        self.device_id = device_id
        self.metric_names = metric_names
        self.model = IsolationForest(contamination=0.05, random_state=42)
        self.scaler = StandardScaler()
        self.history = []         # Historique des valeurs
        self.is_trained = False
        self.min_samples = 30     # Nombre minimum de mesures avant entraînement

    def add_sample(self, metrics: dict) -> dict:
        """Ajoute une mesure et retourne une analyse si le modèle est entraîné."""
        values = [metrics[m]["value"] for m in self.metric_names if m in metrics]
        self.history.append(values)

        # Entraîne le modèle dès qu'on a assez de données
        if len(self.history) == self.min_samples:
            self._train()

        # Re-entraîne toutes les 50 mesures
        if len(self.history) > self.min_samples and len(self.history) % 50 == 0:
            self._train()

        if not self.is_trained:
            return {"status": "collecting", "samples": len(self.history), "needed": self.min_samples}

        return self._predict(values, metrics)

    def _train(self):
        """Entraîne le modèle sur l'historique."""
        X = np.array(self.history)
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled)
        self.is_trained = True

    def _predict(self, values: list, metrics: dict) -> dict:
        """Prédit si la mesure est anormale."""
        X = np.array([values])
        X_scaled = self.scaler.transform(X)
        score = self.model.decision_function(X_scaled)[0]
        prediction = self.model.predict(X_scaled)[0]

        # Conversion explicite en types Python natifs
        score = float(score)
        is_anomaly = bool(prediction == -1) and score < -0.10

        result = {
            "device_id": self.device_id,
            "timestamp": datetime.now().isoformat(),
            "anomaly_score": round(score, 4),
            "is_anomaly": is_anomaly,
            "severity": self._get_severity(score),
            "status": "anomaly" if is_anomaly else "normal",
        }

        if is_anomaly:
            result["alert"] = self._build_alert(score, metrics)

        return result

    def _get_severity(self, score: float) -> str:
        if score > -0.10:
            return "normal"
        elif score > -0.20:
            return "warning"
        else:
            return "critical"

    def _build_alert(self, score: float, metrics: dict) -> dict:
        """Construit une alerte structurée."""
        affected = []
        for metric_name in self.metric_names:
            if metric_name in metrics:
                m = metrics[metric_name]
                deviation = abs(m["value"] - m["baseline"]) / m["baseline"] * 100
                if deviation > 30:
                    affected.append({
                        "metric": metric_name,
                        "value": m["value"],
                        "baseline": m["baseline"],
                        "deviation_pct": round(deviation, 1)
                    })

        return {
            "id": f"ALT-{datetime.now().strftime('%Y%m%d%H%M%S')}-{self.device_id}",
            "device_id": self.device_id,
            "severity": self._get_severity(score),
            "anomaly_score": round(float(score), 4),
            "affected_metrics": affected,
            "timestamp": datetime.now().isoformat(),
        }


class DetectorManager:
    """Gère un détecteur par appareil."""
    def __init__(self):
        self.detectors = {}
        self.alerts = []  # Historique des alertes

    def register_device(self, device_id: str, metric_names: list):
        self.detectors[device_id] = AnomalyDetector(device_id, metric_names)

    def analyze(self, snapshot: dict) -> dict:
        """Analyse un snapshot complet et retourne les résultats."""
        device_id = snapshot["id"]

        if device_id not in self.detectors:
            metric_names = list(snapshot["metrics"].keys())
            self.register_device(device_id, metric_names)

        result = self.detectors[device_id].add_sample(snapshot["metrics"])

        # Stocke l'alerte si anomalie détectée
        if result.get("is_anomaly") and result.get("alert"):
            self.alerts.append(result["alert"])
            # Garde seulement les 100 dernières alertes
            if len(self.alerts) > 100:
                self.alerts = self.alerts[-100:]

        return result

    def get_alerts(self, limit: int = 20) -> list:
        return self.alerts[-limit:]

    def get_detector_status(self) -> list:
        return [
            {
                "device_id": did,
                "is_trained": det.is_trained,
                "samples": len(det.history),
            }
            for did, det in self.detectors.items()
        ]