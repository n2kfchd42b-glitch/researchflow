from typing import Dict, Any, List
import re

DHS_VARIABLES = {
    'v001': 'Cluster number',
    'v002': 'Household number',
    'v003': 'Respondent line number',
    'v005': 'Sample weight',
    'v007': 'Year of interview',
    'v012': 'Age of respondent',
    'v013': 'Age in 5-year groups',
    'v025': 'Type of residence (urban/rural)',
    'v024': 'Region',
    'v106': 'Education level',
    'v107': 'Literacy',
    'v130': 'Religion',
    'v151': 'Sex of household head',
    'v152': 'Age of household head',
    'v190': 'Wealth index',
    'v201': 'Total children ever born',
    'v212': 'Age at first birth',
    'v213': 'Currently pregnant',
    'v218': 'Number of living children',
    'v228': 'Ever had a terminated pregnancy',
    'v301': 'Knowledge of any method of contraception',
    'v302': 'Knowledge of any modern method',
    'v312': 'Current contraceptive method',
    'v313': 'Current use of contraception',
    'v393': 'Visited health facility in last 12 months',
    'v394': 'Number of visits to health facility',
    'b4':   'Sex of child',
    'b5':   'Child is alive',
    'b7':   'Age at death in months',
    'h1':   'Child has health card',
    'h2':   'Received BCG vaccination',
    'h3':   'Received DPT vaccination',
    'h9':   'Received measles vaccination',
    'hw1':  'Child age in months',
    'hw2':  'Child weight in kg',
    'hw3':  'Child height in cm',
    'hw70': 'Height for age (HAZ)',
    'hw71': 'Weight for age (WAZ)',
    'hw72': 'Weight for height (WHZ)',
    's119': 'HIV test result',
}

MICS_VARIABLES = {
    'hh1':   'Cluster number',
    'hh2':   'Household number',
    'ln':    'Line number',
    'wm7':   'Age of woman',
    'wm6':   'Date of interview',
    'wm14':  'Highest level of education',
    'wm16':  'Attended school',
    'cm1':   'Ever given birth',
    'cm8':   'Children ever born',
    'cm13':  'Children surviving',
    'undr5': 'Under 5 child',
    'cage':  'Child age in months',
    'csex':  'Sex of child',
    'cfever':'Child had fever',
    'cdiar': 'Child had diarrhoea',
    'ccough':'Child had cough',
    'itn':   'Slept under insecticide treated net',
    'mspf':  'Maternal and newborn health',
    'windex5': 'Wealth index quintile',
}

STEPS_VARIABLES = {
    'age':          'Age of participant',
    'sex':          'Sex of participant',
    'q1':           'Age group',
    'q2':           'Sex',
    'q3':           'Education level',
    'q4':           'Employment status',
    'q5':           'Marital status',
    'tobacco':      'Tobacco use',
    'q10':          'Smokes cigarettes daily',
    'q11':          'Number of cigarettes per day',
    'alcohol':      'Alcohol consumption',
    'q22':          'Drinks alcohol',
    'q23':          'Number of drinking days per week',
    'diet':         'Dietary habits',
    'q31':          'Fruit consumption per day',
    'q32':          'Vegetable consumption per day',
    'pa':           'Physical activity',
    'q36':          'Vigorous physical activity',
    'q37':          'Minutes of vigorous activity',
    'bmi':          'Body mass index',
    'weight':       'Weight in kg',
    'height':       'Height in cm',
    'waist':        'Waist circumference',
    'bp1':          'Systolic blood pressure reading 1',
    'bp2':          'Diastolic blood pressure reading 1',
    'glucose':      'Fasting blood glucose',
    'cholesterol':  'Total cholesterol',
    'hypertension': 'Diagnosed with hypertension',
    'diabetes':     'Diagnosed with diabetes',
}

GENERIC_HEALTH_PATTERNS = {
    'age':          ('demographic', 'Age of participant'),
    'sex':          ('demographic', 'Sex of participant'),
    'gender':       ('demographic', 'Gender of participant'),
    'weight':       ('anthropometric', 'Weight in kg'),
    'height':       ('anthropometric', 'Height in cm'),
    'bmi':          ('anthropometric', 'Body mass index'),
    'muac':         ('anthropometric', 'Mid upper arm circumference'),
    'outcome':      ('outcome', 'Primary study outcome'),
    'death':        ('outcome', 'Mortality outcome'),
    'died':         ('outcome', 'Death indicator'),
    'survival':     ('outcome', 'Survival outcome'),
    'recovered':    ('outcome', 'Recovery outcome'),
    'treatment':    ('exposure', 'Treatment assignment'),
    'intervention': ('exposure', 'Intervention assignment'),
    'control':      ('exposure', 'Control group indicator'),
    'district':     ('location', 'Administrative district'),
    'region':       ('location', 'Administrative region'),
    'province':     ('location', 'Province'),
    'facility':     ('location', 'Health facility'),
    'education':    ('socioeconomic', 'Education level'),
    'income':       ('socioeconomic', 'Household income'),
    'wealth':       ('socioeconomic', 'Wealth index'),
    'hiv':          ('clinical', 'HIV status'),
    'malaria':      ('clinical', 'Malaria diagnosis'),
    'fever':        ('clinical', 'Fever symptom'),
    'diarrhoea':    ('clinical', 'Diarrhoea symptom'),
    'anaemia':      ('clinical', 'Anaemia status'),
    'muac':         ('clinical', 'Mid upper arm circumference'),
    'days':         ('time', 'Duration in days'),
    'months':       ('time', 'Duration in months'),
    'date':         ('time', 'Date variable'),
    'follow_up':    ('time', 'Follow-up period'),
}

