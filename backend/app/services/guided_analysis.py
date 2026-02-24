from typing import Dict, Any, List

TESTS = {
    'logistic_regression': {
        'name':        'Logistic Regression',
        'description': 'Models the probability of a binary outcome based on one or more predictors.',
        'when_to_use': 'Binary outcome (yes/no, alive/dead) with continuous or categorical predictors.',
        'assumptions': ['Binary outcome variable', 'Independent observations', 'No severe multicollinearity', 'Sample size ≥ 10 events per predictor'],
        'output':      'Odds Ratios with 95% CI and p-values',
        'citations':   'Hosmer & Lemeshow (2000). Applied Logistic Regression.',
    },
    'linear_regression': {
        'name':        'Multiple Linear Regression',
        'description': 'Models the relationship between a continuous outcome and multiple predictors.',
        'when_to_use': 'Continuous normally distributed outcome with continuous or categorical predictors.',
        'assumptions': ['Continuous outcome', 'Linearity', 'Normality of residuals', 'Homoscedasticity', 'No multicollinearity'],
        'output':      'Beta coefficients with 95% CI and p-values',
        'citations':   'Kutner et al. (2005). Applied Linear Statistical Models.',
    },
    'cox_regression': {
        'name':        'Cox Proportional Hazards Regression',
        'description': 'Models time-to-event data accounting for censored observations.',
        'when_to_use': 'Time-to-event outcome with censoring (survival data, time to death, recovery).',
        'assumptions': ['Proportional hazards assumption', 'Independent censoring', 'Time-varying covariates handled'],
        'output':      'Hazard Ratios with 95% CI and p-values',
        'citations':   'Cox (1972). Regression models and life tables.',
    },
    'poisson_regression': {
        'name':        'Poisson Regression',
        'description': 'Models count outcomes or rates, suitable for incidence rate ratios.',
        'when_to_use': 'Count outcome (number of events) or rate data in epidemiological studies.',
        'assumptions': ['Count outcome', 'Mean ≈ variance (or use negative binomial)', 'Independence of observations'],
        'output':      'Incidence Rate Ratios with 95% CI',
        'citations':   'Rothman et al. (2008). Modern Epidemiology.',
    },
    'chi_square': {
        'name':        'Chi-Square Test',
        'description': 'Tests association between two categorical variables.',
        'when_to_use': 'Both outcome and predictor are categorical. Simple bivariate analysis.',
        'assumptions': ['Categorical variables', 'Expected cell count ≥ 5', 'Independent observations'],
        'output':      'Chi-square statistic, p-value, Cramér\'s V',
        'citations':   'Pearson (1900). On the criterion that a given system of deviations.',
    },
    'kaplan_meier': {
        'name':        'Kaplan-Meier Survival Analysis',
        'description': 'Non-parametric method to estimate survival functions from time-to-event data.',
        'when_to_use': 'Time-to-event data where you want to compare survival between groups.',
        'assumptions': ['Independent censoring', 'Survival probabilities are the same for early and late recruits'],
        'output':      'Survival curves, median survival time, log-rank test p-value',
        'citations':   'Kaplan & Meier (1958). Nonparametric estimation from incomplete observations.',
    },
    'mixed_effects': {
        'name':        'Mixed Effects Logistic Regression',
        'description': 'Accounts for clustering or repeated measures in binary outcome data.',
        'when_to_use': 'Binary outcome with clustered data (patients within hospitals, students within schools).',
        'assumptions': ['Binary outcome', 'Clustered or nested data structure', 'Random effects are normally distributed'],
        'output':      'Fixed effects Odds Ratios, random effects variance',
        'citations':   'Raudenbush & Bryk (2002). Hierarchical Linear Models.',
    },
}

OUTCOME_TYPE_MAP = {
    'binary':      ['logistic_regression', 'chi_square', 'mixed_effects'],
    'continuous':  ['linear_regression'],
    'time_event':  ['cox_regression', 'kaplan_meier'],
    'count':       ['poisson_regression'],
    'categorical': ['chi_square'],
}

STUDY_DESIGN_ADJUSTMENTS = {
    'rct':                  {'boost': ['logistic_regression', 'linear_regression', 'cox_regression'], 'note': 'RCTs typically use intention-to-treat analysis.'},
    'retrospective_cohort': {'boost': ['logistic_regression', 'cox_regression'], 'note': 'Retrospective cohorts should adjust for confounders.'},
    'case_control':         {'boost': ['logistic_regression'], 'note': 'Case-control studies report Odds Ratios, not Risk Ratios.'},
    'cross_sectional':      {'boost': ['logistic_regression', 'chi_square'], 'note': 'Cross-sectional studies report Prevalence Ratios or Odds Ratios.'},
    'observational':        {'boost': ['logistic_regression'], 'note': 'Observational studies should address confounding.'},
}

