import re
from typing import Dict, List, Any

OBJECTIVE_PATTERNS = [
    r'(?:primary\s+)?objective[s]?\s*(?:is|are|was|were)?\s*:?\s*([^.\n]{20,200})',
    r'(?:aim[s]?|purpose)\s*(?:of\s+this\s+study)?\s*(?:is|are|was|were)?\s*:?\s*([^.\n]{20,200})',
    r'this\s+study\s+(?:aims?|seeks?|intends?)\s+to\s+([^.\n]{20,200})',
    r'we\s+(?:aimed?|sought|hypothesize[d]?)\s+to\s+([^.\n]{20,200})',
]

HYPOTHESIS_PATTERNS = [
    r'hypothesi[sz]e[sd]?\s+that\s+([^.\n]{20,200})',
    r'(?:null\s+)?hypothesis\s*:?\s*([^.\n]{20,200})',
    r'we\s+(?:expected?|predicted?|assumed?)\s+that\s+([^.\n]{20,200})',
]

OUTCOME_KEYWORDS = [
    'primary outcome', 'secondary outcome', 'endpoint', 'primary endpoint',
    'outcome measure', 'dependent variable', 'outcome variable',
    'mortality', 'survival', 'recovery', 'incidence', 'prevalence',
    'blood pressure', 'weight', 'score', 'rate'
]

STUDY_DESIGN_PATTERNS = {
    'rct':                  [r'randomi[sz]ed\s+controlled', r'\bRCT\b', r'randomised\s+trial'],
    'retrospective_cohort': [r'retrospective\s+cohort', r'retrospective\s+study'],
    'prospective_cohort':   [r'prospective\s+cohort', r'prospective\s+study'],
    'case_control':         [r'case.control', r'case\s+control'],
    'cross_sectional':      [r'cross.sectional', r'cross\s+sectional', r'prevalence\s+study'],
    'observational':        [r'observational', r'descriptive\s+study'],
}

SAMPLE_SIZE_PATTERNS = [
    r'sample\s+size\s+of\s+(\d+)',
    r'(\d+)\s+participants',
    r'(\d+)\s+patients',
    r'(\d+)\s+subjects',
    r'n\s*=\s*(\d+)',
    r'total\s+of\s+(\d+)',
]

VARIABLE_PATTERNS = [
    r'(?:exposure|predictor|independent\s+variable)[s]?\s*(?:include[sd]?|were|are|:)\s*([^.\n]{10,150})',
    r'(?:covariate|confounder)[s]?\s*(?:include[sd]?|were|are|:)\s*([^.\n]{10,150})',
    r'we\s+(?:measured?|collected?|recorded?|assessed?)\s+([^.\n]{10,150})',
]

COMMON_VARIABLES = [
    'age', 'sex', 'gender', 'bmi', 'weight', 'height',
    'education', 'income', 'treatment', 'intervention',
    'duration', 'dose', 'follow.up', 'baseline',
    'blood pressure', 'temperature', 'outcome',
]

def extract_text_from_pdf_bytes(content: bytes) -> str:
    try:
        import io
        text_parts = []
        i = 0
        while i < len(content):
            if content[i:i+2] == b'BT':
                j = content.find(b'ET', i)
                if j > 0:
                    chunk = content[i:j].decode('latin-1', errors='ignore')
                    text_parts.append(chunk)
            i += 1
        raw = ' '.join(text_parts)
        cleaned = re.sub(r'\s+', ' ', re.sub(r'[^\x20-\x7E\n]', ' ', raw))
        return cleaned[:50000]
    except Exception:
        return ""

def extract_protocol(text: str) -> Dict[str, Any]:
    text_lower = text.lower()

    title = ""
    lines = text.split('\n')
    for line in lines[:20]:
        line = line.strip()
        if 10 < len(line) < 200 and not line.startswith('#'):
            title = line
            break

    objectives = []
    for pattern in OBJECTIVE_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        objectives.extend([m.strip() for m in matches[:2]])
    objectives = list(dict.fromkeys(objectives))[:3]

    hypotheses = []
    for pattern in HYPOTHESIS_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        hypotheses.extend([m.strip() for m in matches[:2]])
    hypotheses = list(dict.fromkeys(hypotheses))[:2]

    study_design = "observational"
    for design, patterns in STUDY_DESIGN_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                study_design = design
                break

    sample_size = None
    for pattern in SAMPLE_SIZE_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                n = int(match.group(1))
                if 10 < n < 100000:
                    sample_size = n
                    break
            except Exception:
                pass

    suggested_outcomes = []
    for keyword in OUTCOME_KEYWORDS:
        if keyword.lower() in text_lower:
            suggested_outcomes.append(keyword)
    suggested_outcomes = suggested_outcomes[:5]

    suggested_predictors = []
    for var in COMMON_VARIABLES:
        if re.search(r'\b' + var + r'\b', text_lower):
            suggested_predictors.append(var.replace('.', '_'))
    suggested_predictors = list(dict.fromkeys(suggested_predictors))[:8]

    var_sentences = []
    for pattern in VARIABLE_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        var_sentences.extend(matches[:2])

    confidence = 0
    if title:            confidence += 10
    if objectives:       confidence += 30
    if hypotheses:       confidence += 20
    if study_design != "observational": confidence += 20
    if sample_size:      confidence += 10
    if suggested_outcomes: confidence += 10

    return {
        "title":               title,
        "objectives":          objectives,
        "hypotheses":          hypotheses,
        "study_design":        study_design,
        "sample_size_target":  sample_size,
        "suggested_outcomes":  suggested_outcomes,
        "suggested_predictors": suggested_predictors,
        "variable_sentences":  var_sentences[:3],
        "extraction_confidence": confidence,
        "raw_text_preview":    text[:500],
    }

def parse_protocol_file(content: bytes, filename: str) -> Dict[str, Any]:
    ext = filename.lower().split('.')[-1]
    text = ""

    if ext == 'txt':
        text = content.decode('utf-8', errors='ignore')

    elif ext == 'pdf':
        try:
            import io
            text_chunks = []
            raw = content.decode('latin-1', errors='ignore')
            stream_pattern = re.compile(r'stream(.*?)endstream', re.DOTALL)
            for match in stream_pattern.finditer(raw):
                chunk = match.group(1)
                printable = re.sub(r'[^\x20-\x7E\n\t]', ' ', chunk)
                printable = re.sub(r'\s+', ' ', printable)
                if len(printable.strip()) > 20:
                    text_chunks.append(printable.strip())
            text = ' '.join(text_chunks)[:50000]
        except Exception as e:
            text = f"Could not parse PDF: {str(e)}"

    elif ext in ['doc', 'docx']:
        try:
            import zipfile
            import io
            from xml.etree import ElementTree as ET
            zf = zipfile.ZipFile(io.BytesIO(content))
            xml = zf.read('word/document.xml')
            tree = ET.fromstring(xml)
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            texts = [node.text for node in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
            text = ' '.join(texts)
        except Exception as e:
            text = f"Could not parse document: {str(e)}"

    if not text or len(text.strip()) < 50:
        return {
            "title": filename,
            "objectives": [],
            "hypotheses": [],
            "study_design": "observational",
            "sample_size_target": None,
            "suggested_outcomes": [],
            "suggested_predictors": [],
            "variable_sentences": [],
            "extraction_confidence": 0,
            "error": "Could not extract text from file. Try uploading a .txt version.",
            "raw_text_preview": text[:200],
        }

    return extract_protocol(text)
