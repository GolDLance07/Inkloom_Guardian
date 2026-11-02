import pytest
from app.services.regression_runner import run_regression_suite, replay_historical_reviews


def test_automated_rule_regression_suite():
    """Verify that all synthetic rule regression fixtures pass deterministic checks."""
    summary = run_regression_suite()
    assert summary["success"] is True, f"Regression suite failures: {summary['results']}"
    assert summary["total"] >= 9
    assert summary["failed"] == 0


def test_regression_replay_mode():
    """Verify that historical replay mode runs cleanly without raising errors."""
    summary = replay_historical_reviews(limit=5)
    assert "total_replayed" in summary
