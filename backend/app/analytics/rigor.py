from typing import Dict

class RigorScoreEngine:

    def score(self, quality_report: dict, analysis_result: dict) -> Dict:
        
        data_quality = self._score_data_quality(quality_report)
        methodology  = self._score_methodology(analysis_result)
        assumptions  = self._score_assumptions(analysis_result)
        reporting    = self._score_reporting(analysis_result)

        overall = round(
            data_quality["score"] +
            methodology["score"] +
            assumptions["score"] +
            reporting["score"], 1
        )

        grade = (
            "Excellent" if overall >= 80 else
            "Good"      if overall >= 65 else
            "Fair"      if overall >= 50 else
            "Poor"
        )

        return {
            "overall_score": overall,
            "grade": grade,
            "max_score": 100,
            "breakdown": {
                "data_quality": data_quality,
                "methodology":  methodology,
                "assumptions":  assumptions,
                "reporting":    reporting
            },
            "recommendations": self._recommendations(
                data_quality, methodology, assumptions, reporting
            ),
            "summary": (
                f"ResearchFlow Rigor Score: {overall}/100 ({grade}). "
                f"Data quality: {data_quality['score']}/25. "
                f"Methodology: {methodology['score']}/25. "
                f"Assumptions: {assumptions['score']}/25. "
                f"Reporting: {reporting['score']}/25."
            )
        }

    def _score_data_quality(self, report: dict) -> Dict:
        score = 25.0
        findings = []

        issues = report.get("issues", [])
        critical = [i for i in issues if i.get("severity") == "critical"]
        warnings = [i for i in issues if i.get("severity") == "warning"]

        score -= len(critical) * 5
        score -= len(warnings) * 2

        row_count = report.get("row_count", 0)
        if row_count < 30:
            score -= 10
            findings.append("Sample size critically small")
        elif row_count < 100:
            score -= 3
            findings.append("Sample size moderate")
        else:
            findings.append("Adequate sample size")

        missing = report.get("missing_percentage", {})
        high_missing = [
            col for col, pct in missing.items() if pct > 20
        ]
        if high_missing:
            findings.append(
                f"High missingness in: {', '.join(high_missing)}"
            )
        else:
            findings.append("Missing data within acceptable limits")

        return {
            "score": max(0, round(score, 1)),
            "max": 25,
            "findings": findings
        }

    def _score_methodology(self, result: dict) -> Dict:
        score = 25.0
        findings = []

        if result.get("error"):
            return {
                "score": 0,
                "max": 25,
                "findings": ["Analysis failed to complete"]
            }

        if result.get("model"):
            score += 0
            findings.append(f"Appropriate model used: {result['model']}")
        else:
            score -= 10
            findings.append("No statistical model specified")

        n = result.get("n", 0)
        if n >= 100:
            findings.append("Adequate sample for chosen model")
        elif n >= 30:
            score -= 3
            findings.append("Borderline sample size for model")
        else:
            score -= 8
            findings.append("Insufficient sample size for model")

        if result.get("model_fit"):
            findings.append("Model fit statistics reported")
        else:
            score -= 3
            findings.append("Model fit statistics not available")

        return {
            "score": max(0, round(score, 1)),
            "max": 25,
            "findings": findings
        }

    def _score_assumptions(self, result: dict) -> Dict:
        score = 25.0
        findings = []

        assumptions = result.get("assumptions", {})

        if not assumptions:
            return {
                "score": 10,
                "max": 25,
                "findings": ["Assumption checks not recorded"]
            }

        passed = sum(
            1 for v in assumptions.values() 
            if v.get("passed") is True
        )
        failed = sum(
            1 for v in assumptions.values() 
            if v.get("passed") is False
        )
        total = len(assumptions)

        score -= failed * 5

        for name, check in assumptions.items():
            status = (
                "PASSED" if check.get("passed") 
                else "FAILED" if check.get("passed") is False 
                else "NOT CHECKED"
            )
            findings.append(f"{name}: {status} — {check.get('detail','')}")

        findings.append(
            f"{passed} of {total} assumptions passed"
        )

        return {
            "score": max(0, round(score, 1)),
            "max": 25,
            "findings": findings
        }

    def _score_reporting(self, result: dict) -> Dict:
        score = 0.0
        findings = []

        if result.get("model"):
            score += 5
            findings.append("Model clearly specified")

        if result.get("n"):
            score += 5
            findings.append("Sample size reported")

        if result.get("model_fit"):
            score += 5
            findings.append("Model fit statistics included")

        if result.get("interpretation"):
            score += 5
            findings.append("Results interpreted in plain language")

        if result.get("assumptions"):
            score += 5
            findings.append("Assumption checks documented")

        return {
            "score": round(score, 1),
            "max": 25,
            "findings": findings
        }

    def _recommendations(self, dq, meth, assump, rep) -> list:
        recs = []
        if dq["score"] < 15:
            recs.append(
                "Improve data quality: address missing values "
                "and remove duplicates before analysis"
            )
        if meth["score"] < 15:
            recs.append(
                "Review methodology: ensure chosen statistical "
                "model matches study design and sample size"
            )
        if assump["score"] < 15:
            recs.append(
                "Address assumption violations before "
                "interpreting results"
            )
        if rep["score"] < 15:
            recs.append(
                "Improve reporting: include model fit statistics, "
                "sample size, and plain language interpretation"
            )
        if not recs:
            recs.append(
                "Analysis meets ResearchFlow quality standards. "
                "Suitable for donor reporting and journal submission."
            )
        return recs