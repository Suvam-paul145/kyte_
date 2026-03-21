from models.evaluation import EvaluationResult, RequirementResult


class GeminiService:
    """
    Phase 1 deterministic mock evaluator.
    """

    async def evaluate(self, requirements: list[str], content: str) -> EvaluationResult:
        normalized = content.lower()
        results: list[RequirementResult] = []
        total = 0
        for requirement in requirements:
            key_tokens = [token.strip().lower() for token in requirement.split() if len(token.strip()) > 3]
            hits = sum(1 for token in key_tokens if token in normalized)
            ratio = (hits / max(len(key_tokens), 1)) * 100
            score = max(10, min(100, int(ratio)))
            met = score >= 70
            reason = (
                "Requirement appears to be addressed in the submission content."
                if met
                else "Not enough matching evidence found in the submitted content."
            )
            results.append(RequirementResult(requirement=requirement, met=met, score=score, reason=reason))
            total += score

        overall_score = int(total / max(len(results), 1))
        failed = [r.requirement for r in results if not r.met]
        gap_report = (
            "All requirements appear to be covered."
            if not failed
            else "The following requirements need improvement: " + "; ".join(failed)
        )
        return EvaluationResult(results=results, overall_score=overall_score, gap_report=gap_report)


gemini_service = GeminiService()
