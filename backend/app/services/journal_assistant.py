from typing import Dict, Any, List

CONSORT_ITEMS = [
    {"id": "1a",  "section": "Title",        "item": "Identification as RCT in title"},
    {"id": "1b",  "section": "Abstract",     "item": "Structured summary of trial design, methods, results and conclusions"},
    {"id": "2a",  "section": "Background",   "item": "Scientific background and rationale"},
    {"id": "2b",  "section": "Background",   "item": "Specific objectives or hypotheses"},
    {"id": "3a",  "section": "Methods",      "item": "Description of trial design including allocation ratio"},
    {"id": "3b",  "section": "Methods",      "item": "Important changes to methods after trial commencement"},
    {"id": "4a",  "section": "Methods",      "item": "Eligibility criteria for participants"},
    {"id": "4b",  "section": "Methods",      "item": "Settings and locations where data collected"},
    {"id": "5",   "section": "Methods",      "item": "Interventions for each group with sufficient detail"},
    {"id": "6a",  "section": "Methods",      "item": "Primary and secondary outcome measures"},
    {"id": "6b",  "section": "Methods",      "item": "Changes to outcomes after trial commenced"},
    {"id": "7a",  "section": "Methods",      "item": "Sample size determination"},
    {"id": "7b",  "section": "Methods",      "item": "Interim analyses and stopping guidelines"},
    {"id": "8a",  "section": "Methods",      "item": "Method of randomisation sequence generation"},
    {"id": "9",   "section": "Methods",      "item": "Mechanism of allocation concealment"},
    {"id": "10",  "section": "Methods",      "item": "Who generated the sequence and enrolled participants"},
    {"id": "11a", "section": "Methods",      "item": "Blinding of participants, providers and assessors"},
    {"id": "12a", "section": "Methods",      "item": "Statistical methods for primary and secondary outcomes"},
    {"id": "13a", "section": "Results",      "item": "Participant flow diagram"},
    {"id": "14a", "section": "Results",      "item": "Dates defining periods of recruitment and follow-up"},
    {"id": "15",  "section": "Results",      "item": "Baseline demographic and clinical characteristics"},
    {"id": "16",  "section": "Results",      "item": "Number analysed in each group"},
    {"id": "17a", "section": "Results",      "item": "Outcome results for each group and effect size with CI"},
    {"id": "19",  "section": "Results",      "item": "All important harms or unintended effects"},
    {"id": "20",  "section": "Discussion",   "item": "Trial limitations addressing sources of bias"},
    {"id": "21",  "section": "Discussion",   "item": "Generalisability of trial findings"},
    {"id": "22",  "section": "Discussion",   "item": "Interpretation consistent with results"},
    {"id": "23",  "section": "Other",        "item": "Registration number and name of trial registry"},
    {"id": "24",  "section": "Other",        "item": "Where the protocol can be accessed"},
    {"id": "25",  "section": "Other",        "item": "Sources of funding and role of funders"},
]

STROBE_ITEMS = [
    {"id": "1",   "section": "Title",        "item": "Indicate study design in title or abstract"},
    {"id": "2",   "section": "Abstract",     "item": "Informative abstract summarising what was done and found"},
    {"id": "3",   "section": "Background",   "item": "Explain scientific background and rationale"},
    {"id": "4",   "section": "Objectives",   "item": "State specific objectives including hypotheses"},
    {"id": "5",   "section": "Methods",      "item": "Present key elements of study design"},
    {"id": "6",   "section": "Methods",      "item": "Describe setting, locations and dates"},
    {"id": "7",   "section": "Methods",      "item": "Eligibility criteria and sources of participants"},
    {"id": "8",   "section": "Methods",      "item": "Clearly define all outcomes, exposures, predictors"},
    {"id": "9",   "section": "Methods",      "item": "Describe data sources and measurement methods"},
    {"id": "10",  "section": "Methods",      "item": "Describe efforts to address potential sources of bias"},
    {"id": "11",  "section": "Methods",      "item": "Explain how study size was determined"},
    {"id": "12",  "section": "Methods",      "item": "Explain how quantitative variables were handled"},
    {"id": "13",  "section": "Methods",      "item": "Describe all statistical methods including confounding control"},
    {"id": "14",  "section": "Results",      "item": "Report numbers at each stage of study"},
    {"id": "15",  "section": "Results",      "item": "Report characteristics of study participants"},
    {"id": "16",  "section": "Results",      "item": "Report numbers of outcome events or summary measures"},
    {"id": "17",  "section": "Results",      "item": "Report unadjusted and adjusted estimates with CI"},
    {"id": "18",  "section": "Results",      "item": "Report other analyses performed"},
    {"id": "19",  "section": "Discussion",   "item": "Summarise key results with reference to objectives"},
    {"id": "20",  "section": "Discussion",   "item": "Discuss limitations considering sources of bias"},
    {"id": "21",  "section": "Discussion",   "item": "Discuss generalisability of study results"},
    {"id": "22",  "section": "Discussion",   "item": "Give cautious interpretation of results"},
    {"id": "23",  "section": "Other",        "item": "Funding source and role of funders"},
]

