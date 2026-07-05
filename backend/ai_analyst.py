import os
from anthropic import Anthropic

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# Haiku : rapide et économique, parfait pour de l'analyse structurée
MODEL = "claude-haiku-4-5-20251001"


def analyze_incident(incident: dict, anomaly_type: str = None,
                     device_context: dict = None, is_gateway: bool = False,
                     gateway_compromised: bool = False) -> str:
    device_id = incident.get("device_id", "inconnu")
    severity = incident.get("severity", "warning")
    occurrences = incident.get("occurrences", 1)
    metrics = incident.get("affected_metrics", [])
    ctx = device_context or {}

    # Métriques
    metrics_desc = ""
    for m in metrics:
        deviation = m.get("deviation_pct", 0)
        z = m.get("z_score", 0)
        metrics_desc += f"- {m['metric']} : {m['value']} (normale ~{m['baseline']})"
        if deviation != 0:
            metrics_desc += f", écart {deviation:+.0f}%"
        metrics_desc += f", z-score {z}\n"

    # Pattern d'attaque
    pattern_desc = {
        "spike": "pic brutal des valeurs (hausse soudaine et massive) — typique d'un scan réseau, d'un déni de service ou d'une surcharge malveillante",
        "drift": "dérive progressive et continue — typique d'une compromission lente, d'une fuite ou d'un capteur qui se décalibre",
        "flatline": "signal figé (valeurs constantes anormales) — typique d'un capteur bloqué, déconnecté ou d'une attaque masquant l'état réel",
        "noise": "instabilité erratique (oscillations violentes) — typique d'une interférence, d'un capteur défaillant ou d'une manipulation du signal",
    }.get(anomaly_type, "déviation par rapport au comportement normal")

    # Contexte de propagation
    propagation = ""
    if is_gateway:
        propagation = "\n- ATTENTION : cet appareil EST la passerelle réseau centrale. Sa compromission expose tout le réseau."
    elif gateway_compromised:
        propagation = "\n- CONTEXTE RÉSEAU : la passerelle centrale est actuellement compromise. Cet incident pourrait résulter d'un mouvement latéral depuis la passerelle."

    # Historique
    history_note = ""
    if occurrences > 20:
        history_note = f"\n- Incident PERSISTANT ({occurrences} occurrences) — l'anomalie dure dans le temps, ce n'est pas un pic isolé."

    prompt = f"""Tu es un analyste SOC spécialisé en cybersécurité des systèmes IoT industriels.
Un système de détection par ML a levé un incident. Analyse-le pour un opérateur d'atelier.

APPAREIL CONCERNÉ :
- {ctx.get('name', device_id)} ({device_id})
- Rôle : {ctx.get('role', 'non spécifié')}
- Enjeu de sécurité : {ctx.get('security_stake', 'non spécifié')}

INCIDENT :
- Gravité : {severity}
- Pattern détecté : {pattern_desc}{propagation}{history_note}
- Métriques :
{metrics_desc}

Réponds en 3 sections courtes, en français, format exact ci-dessous.
Adapte impérativement ton analyse à la NATURE de cet appareil et à son enjeu de sécurité spécifique.

**Analyse** : l'hypothèse la plus probable, en tenant compte du type d'appareil et du pattern. 2 phrases max.

**Risque** : l'impact concret pour CE type d'appareil précis. 1 phrase.

**Recommandation** : UNE action prioritaire concrète. 1 phrase.

Reste factuel et concis. Pas de listes à puces, pas d'introduction."""

    message = client.messages.create(
        model=MODEL,
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}]
    )

    return message.content[0].text