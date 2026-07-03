from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from simulator import inject_anomaly, clear_anomaly, get_all_snapshots, get_devices_list, get_history
from anomaly_detector import DetectorManager
from incident_manager import IncidentManager

app = FastAPI(title="SecureIoT Monitor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

detector = DetectorManager()
incidents = IncidentManager()

class AnomalyRequest(BaseModel):
    device_id: str
    anomaly_type: str

@app.get("/")
def root():
    return {"status": "SecureIoT Monitor is running"}

@app.get("/api/devices")
def get_devices():
    return get_devices_list()

@app.get("/api/snapshot")
def get_snapshot():
    snapshots = get_all_snapshots()
    results = []
    for snapshot in snapshots:
        analysis = detector.analyze(snapshot)
        device_id = snapshot["id"]
        is_anomaly = analysis.get("is_anomaly", False)

        # Auto-résolution si le device est redevenu normal
        incidents.auto_resolve_if_normal(device_id, is_anomaly)

        # Création/màj d'incident si anomalie (respecte le cooldown)
        if is_anomaly and analysis.get("alert"):
            incident_id = incidents.create_or_update(analysis["alert"])
            if incident_id:  # None si en cooldown
                analysis["incident_id"] = incident_id

        results.append({**snapshot, "analysis": analysis})
    return results

@app.get("/api/alerts")
def get_alerts(limit: int = 20):
    return detector.get_alerts(limit)

@app.get("/api/detector-status")
def get_detector_status():
    return detector.get_detector_status()

@app.post("/api/inject-anomaly")
def inject(request: AnomalyRequest):
    try:
        return inject_anomaly(request.device_id, request.anomaly_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/clear-anomaly/{device_id}")
def clear(device_id: str):
    return clear_anomaly(device_id)

@app.get("/api/history/{device_id}")
def history(device_id: str):
    return get_history(device_id)

class StatusUpdate(BaseModel):
    status: str

@app.get("/api/incidents")
def get_incidents():
    return incidents.get_all()

@app.get("/api/incidents/{incident_id}")
def get_incident(incident_id: str):
    inc = incidents.get_one(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident introuvable")
    return inc

@app.patch("/api/incidents/{incident_id}/status")
def update_incident_status(incident_id: str, update: StatusUpdate):
    try:
        return incidents.update_status(incident_id, update.status)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/incidents-stats")
def get_incidents_stats():
    return incidents.get_stats()