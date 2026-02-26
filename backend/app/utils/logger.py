import logging
from datetime import datetime

logger = logging.getLogger("analysis_logger")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('[%(asctime)s] %(levelname)s %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

def log_analysis(project_id, dataset_version_id, analysis_type, status, error=None):
    msg = {
        "timestamp": datetime.utcnow().isoformat(),
        "project_id": project_id,
        "dataset_version_id": dataset_version_id,
        "analysis_type": analysis_type,
        "status": status,
        "error": error
    }
    logger.info(msg)