def detect_outcome_type(outcome_col: str, column_types: Dict, numeric_summary: Dict) -> str:
    col_type = column_types.get(outcome_col, '').lower()
    if 'outcome' in col_type or 'binary' in col_type:
        return 'binary'
    if outcome_col in numeric_summary:
        stats = numeric_summary[outcome_col]
        unique_vals = stats.get('unique', 10)
        if unique_vals <= 2:
            return 'binary'
        return 'continuous'
    if 'time' in outcome_col.lower() or 'days' in outcome_col.lower() or 'survival' in outcome_col.lower():
        return 'time_event'
    if 'count' in outcome_col.lower() or 'n_' in outcome_col.lower():
        return 'count'
    return 'binary'

def recommend_tests(
    outcome_col: str,
    predictor_cols: List[str],
    study_design: str,
    column_types: Dict,
    numeric_summary: Dict,
    n_participants: int,
    research_question: str = '',
) -> Dict[str, Any]:

    outcome_type = detect_outcome_type(outcome_col, column_types, numeric_summary)

    rq_lower = research_question.lower()
    if 'time' in rq_lower or 'survival' in rq_lower or 'death' in rq_lower:
        outcome_type = 'time_event'
    elif 'count' in rq_lower or 'incidence rate' in rq_lower:
        outcome_type = 'count'
    elif 'association' in rq_lower or 'proportion' in rq_lower:
        outcome_type = 'binary'

    candidate_tests = OUTCOME_TYPE_MAP.get(outcome_type, ['logistic_regression'])

    design_info = STUDY_DESIGN_ADJUSTMENTS.get(study_design, {})
    boost = design_info.get('boost', [])
    design_note = design_info.get('note', '')

    ranked = []
    for test_id in candidate_tests:
        score = 50
        if test_id in boost:
            score += 30
        if n_participants < 30:
            if test_id == 'chi_square':
                score += 10
        if len(predictor_cols) > 5:
            if test_id in ['logistic_regression', 'linear_regression', 'cox_regression']:
                score += 10
        ranked.append((score, test_id))

    ranked.sort(reverse=True)

    primary_test_id   = ranked[0][1]
    secondary_test_id = ranked[1][1] if len(ranked) > 1 else None

    primary   = TESTS[primary_test_id].copy()
    secondary = TESTS[secondary_test_id].copy() if secondary_test_id else None

    warnings = []
    if n_participants < 30:
        warnings.append('Small sample size — statistical power may be limited.')
    if n_participants < 10 * len(predictor_cols):
        warnings.append(f'Rule of thumb: need ~{10 * len(predictor_cols)} participants for {len(predictor_cols)} predictors. Consider reducing predictors.')
    if len(predictor_cols) > 10:
        warnings.append('Many predictors selected — consider variable selection or penalised regression.')
    if study_design == 'case_control' and primary_test_id != 'logistic_regression':
        warnings.append('Case-control designs should use logistic regression to compute Odds Ratios.')

    checklist = [
        {'item': 'Outcome variable is appropriate for the selected test',  'check': True},
        {'item': 'Sample size is adequate for the number of predictors',   'check': n_participants >= 10 * len(predictor_cols)},
        {'item': 'Missing data has been addressed',                         'check': False},
        {'item': 'Confounders have been identified and included',           'check': len(predictor_cols) > 1},
        {'item': 'Study design matches the analysis approach',              'check': True},
    ]

    explanation = f"""
Based on your study design ({study_design.replace('_',' ')}) and outcome variable '{outcome_col}', 
we recommend {primary['name']}. {primary['description']}

Your research question involves {len(predictor_cols)} predictor variable(s) and {n_participants} participants.
{design_note}

{primary['name']} will produce {primary['output']}, allowing you to determine which predictors 
are independently associated with your outcome while controlling for the others.
""".strip()

    return {
        'outcome_type':      outcome_type,
        'primary_test':      {'id': primary_test_id, **primary},
        'secondary_test':    {'id': secondary_test_id, **secondary} if secondary else None,
        'all_candidates':    [{'id': t, **TESTS[t]} for _, t in ranked],
        'warnings':          warnings,
        'checklist':         checklist,
        'design_note':       design_note,
        'explanation':       explanation,
        'n_participants':    n_participants,
        'n_predictors':      len(predictor_cols),
    }
