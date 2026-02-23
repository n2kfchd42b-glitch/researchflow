from datetime import datetime
import uuid

# In-memory store for methodology templates
templates_db: dict = {}

def save_template(
    name: str,
    description: str,
    study_type: str,
    outcome_column: str,
    predictor_columns: list,
    research_question: str,
    user_email: str,
    organisation: str = "",
    is_public: bool = False
) -> dict:
    template_id = str(uuid.uuid4())[:8]
    template = {
        "id":                template_id,
        "name":              name,
        "description":       description,
        "study_type":        study_type,
        "outcome_column":    outcome_column,
        "predictor_columns": predictor_columns,
        "research_question": research_question,
        "user_email":        user_email,
        "organisation":      organisation,
        "is_public":         is_public,
        "created_at":        datetime.utcnow().isoformat(),
        "use_count":         0,
    }
    templates_db[template_id] = template
    return template

def get_templates(user_email: str, organisation: str = "") -> list:
    results = []
    for t in templates_db.values():
        if t["user_email"] == user_email:
            results.append(t)
        elif t["is_public"]:
            results.append(t)
        elif organisation and t["organisation"] == organisation:
            results.append(t)
    return sorted(results, key=lambda x: x["created_at"], reverse=True)

def get_template(template_id: str) -> dict:
    template = templates_db.get(template_id)
    if not template:
        raise ValueError("Template not found")
    templates_db[template_id]["use_count"] += 1
    return template

def delete_template(template_id: str, user_email: str) -> bool:
    template = templates_db.get(template_id)
    if not template:
        raise ValueError("Template not found")
    if template["user_email"] != user_email:
        raise ValueError("Not authorised to delete this template")
    del templates_db[template_id]
    return True

def get_community_templates() -> list:
    public = [t for t in templates_db.values() if t["is_public"]]
    return sorted(public, key=lambda x: x["use_count"], reverse=True)
