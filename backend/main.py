from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from simulator import inject_anomaly, clear_anomaly, get_all_snapshots, get_devices_list, get_history, get_active_anomaly_type, get_device_context
from anomaly_detector import DetectorManager
from incident_manager import IncidentManager
from topology import compute_topology_state, GATEWAY_ID

from ai_analyst import analyze_incident

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

@app.get("/api/topology")
def get_topology():
    snapshot = get_all_snapshots()
    for s in snapshot:
        analysis = detector.analyze(s)
        s["analysis"] = analysis
    return compute_topology_state(snapshot)


@app.post("/api/incidents/{incident_id}/analyze")
def analyze(incident_id: str):
    incident = incidents.get_one(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident introuvable")
    try:
        device_id = incident["device_id"]
        anomaly_type = get_active_anomaly_type(device_id)
        device_context = get_device_context(device_id)
        is_gateway = device_id == GATEWAY_ID

        snapshot = get_all_snapshots()
        for s in snapshot:
            s["analysis"] = detector.analyze(s)
        topo = compute_topology_state(snapshot)
        gateway_compromised = topo["gateway_compromised"]

        analysis = analyze_incident(
            incident, anomaly_type, device_context,
            is_gateway, gateway_compromised
        )

        # Stocke l'analyse dans l'incident + log dans la timeline
        incidents.attach_analysis(incident_id, analysis)

        return {"incident_id": incident_id, "analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur analyse IA : {str(e)}")
    
        
@app.post("/api/incidents/clear-all")
def clear_all_incidents():
    # Coupe toutes les anomalies actives d'abord
    from simulator import DEVICES
    for device in DEVICES:
        clear_anomaly(device["id"])
    incidents.clear_all()
    return {"status": "all_cleared"}

@app.post("/api/incidents/clear-resolved")
def clear_resolved_incidents():
    incidents.clear_resolved()
    return {"status": "resolved_cleared"}