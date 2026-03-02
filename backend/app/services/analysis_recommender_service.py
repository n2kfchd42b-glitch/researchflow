import json
import os
from typing import Any, Dict, List

SYSTEM_PROMPT = (
    "You are a biostatistics expert advising a health researcher. "
    "Based on the study details provided, recommend the most appropriate "
    "statistical analyses. For each recommended analysis:\n"
    "- Explain WHY it is appropriate for this specific study\n"
    "- Note any assumptions the researcher must check\n"
    "- Flag any concerns about sample size, variable types, or study design\n"
    "- Indicate whether it is ESSENTIAL or SUPPLEMENTARY\n\n"
    "Respond ONLY in valid JSON. No preamble, no markdown."
)

VALID_FEATURE_KEYS = [
    "descriptive_stats",
    "chi_square",
    "logistic_regression",
    "linear_regression",
    "survival_analysis",
    "mann_whitney",
    "t_test",
    "correlation",
    "meta_analysis",
    "kruskal_wallis",
    "anova",
    "cox_regression",
]


def generate_recommendations(
    research_question: str,
    exposure_variable: Dict[str, str],
    outcome_variable: Dict[str, str],
    study_design: str,
    dataset_summary: Dict[str, Any],
) -> Dict[str, Any]:
    import anthropic  # type: ignore

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY not configured in server environment")

    client = anthropic.Anthropic(api_key=api_key)

    confounders_list: List[str] = dataset_summary.get("potential_confounders", [])
    confounders = ", ".join(confounders_list[:10]) if confounders_list else "none specified"

    user_message = (
        f"Study details:\n"
        f"- Research question: {research_question}\n"
        f"- Exposure: {exposure_variable['name']} ({exposure_variable['type']})\n"
        f"- Outcome: {outcome_variable['name']} ({outcome_variable['type']})\n"
        f"- Study design: {study_design}\n"
        f"- Sample size: {dataset_summary.get('n_rows', 'unknown')} observations\n"
        f"- Missing data present: {dataset_summary.get('has_missing_data', False)}\n"
        f"- Potential confounders available: {confounders}\n\n"
        f"Recommend appropriate statistical analyses. "
        f"Use only these feature_key values: {', '.join(VALID_FEATURE_KEYS)}.\n"
        f"Return JSON with this exact schema:\n"
        f"{{\n"
        f'  "summary": "1-2 sentence plain-English summary",\n'
        f'  "recommendations": [\n'
        f"    {{\n"
        f'      "analysis_name": "Name",\n'
        f'      "priority": "essential" or "supplementary",\n'
        f'      "reason": "Why appropriate for this study",\n'
        f'      "assumptions": ["assumption1", "assumption2"],\n'
        f'      "warnings": ["warning if any"],\n'
        f'      "feature_key": "one of the feature keys listed above"\n'
        f"    }}\n"
        f"  ],\n"
        f'  "missing_data_note": "note about missing data or null",\n'
        f'  "sample_size_note": "note about sample size or null"\n'
        f"}}"
    )

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    response_text = message.content[0].text.strip()

    # Strip markdown code fences if Claude wrapped the JSON
    if response_text.startswith("```"):
        lines = response_text.split("\n")
        response_text = "\n".join(lines[1:-1])

    return json.loads(response_text)


def generate_fallback_recommendations(
    exposure_type: str,
    outcome_type: str,
    study_design: str,
) -> Dict[str, Any]:
    """Rule-based fallback when the Claude API is unavailable."""
    recs: List[Dict[str, Any]] = []

    if exposure_type == "categorical" and outcome_type == "categorical":
        recs = [
            {
                "analysis_name": "Chi-Square Test",
                "priority": "essential",
                "reason": "Both variables are categorical — chi-square tests association between them.",
                "assumptions": ["Expected cell count ≥ 5", "Independent observations"],
                "warnings": [],
                "feature_key": "chi_square",
            },
            {
                "analysis_name": "Logistic Regression",
                "priority": "supplementary",
                "reason": "Allows adjustment for confounders beyond bivariate analysis.",
                "assumptions": ["Binary outcome variable", "No severe multicollinearity"],
                "warnings": [],
                "feature_key": "logistic_regression",
            },
        ]
    elif exposure_type == "categorical" and outcome_type == "continuous":
        recs = [
            {
                "analysis_name": "Independent Samples t-test",
                "priority": "essential",
                "reason": "Comparing a continuous outcome between categorical groups.",
                "assumptions": ["Normally distributed outcome", "Equal variances"],
                "warnings": [],
                "feature_key": "t_test",
            },
            {
                "analysis_name": "Mann-Whitney U Test",
                "priority": "supplementary",
                "reason": "Non-parametric alternative if normality assumption is violated.",
                "assumptions": ["Independent observations"],
                "warnings": [],
                "feature_key": "mann_whitney",
            },
        ]
    elif exposure_type == "continuous" and outcome_type == "continuous":
        recs = [
            {
                "analysis_name": "Linear Regression",
                "priority": "essential",
                "reason": "Both exposure and outcome are continuous.",
                "assumptions": [
                    "Linearity",
                    "Normality of residuals",
                    "Homoscedasticity",
                ],
                "warnings": [],
                "feature_key": "linear_regression",
            },
            {
                "analysis_name": "Correlation Analysis",
                "priority": "supplementary",
                "reason": "Quantify the strength of the linear relationship.",
                "assumptions": ["Bivariate normality"],
                "warnings": [],
                "feature_key": "correlation",
            },
        ]
    else:
        recs = [
            {
                "analysis_name": "Logistic Regression",
                "priority": "essential",
                "reason": "Binary outcome — logistic regression estimates adjusted odds ratios.",
                "assumptions": ["Binary outcome variable", "Independent observations"],
                "warnings": [],
                "feature_key": "logistic_regression",
            }
        ]

    summary = (
        f"Based on your {study_design} study with {exposure_type} exposure "
        f"and {outcome_type} outcome, the following analyses are recommended."
    )

    return {
        "summary": summary,
        "recommendations": recs,
        "missing_data_note": None,
        "sample_size_note": None,
    }
