import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple

class DataIngestionEngine:

    SUPPORTED_FORMATS = [".csv", ".xlsx", ".xls", ".sav", ".dta"]

    def __init__(self):
        self.audit_log = []

    def log(self, step, detail, status="ok"):
        self.audit_log.append({
            "step": step,
            "detail": detail,
            "status": status
        })

    def ingest(self, filepath: str) -> Tuple[pd.DataFrame, Dict]:
        self.audit_log = []
        path = Path(filepath)
        suffix = path.suffix.lower()

        if suffix not in self.SUPPORTED_FORMATS:
            raise ValueError(f"Unsupported format: {suffix}")

        self.log("load", f"Loading {suffix} file: {path.name}")
        df = self._load_file(filepath, suffix)
        self.log("load", f"Loaded {len(df)} rows, {len(df.columns)} columns")

        quality_report = self._profile(df)
        quality_report["column_types"] = self._detect_types(df)
        quality_report["issues"] = self._flag_issues(df, quality_report)
        quality_report["audit_log"] = self.audit_log

        return df, quality_report

    def _load_file(self, filepath, suffix):
        loaders = {
            ".csv":  lambda f: pd.read_csv(f),
            ".xlsx": lambda f: pd.read_excel(f),
            ".xls":  lambda f: pd.read_excel(f),
            ".sav":  lambda f: pd.read_spss(f),
            ".dta":  lambda f: pd.read_stata(f),
        }
        return loaders[suffix](filepath)

    def _profile(self, df):
        self.log("profile", "Profiling dataset")
        profile = {
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": list(df.columns),
            "missing_values": {},
            "missing_percentage": {},
            "numeric_summary": {},
        }
        for col in df.columns:
            missing = df[col].isna().sum()
            profile["missing_values"][col] = int(missing)
            profile["missing_percentage"][col] = round(
                float(missing / len(df) * 100), 2
            )
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            profile["numeric_summary"][col] = {
                "mean":   round(float(df[col].mean()), 4),
                "std":    round(float(df[col].std()), 4),
                "min":    round(float(df[col].min()), 4),
                "max":    round(float(df[col].max()), 4),
                "median": round(float(df[col].median()), 4),
            }
        return profile

    def _detect_types(self, df):
        self.log("type_detection", "Detecting column types")
        types = {}
        for col in df.columns:
            col_lower = col.lower()
            if df[col].dtype in [np.int64, np.float64]:
                unique_ratio = df[col].nunique() / len(df)
                types[col] = "categorical" if unique_ratio < 0.05 else "continuous"
            elif df[col].dtype == object:
                types[col] = "categorical" if df[col].nunique() < 15 else "text"
            else:
                types[col] = "other"
            if any(k in col_lower for k in ["date","dob","birth","admit"]):
                types[col] = "date"
            if any(k in col_lower for k in ["id","patient","subject"]):
                types[col] = "identifier"
            if any(k in col_lower for k in ["outcome","death","died","event"]):
                types[col] = "outcome"
            if any(k in col_lower for k in ["age","weight","height","bmi"]):
                types[col] = "clinical_continuous"
            if any(k in col_lower for k in ["sex","gender","district","facility"]):
                types[col] = "demographic_categorical"
        return types

    def _flag_issues(self, df, profile):
        self.log("validation", "Running quality checks")
        issues = []
        for col, pct in profile["missing_percentage"].items():
            if pct > 20:
                issues.append({
                    "type": "high_missing",
                    "column": col,
                    "severity": "warning" if pct < 50 else "critical",
                    "message": f"{col} has {pct}% missing values",
                    "recommendation": "Consider imputation or exclusion"
                })
        dup_count = int(df.duplicated().sum())
        if dup_count > 0:
            issues.append({
                "type": "duplicates",
                "column": "all",
                "severity": "warning",
                "message": f"{dup_count} duplicate rows detected",
                "recommendation": "Remove duplicates before analysis"
            })
        if len(df) < 30:
            issues.append({
                "type": "small_sample",
                "column": "all",
                "severity": "critical",
                "message": f"Only {len(df)} observations",
                "recommendation": "Most models require n >= 30"
            })
        return issues

    def clean(self, df, instructions):
        report = {"steps_applied": []}
        df_clean = df.copy()
        if instructions.get("drop_duplicates"):
            before = len(df_clean)
            df_clean = df_clean.drop_duplicates()
            report["steps_applied"].append(
                f"Removed {before - len(df_clean)} duplicates"
            )
        for col in instructions.get("drop_columns", []):
            if col in df_clean.columns:
                df_clean = df_clean.drop(columns=[col])
                report["steps_applied"].append(f"Dropped column: {col}")
        for col, method in instructions.get("fill_missing", {}).items():
            if col in df_clean.columns:
                if method == "mean":
                    df_clean[col] = df_clean[col].fillna(df_clean[col].mean())
                elif method == "median":
                    df_clean[col] = df_clean[col].fillna(df_clean[col].median())
                elif method == "mode":
                    df_clean[col] = df_clean[col].fillna(df_clean[col].mode()[0])
                report["steps_applied"].append(
                    f"Filled {col} missing values using {method}"
                )
        report["rows_after"] = len(df_clean)
        return df_clean, report
