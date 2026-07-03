import numpy as np
from datetime import datetime


class AnomalyDetector:
    """
    Détecteur hybride combinant deux approches :
    1. Statistique (z-score) : détection déterministe basée sur l'écart à la moyenne
    2. Baseline learning : apprentissage de la normalité sur une fenêtre initiale saine
    """
    def __init__(self, device_id: str, metric_names: list):
        self.device_id = device_id
        self.metric_names = metric_names
        self.baseline_stats = {}      # {metric: {"mean": x, "std": y}}
        self.history = []
        self.is_trained = False
        self.min_samples = 20
        self.anomaly_hold = 0
        self.HOLD_CYCLES = 5

    def add_sample(self, metrics: dict) -> dict:
        values = {m: metrics[m]["value"] for m in self.metric_names if m in metrics}
        self.history.append(values)

        # Apprentissage unique de la baseline sur la fenêtre initiale saine
        if len(self.history) == self.min_samples and not self.is_trained:
            self._train()

        # Limite mémoire
        if len(self.history) > 500:
            self.history = self.history[-500:]

        if not self.is_trained:
            return {
                "device_id": self.device_id,
                "status": "collecting",
                "samples": len(self.history),
                "needed": self.min_samples,
                "is_anomaly": False,
            }

        return self._predict(values, metrics)

    def _train(self):
        """Calcule la moyenne et l'écart-type de chaque métrique sur la fenêtre saine."""
        for metric in self.metric_names:
            vals = [h[metric] for h in self.history if metric in h]
            if vals:
                mean = float(np.mean(vals))
                std = float(np.std(vals))
                # Évite un std trop faible qui rendrait le z-score explosif
                std = max(std, abs(mean) * 0.02, 0.1)
                self.baseline_stats[metric] = {"mean": mean, "std": std}
        self.is_trained = True

    def _predict(self, values: dict, metrics: dict) -> dict:
        """
        Détection hybride :
        1. z-score : détecte les valeurs qui s'écartent de la normale (spike, drift, noise)
        2. variance nulle : détecte l'absence de variation (flatline)
        """
        max_z = 0.0
        affected = []
        flatline_detected = False

        # Fenêtre récente pour analyser la variation (10 dernières mesures)
        recent = self.history[-10:] if len(self.history) >= 10 else self.history

        for metric, value in values.items():
            if metric not in self.baseline_stats:
                continue
            stats = self.baseline_stats[metric]

            # --- Détection 1 : z-score (écart à la normale) ---
            z = abs(value - stats["mean"]) / stats["std"]
            max_z = max(max_z, z)

            # --- Détection 2 : flatline (variance nulle sur la fenêtre récente) ---
            recent_vals = [h[metric] for h in recent if metric in h]
            if len(recent_vals) >= 8:
                recent_std = float(np.std(recent_vals))
                # Si la variation récente est quasi nulle alors qu'elle devrait varier
                if recent_std < stats["std"] * 0.05 and stats["std"] > 0.1:
                    flatline_detected = True
                    baseline = metrics[metric]["baseline"]
                    affected.append({
                        "metric": metric,
                        "value": value,
                        "baseline": baseline,
                        "z_score": 0.0,
                        "deviation_pct": 0.0,
                        "type": "flatline",
                    })
                    continue

            # Métrique affectée par déviation
            if z > 4:
                baseline = metrics[metric]["baseline"]
                deviation = ((value - baseline) / baseline * 100) if baseline else 0
                affected.append({
                    "metric": metric,
                    "value": value,
                    "baseline": baseline,
                    "z_score": round(z, 2),
                    "deviation_pct": round(deviation, 1),
                })

        # Détection instantanée
        raw_anomaly = max_z > 5 or flatline_detected

        # Hystérésis : si une anomalie est détectée, on recharge le compteur.
        # Sinon on décrémente. L'état reste "anormal" tant que le compteur > 0.
        if raw_anomaly:
            self.anomaly_hold = self.HOLD_CYCLES
        elif self.anomaly_hold > 0:
            self.anomaly_hold -= 1

        is_anomaly = self.anomaly_hold > 0

        if flatline_detected and max_z <= 5:
            severity = "warning"
            anomaly_score = -0.25
        elif raw_anomaly:
            severity = self._get_severity(max_z)
            anomaly_score = round(-min(max_z / 20, 1.0), 4)
        elif is_anomaly:
            # En phase de "hold" : on maintient un score anormal léger
            severity = "warning"
            anomaly_score = round(-min(max_z / 20, 1.0), 4)
        else:
            severity = "normal"
            anomaly_score = round(-min(max_z / 20, 1.0), 4)

        result = {
            "device_id": self.device_id,
            "timestamp": datetime.now().isoformat(),
            "anomaly_score": anomaly_score,
            "max_z_score": round(max_z, 2),
            "is_anomaly": is_anomaly,
            "severity": severity,
            "status": "anomaly" if is_anomaly else "normal",
            "flatline": flatline_detected,
        }

        if is_anomaly:
            result["alert"] = {
                "id": f"ALT-{datetime.now().strftime('%Y%m%d%H%M%S')}-{self.device_id}",
                "device_id": self.device_id,
                "severity": severity,
                "anomaly_score": anomaly_score,
                "max_z_score": round(max_z, 2),
                "affected_metrics": affected,
                "timestamp": datetime.now().isoformat(),
                "anomaly_kind": "flatline" if (flatline_detected and max_z <= 5) else "deviation",
            }

        return result

    def _get_severity(self, max_z: float) -> str:
        """Sévérité basée sur l'ampleur de la déviation."""
        if max_z <= 5:
            return "normal"
        elif max_z <= 10:
            return "warning"
        else:
            return "critical"


class DetectorManager:
    def __init__(self):
        self.detectors = {}
        self.alerts = []

    def register_device(self, device_id: str, metric_names: list):
        self.detectors[device_id] = AnomalyDetector(device_id, metric_names)

    def analyze(self, snapshot: dict) -> dict:
        device_id = snapshot["id"]
        if device_id not in self.detectors:
            metric_names = list(snapshot["metrics"].keys())
            self.register_device(device_id, metric_names)

        result = self.detectors[device_id].add_sample(snapshot["metrics"])

        if result.get("is_anomaly") and result.get("alert"):
            self.alerts.append(result["alert"])
            if len(self.alerts) > 100:
                self.alerts = self.alerts[-100:]

        return result

    def get_alerts(self, limit: int = 20) -> list:
        return self.alerts[-limit:]

    def get_detector_status(self) -> list:
        return [
            {"device_id": did, "is_trained": det.is_trained, "samples": len(det.history)}
            for did, det in self.detectors.items()
        ]