"""
Définit la topologie réseau et la logique de propagation de menace.
Architecture en étoile : une passerelle centrale relie tous les appareils.
"""

# La passerelle est le point de passage de tout le trafic réseau
GATEWAY_ID = "DEV-002"

# Définition des liens : chaque device est connecté à la passerelle
TOPOLOGY = {
    "gateway": GATEWAY_ID,
    "links": [
        {"source": GATEWAY_ID, "target": "DEV-001"},
        {"source": GATEWAY_ID, "target": "DEV-003"},
        {"source": GATEWAY_ID, "target": "DEV-004"},
        {"source": GATEWAY_ID, "target": "DEV-005"},
        {"source": GATEWAY_ID, "target": "DEV-006"},
    ]
}


def compute_topology_state(snapshot: list) -> dict:
    """
    Calcule l'état de la topologie et la propagation de menace.

    Logique de propagation :
    - Si la passerelle est compromise, tous les devices en aval sont "exposés"
      (un attaquant ayant le contrôle de la passerelle peut atteindre tout le réseau).
    - Un device directement en anomalie est "compromis".
    - Un device sain derrière une passerelle compromise est "exposé".
    """
    # Index rapide de l'état de chaque device
    device_states = {}
    for device in snapshot:
        analysis = device.get("analysis", {})
        device_states[device["id"]] = {
            "id": device["id"],
            "name": device["name"],
            "type": device["type"],
            "is_anomaly": analysis.get("is_anomaly", False),
            "severity": analysis.get("severity", "normal"),
        }

    gateway_compromised = device_states.get(GATEWAY_ID, {}).get("is_anomaly", False)

    # Calcul de l'état de chaque nœud
    nodes = []
    for dev_id, state in device_states.items():
        is_gateway = dev_id == GATEWAY_ID

        if state["is_anomaly"]:
            node_status = "compromised"
        elif gateway_compromised and not is_gateway:
            # Device sain mais exposé car la passerelle est compromise
            node_status = "exposed"
        else:
            node_status = "secure"

        nodes.append({
            **state,
            "is_gateway": is_gateway,
            "node_status": node_status,
        })

    # Calcul de l'état des liens
    links = []
    for link in TOPOLOGY["links"]:
        target_state = device_states.get(link["target"], {})
        target_anomaly = target_state.get("is_anomaly", False)

        if gateway_compromised:
            # La passerelle compromise met tous les liens en danger
            link_status = "threat"
        elif target_anomaly:
            # Le device cible est compromis
            link_status = "compromised"
        else:
            link_status = "normal"

        links.append({
            "source": link["source"],
            "target": link["target"],
            "status": link_status,
        })

    # Statistiques globales
    compromised_count = sum(1 for n in nodes if n["node_status"] == "compromised")
    exposed_count = sum(1 for n in nodes if n["node_status"] == "exposed")

    return {
        "gateway_id": GATEWAY_ID,
        "gateway_compromised": gateway_compromised,
        "nodes": nodes,
        "links": links,
        "stats": {
            "compromised": compromised_count,
            "exposed": exposed_count,
            "secure": len(nodes) - compromised_count - exposed_count,
        }
    }