SURVEY_SIGNATURES = {
    'DHS': {
        'required': ['v001', 'v002', 'v005', 'v012', 'v025'],
        'optional': ['v190', 'v106', 'b5', 'h2', 'hw70'],
        'description': 'Demographic and Health Survey (DHS)',
        'website': 'https://dhsprogram.com',
        'analysis_notes': 'Use DHS survey weights (v005/1000000) for all analyses. Account for complex survey design with cluster (v001) and stratum.',
    },
    'MICS': {
        'required': ['hh1', 'hh2', 'wm7', 'wm14'],
        'optional': ['windex5', 'cage', 'csex', 'itn'],
        'description': 'Multiple Indicator Cluster Survey (MICS)',
        'website': 'https://mics.unicef.org',
        'analysis_notes': 'Use MICS sampling weights for nationally representative estimates. Account for cluster design.',
    },
    'STEPS': {
        'required': ['age', 'sex', 'bmi', 'bp1'],
        'optional': ['tobacco', 'alcohol', 'glucose', 'cholesterol'],
        'description': 'WHO STEPS Survey',
        'website': 'https://www.who.int/teams/noncommunicable-diseases/surveillance/systems-tools/steps',
        'analysis_notes': 'STEPS surveys use age-standardisation for NCD prevalence estimates. Compare against WHO reference population.',
    },
}

def recognize_instrument(columns: List[str]) -> Dict[str, Any]:
    cols_lower = [c.lower().strip() for c in columns]
    cols_set   = set(cols_lower)

    detected_survey  = None
    survey_confidence = 0

    for survey_name, signature in SURVEY_SIGNATURES.items():
        required_matches = sum(1 for r in signature['required'] if r.lower() in cols_set)
        optional_matches = sum(1 for o in signature['optional'] if o.lower() in cols_set)
        total_required   = len(signature['required'])
        confidence = (required_matches / total_required) * 70 + min(optional_matches * 5, 30)
        if confidence > survey_confidence and required_matches >= 2:
            survey_confidence = confidence
            detected_survey   = survey_name

    variable_labels  = {}
    variable_categories = {}

    if detected_survey == 'DHS':
        variable_dict = DHS_VARIABLES
    elif detected_survey == 'MICS':
        variable_dict = MICS_VARIABLES
    elif detected_survey == 'STEPS':
        variable_dict = STEPS_VARIABLES
    else:
        variable_dict = {}

    for col in columns:
        col_lower = col.lower().strip()
        if col_lower in variable_dict:
            variable_labels[col]     = variable_dict[col_lower]
            variable_categories[col] = 'survey_variable'
        else:
            for pattern, (category, label) in GENERIC_HEALTH_PATTERNS.items():
                if pattern in col_lower:
                    variable_labels[col]     = label
                    variable_categories[col] = category
                    break

    suggested_outcomes   = [col for col, cat in variable_categories.items() if cat == 'outcome']
    suggested_predictors = [col for col, cat in variable_categories.items() if cat in ['demographic', 'exposure', 'socioeconomic', 'clinical']]

    survey_info = None
    if detected_survey:
        survey_info = {
            'name':           detected_survey,
            'description':    SURVEY_SIGNATURES[detected_survey]['description'],
            'confidence':     round(survey_confidence),
            'website':        SURVEY_SIGNATURES[detected_survey]['website'],
            'analysis_notes': SURVEY_SIGNATURES[detected_survey]['analysis_notes'],
        }

    unrecognized = [col for col in columns if col not in variable_labels]

    return {
        'detected_survey':       detected_survey,
        'survey_info':           survey_info,
        'variable_labels':       variable_labels,
        'variable_categories':   variable_categories,
        'suggested_outcomes':    suggested_outcomes,
        'suggested_predictors':  suggested_predictors,
        'unrecognized_columns':  unrecognized,
        'recognition_rate':      round(len(variable_labels) / len(columns) * 100) if columns else 0,
        'total_columns':         len(columns),
        'labeled_columns':       len(variable_labels),
    }
