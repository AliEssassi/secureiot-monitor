from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from simulator import inject_anomaly, clear_anomaly, get_all_snapshots, get_devices_list

app = FastAPI(title="SecureIoT Monitor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    return get_all_snapshots()

@app.post("/api/inject-anomaly")
def inject(request: AnomalyRequest):
    try:
        return inject_anomaly(request.device_id, request.anomaly_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/clear-anomaly/{device_id}")
def clear(device_id: str):
    return clear_anomaly(device_id)