JOURNAL_DATABASE = [
    {"name": "PLOS Medicine",               "impact": 10.5, "focus": ["global health", "rct", "cohort", "epidemiology"], "open_access": True,  "turnaround": "6-8 weeks"},
    {"name": "BMC Public Health",            "impact": 4.1,  "focus": ["public health", "epidemiology", "cross_sectional"], "open_access": True,  "turnaround": "4-6 weeks"},
    {"name": "Lancet Global Health",         "impact": 28.0, "focus": ["global health", "rct", "mortality"], "open_access": True,  "turnaround": "8-12 weeks"},
    {"name": "Global Health Action",         "impact": 3.2,  "focus": ["global health", "africa", "lmic"], "open_access": True,  "turnaround": "6-8 weeks"},
    {"name": "Tropical Medicine & International Health", "impact": 3.5, "focus": ["tropical", "africa", "malaria", "hiv"], "open_access": False, "turnaround": "6-10 weeks"},
    {"name": "BMJ Global Health",            "impact": 7.1,  "focus": ["global health", "lmic", "intervention"], "open_access": True,  "turnaround": "6-8 weeks"},
    {"name": "International Journal of Epidemiology", "impact": 7.7, "focus": ["epidemiology", "cohort", "case_control"], "open_access": False, "turnaround": "8-12 weeks"},
    {"name": "Epidemiology & Infection",     "impact": 2.8,  "focus": ["infectious disease", "epidemiology"], "open_access": False, "turnaround": "4-6 weeks"},
    {"name": "American Journal of Epidemiology", "impact": 5.8, "focus": ["epidemiology", "cohort", "case_control"], "open_access": False, "turnaround": "8-12 weeks"},
    {"name": "Health Policy and Planning",   "impact": 3.9,  "focus": ["health policy", "lmic", "global health"], "open_access": False, "turnaround": "6-10 weeks"},
]

def generate_methods_section(
    study_design: str,
    outcome_col: str,
    predictor_cols: List[str],
    n_participants: int,
    setting: str = "sub-Saharan Africa",
    statistical_test: str = "logistic regression",
    study_period: str = "2020-2023",
) -> str:
    design_text = {
        'retrospective_cohort': 'retrospective cohort study',
        'prospective_cohort':   'prospective cohort study',
        'case_control':         'case-control study',
        'cross_sectional':      'cross-sectional study',
        'rct':                  'randomised controlled trial',
        'observational':        'observational study',
    }.get(study_design, 'observational study')

    predictors_text = ', '.join(predictor_cols[:-1]) + f' and {predictor_cols[-1]}' if len(predictor_cols) > 1 else predictor_cols[0] if predictor_cols else 'selected variables'

    methods = f"""**Study Design and Setting**

We conducted a {design_text} in {setting} during the period {study_period}. 
Ethical approval was obtained from the relevant institutional review board prior to data collection.

**Participants**

A total of {n_participants} participants were included in this analysis. 
Inclusion criteria comprised all eligible individuals with complete data on the primary outcome and key covariates. 
Participants with missing data on primary variables were excluded from the main analysis.

**Variables**

The primary outcome was {outcome_col}, defined as [insert definition here]. 
Exposure variables and covariates included {predictors_text}. 
These variables were collected through [insert data source: routine health records / survey / clinical records].

**Statistical Analysis**

Descriptive statistics were presented as means with standard deviations for continuous variables 
and frequencies with percentages for categorical variables. 
{statistical_test.title()} was used to examine the association between the exposure variables and {outcome_col}, 
adjusting for potential confounders including {predictors_text}. 
Results are presented as odds ratios (OR) with 95% confidence intervals (CI) and corresponding p-values. 
Statistical significance was defined as p < 0.05. 
All analyses were conducted using ResearchFlow v0.1.0 (Anthropic, 2025).

**Missing Data**

Missing data were assessed for all variables. Variables with more than 30% missing data were excluded. 
For variables with less than 30% missing, [complete case analysis / multiple imputation] was performed.
"""
    return methods.strip()

def suggest_journals(study_design: str, research_question: str, open_access_only: bool = False) -> List[Dict]:
    rq_lower = research_question.lower()
    scored = []
    for journal in JOURNAL_DATABASE:
        score = 0
        if open_access_only and not journal['open_access']:
            continue
        for keyword in journal['focus']:
            if keyword in rq_lower or keyword == study_design:
                score += 20
        if 'africa' in rq_lower or 'lmic' in rq_lower or 'tanzania' in rq_lower or 'kenya' in rq_lower:
            if 'africa' in journal['focus'] or 'lmic' in journal['focus'] or 'global health' in journal['focus']:
                score += 15
        if study_design in journal['focus']:
            score += 10
        score += min(journal['impact'] * 2, 20)
        scored.append((score, journal))
    scored.sort(reverse=True)
    return [j for _, j in scored[:5]]

def generate_checklist(study_design: str) -> List[Dict]:
    if study_design == 'rct':
        return CONSORT_ITEMS
    else:
        return STROBE_ITEMS

def get_journal_package(
    study_design: str,
    outcome_col: str,
    predictor_cols: List[str],
    n_participants: int,
    research_question: str,
    statistical_test: str = 'logistic regression',
    setting: str = 'sub-Saharan Africa',
    open_access_only: bool = False,
) -> Dict[str, Any]:
    methods = generate_methods_section(
        study_design, outcome_col, predictor_cols,
        n_participants, setting, statistical_test
    )
    journals   = suggest_journals(study_design, research_question, open_access_only)
    checklist  = generate_checklist(study_design)
    guideline  = 'CONSORT' if study_design == 'rct' else 'STROBE'

    return {
        'methods_section': methods,
        'journals':        journals,
        'checklist':       checklist,
        'guideline':       guideline,
        'study_design':    study_design,
        'n_participants':  n_participants,
        'word_count':      len(methods.split()),
    }
