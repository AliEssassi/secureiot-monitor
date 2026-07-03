from datetime import datetime, timedelta


class IncidentManager:
    """
    Gère le cycle de vie des incidents de sécurité (case management).
    Statuts : new → in_progress → resolved
    Inspiré du workflow de gestion d'incidents type TheHive.
    """
    def __init__(self):
        self.incidents = {}  # {incident_id: incident_data}
        self.counter = 0
        self.cooldown = {}  # {device_id: timestamp_fin_cooldown}
        self.COOLDOWN_SECONDS = 15

    def create_or_update(self, alert: dict) -> str | None:
        device_id = alert["device_id"]
        # Cooldown : si le device vient d'être résolu, on ignore les alertes
        # résiduelles le temps que les signaux reviennent à la normale.
        if device_id in self.cooldown:
            if datetime.now() < self.cooldown[device_id]:
                return None  # période de refroidissement active
            else:
                del self.cooldown[device_id]

        # Un seul incident par device, tous statuts confondus, sauf s'il est résolu
        existing = self._find_incident(device_id)

        if existing:
            incident = self.incidents[existing]

            if incident["status"] == "resolved":
                return existing

            # On met à jour les données mais SANS spammer la timeline.
            # La timeline ne garde que les événements de cycle de vie.
            incident["occurrences"] += 1
            incident["last_seen"] = alert["timestamp"]
            incident["latest_score"] = alert["anomaly_score"]
            incident["affected_metrics"] = alert.get("affected_metrics", [])
            return existing

        # Aucun incident pour ce device → création
        self.counter += 1
        incident_id = f"INC-{datetime.now().strftime('%Y%m%d')}-{self.counter:03d}"
        self.incidents[incident_id] = {
            "id": incident_id,
            "device_id": device_id,
            "severity": alert["severity"],
            "status": "new",
            "created_at": alert["timestamp"],
            "last_seen": alert["timestamp"],
            "occurrences": 1,
            "latest_score": alert["anomaly_score"],
            "affected_metrics": alert.get("affected_metrics", []),
            "anomaly_kind": alert.get("anomaly_kind", "deviation"),
            "timeline": [{
                "timestamp": alert["timestamp"],
                "event": "created",
                "detail": "Incident créé automatiquement suite à détection d'anomalie"
            }]
        }
        return incident_id

    def _find_incident(self, device_id: str) -> str | None:
        candidates = [
            inc_id for inc_id, inc in self.incidents.items()
            if inc["device_id"] == device_id and inc["status"] != "resolved"
        ]
        if not candidates:
            return None
        return max(candidates, key=lambda cid: self.incidents[cid]["id"])
        
    

    def update_status(self, incident_id: str, new_status: str) -> dict:
        """Change le statut d'un incident et enregistre l'action dans la timeline."""
        if incident_id not in self.incidents:
            raise ValueError(f"Incident inconnu : {incident_id}")

        valid = ["new", "in_progress", "resolved"]
        if new_status not in valid:
            raise ValueError(f"Statut invalide. Valeurs : {valid}")

        incident = self.incidents[incident_id]
        old_status = incident["status"]
        incident["status"] = new_status

        labels = {"new": "Nouveau", "in_progress": "En cours", "resolved": "Résolu"}
        incident["timeline"].append({
            "timestamp": datetime.now().isoformat(),
            "event": "status_change",
            "detail": f"Statut changé : {labels[old_status]} → {labels[new_status]}"
        })

        if new_status == "resolved":
            incident["resolved_at"] = datetime.now().isoformat()
            # Arme le cooldown pour éviter la recréation immédiate
            device_id = incident["device_id"]
            self.cooldown[device_id] = datetime.now() + timedelta(seconds=self.COOLDOWN_SECONDS)
        return incident

    def get_all(self) -> list:
        """Retourne tous les incidents, triés par date de création décroissante."""
        return sorted(
            self.incidents.values(),
            key=lambda x: x["created_at"],
            reverse=True
        )

    def get_one(self, incident_id: str) -> dict | None:
        return self.incidents.get(incident_id)

    def get_stats(self) -> dict:
        """Statistiques sur les incidents pour la sidebar."""
        all_inc = list(self.incidents.values())
        return {
            "total": len(all_inc),
            "new": len([i for i in all_inc if i["status"] == "new"]),
            "in_progress": len([i for i in all_inc if i["status"] == "in_progress"]),
            "resolved": len([i for i in all_inc if i["status"] == "resolved"]),
        }
    
    def auto_resolve_if_normal(self, device_id: str, is_anomaly: bool):
        """
        Auto-résout un incident actif si son device est redevenu normal
        (ex: l'opérateur a clear l'anomalie manuellement sans passer par le bouton).
        """
        if is_anomaly:
            return  # toujours en anomalie, rien à faire

        active = self._find_incident(device_id)
        if active:
            incident = self.incidents[active]
            if incident["status"] in ("new", "in_progress"):
                incident["status"] = "resolved"
                incident["resolved_at"] = datetime.now().isoformat()
                incident["timeline"].append({
                    "timestamp": datetime.now().isoformat(),
                    "event": "status_change",
                    "detail": "Statut changé : Résolu automatiquement (retour à la normale)"
                })
                self.cooldown[device_id] = datetime.now() + timedelta(seconds=self.COOLDOWN_SECONDS)
