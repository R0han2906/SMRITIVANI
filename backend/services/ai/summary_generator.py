"""Deterministic day-summary calculations used by the caregiver dashboard."""

from __future__ import annotations

from typing import Any


def summarize_voice_day(rows: list[tuple[Any, ...]], medicine_total: int, medicine_taken: int) -> dict[str, Any]:
    scores = [float(row[1]) for row in rows if row[1] is not None]
    mood_score = sum(scores) / len(scores) if scores else 0.0
    mood_label = "good day" if mood_score >= 0.25 else "difficult" if mood_score <= -0.25 else "okay"
    interaction_count = len(rows)
    medicine_conversations = sum(row[0] == "medicine" for row in rows)
    compliance_pct = round((medicine_taken / medicine_total) * 100, 1) if medicine_total else None
    compliance_summary = f" Medicine record compliance was {compliance_pct}%" if compliance_pct is not None else " No medicine doses were scheduled in the log"
    summary_text = f"There were {interaction_count} voice interactions. The day’s overall tone was {mood_label}. {medicine_conversations} conversations were about medicines.{compliance_summary}."
    highlights = [str(row[2])[:300] for row in rows[-3:]]
    return {
        "mood_score": mood_score,
        "mood_label": mood_label,
        "medicine_compliance_pct": compliance_pct,
        "total_interactions": interaction_count,
        "summary_text": summary_text,
        "highlights": highlights,
    }
