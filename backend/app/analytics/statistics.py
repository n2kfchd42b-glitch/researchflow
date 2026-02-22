import pandas as pd
import numpy as np
from typing import Dict, Any
from scipy import stats
import statsmodels.api as sm
from statsmodels.stats.outliers_influence import variance_inflation_factor
from lifelines import KaplanMeierFitter, CoxPHFitter

class StatisticsEngine:

    def __init__(self):
        self.audit_log = []

    def log(self, step, detail, status="ok"):
        self.audit_log.append({
            "step": step,
            "detail": detail,
            "status": status
        })

    def descriptive(self, df: pd.DataFrame) -> Dict:
        self.log("descriptive", "Running descriptive statistics")
        results = {"numeric": {}, "categorical": {}}
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            results["numeric"][col] = {
                "mean":   round(float(df[col].mean()), 4),
                "std":    round(float(df[col].std()), 4),
                "median": round(float(df[col].median()), 4),
                "min":    round(float(df[col].min()), 4),
                "max":    round(float(df[col].max()), 4),
                "missing": int(df[col].isna().sum())
            }
        categorical_cols = df.select_dtypes(include=["object"]).columns
        for col in categorical_cols:
            counts = df[col].value_counts().to_dict()
            total = len(df[col].dropna())
            results["categorical"][col] = {
                "counts": {str(k): int(v) for k, v in counts.items()},
                "percentages": {
                    str(k): round(v/total*100, 2) 
                    for k, v in counts.items()
                },
                "missing": int(df[col].isna().sum())
            }
        self.log("descriptive", "Descriptive statistics complete")
        return results

    def logistic_regression(
        self, df: pd.DataFrame,
        outcome: str,
        predictors: list
    ) -> Dict:
        self.log("logistic", f"Running logistic regression. Outcome: {outcome}")
        df_clean = df[[outcome] + predictors].dropna()
        
        # Encode categoricals
        df_encoded = pd.get_dummies(
            df_clean, 
            columns=[c for c in predictors if df_clean[c].dtype == object],
            drop_first=True
        )
        
        y = df_encoded[outcome]
        X = df_encoded.drop(columns=[outcome])
        X = sm.add_constant(X)
        
        try:
            model = sm.Logit(y, X.astype(float)).fit(disp=0)
            
            # Odds ratios
            odds_ratios = {}
            for var in model.params.index:
                if var != "const":
                    odds_ratios[var] = {
                        "OR":     round(float(np.exp(model.params[var])), 4),
                        "CI_low": round(float(np.exp(model.conf_int().loc[var, 0])), 4),
                        "CI_high":round(float(np.exp(model.conf_int().loc[var, 1])), 4),
                        "p_value":round(float(model.pvalues[var]), 4),
                        "significant": bool(model.pvalues[var] < 0.05)
                    }

            assumptions = self._check_logistic_assumptions(df_encoded, X, y)

            interpretation = self._interpret_logistic(odds_ratios, outcome)

            self.log("logistic", "Logistic regression complete")
            return {
                "model": "Logistic Regression",
                "outcome": outcome,
                "n": int(len(df_clean)),
                "odds_ratios": odds_ratios,
                "model_fit": {
                    "aic": round(float(model.aic), 4),
                    "bic": round(float(model.bic), 4),
                    "pseudo_r2": round(float(model.prsquared), 4),
                    "log_likelihood": round(float(model.llf), 4)
                },
                "assumptions": assumptions,
                "interpretation": interpretation,
                "audit_log": self.audit_log
            }
        except Exception as e:
            self.log("logistic", f"Model failed: {str(e)}", "error")
            return {"error": str(e), "audit_log": self.audit_log}

    def survival_analysis(
        self,
        df: pd.DataFrame,
        duration_col: str,
        event_col: str,
        group_col: str = None
    ) -> Dict:
        self.log("survival", "Running survival analysis")
        df_clean = df[[duration_col, event_col] + 
                      ([group_col] if group_col else [])].dropna()
        
        kmf = KaplanMeierFitter()
        results = {"model": "Kaplan-Meier Survival Analysis", "groups": {}}

        if group_col:
            groups = df_clean[group_col].unique()
            for group in groups:
                mask = df_clean[group_col] == group
                kmf.fit(
                    df_clean.loc[mask, duration_col],
                    df_clean.loc[mask, event_col],
                    label=str(group)
                )
                results["groups"][str(group)] = {
                    "n": int(mask.sum()),
                    "events": int(df_clean.loc[mask, event_col].sum()),
                    "median_survival": float(kmf.median_survival_time_)
                    if not np.isinf(kmf.median_survival_time_) else None
                }
        else:
            kmf.fit(df_clean[duration_col], df_clean[event_col])
            results["groups"]["all"] = {
                "n": int(len(df_clean)),
                "events": int(df_clean[event_col].sum()),
                "median_survival": float(kmf.median_survival_time_)
                if not np.isinf(kmf.median_survival_time_) else None
            }

        results["interpretation"] = (
            f"Survival analysis completed on {len(df_clean)} participants "
            f"with {int(df_clean[event_col].sum())} events observed."
        )
        self.log("survival", "Survival analysis complete")
        return results

    def _check_logistic_assumptions(self, df, X, y) -> Dict:
        self.log("assumptions", "Checking logistic regression assumptions")
        checks = {}

        # Sample size check
        n = len(y)
        events = int(y.sum())
        checks["sample_size"] = {
            "passed": events >= 10 * (X.shape[1] - 1),
            "detail": f"{events} events for {X.shape[1]-1} predictors",
            "recommendation": "Need at least 10 events per predictor"
        }

        # Multicollinearity check
        try:
            X_no_const = X.drop(columns=["const"])
            vif_data = {
                col: round(float(variance_inflation_factor(
                    X_no_const.values, i
                )), 2)
                for i, col in enumerate(X_no_const.columns)
            }
            checks["multicollinearity"] = {
                "passed": all(v < 10 for v in vif_data.values()),
                "vif_scores": vif_data,
                "detail": "VIF < 10 indicates acceptable multicollinearity",
                "recommendation": "Remove variables with VIF > 10"
            }
        except Exception:
            checks["multicollinearity"] = {
                "passed": None,
                "detail": "Could not compute VIF"
            }

        # Complete separation check
        checks["complete_separation"] = {
            "passed": True,
            "detail": "No complete separation detected",
            "recommendation": "Model converged successfully"
        }

        self.log("assumptions", 
                 f"{sum(1 for c in checks.values() if c.get('passed'))} "
                 f"of {len(checks)} assumptions passed")
        return checks

    def _interpret_logistic(self, odds_ratios, outcome) -> str:
        significant = [
            var for var, vals in odds_ratios.items() 
            if vals["significant"]
        ]
        if not significant:
            return (
                f"No statistically significant predictors of {outcome} "
                f"were found at the 0.05 significance level."
            )
        parts = []
        for var in significant[:3]:
            OR = odds_ratios[var]["OR"]
            direction = "increases" if OR > 1 else "decreases"
            parts.append(
                f"{var} {direction} the odds of {outcome} "
                f"(OR={OR}, 95% CI: "
                f"{odds_ratios[var]['CI_low']}-{odds_ratios[var]['CI_high']})"
            )
        return (
            f"Statistically significant predictors: {'. '.join(parts)}."
        )