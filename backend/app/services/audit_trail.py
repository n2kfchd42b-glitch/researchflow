from datetime import datetime
import uuid

audit_log: list = []

def log_event(
    user_email: str,
    action: str,
    details: dict,
    study_id: str = None,
    dataset_id: str = None,
):
    event = {
        "id":           str(uuid.uuid4())[:8].upper(),
        "timestamp":    datetime.utcnow().isoformat(),
        "user_email":   user_email,
        "action":       action,
        "details":      details,
        "study_id":     study_id,
        "dataset_id":   dataset_id,
    }
    audit_log.append(event)
    return event

def get_audit_log(user_email: str = None, study_id: str = None) -> list:
    logs = audit_log
    if user_email:
        logs = [e for e in logs if e["user_email"] == user_email]
    if study_id:
        logs = [e for e in logs if e["study_id"] == study_id]
    return sorted(logs, key=lambda x: x["timestamp"], reverse=True)

def get_reproducibility_report(study_id: str) -> dict:
    events  = get_audit_log(study_id=study_id)
    if not events:
        return {}
    report_id = "RF-REPRO-" + study_id[:8].upper()
    return {
        "report_id":    report_id,
        "study_id":     study_id,
        "generated_at": datetime.utcnow().isoformat(),
        "total_events": len(events),
        "events":       events,
        "summary": {
            "users":    list(set(e["user_email"] for e in events)),
            "actions":  list(set(e["action"] for e in events)),
            "start":    events[-1]["timestamp"] if events else None,
            "end":      events[0]["timestamp"]  if events else None,
        }
    }
