"""
Test suite for Themis Agent Orchestrator
"""

import sys
import json
from pathlib import Path

# Add agent directory to path
sys.path.insert(0, str(Path(__file__).parent / "agent"))

from orchestrator import ThemisAgent, run_investigation


def print_section(title):
    """Print formatted section header"""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")


def test_agent_initialization():
    """Test 1: Agent Initialization"""
    print_section("TEST 1: Agent Initialization")
    
    agent = ThemisAgent()
    
    print(f"✓ Agent initialized successfully")
    print(f"✓ Skills loaded: {len(agent.skills)}")
    print(f"✓ Skills: {', '.join([s['name'] for s in agent.skills])}")
    
    assert len(agent.skills) > 0, "Should have loaded skills"
    
    print(f"\n✅ PASS: Agent initialization successful")


def test_full_investigation():
    """Test 2: Full Investigation Workflow"""
    print_section("TEST 2: Full Investigation Workflow")
    
    alert_id = "AML123456"
    
    print(f"Running investigation for alert: {alert_id}\n")
    
    result = run_investigation(alert_id)
    
    print_section("INVESTIGATION RESULTS")
    
    print(f"Alert ID: {result['alert_id']}")
    print(f"Status: {result['status']}")
    print(f"Recommendation: {result['recommendation']}")
    print(f"Confidence: {result['confidence']}%")
    print(f"Risk Score: {result['risk_score']['risk_score']}/100")
    print(f"Risk Level: {result['risk_score']['risk_level']}")
    print(f"Requires SAR: {'YES' if result['risk_score']['requires_sar'] else 'NO'}")
    print(f"Journal Entries: {len(result['journal'])}")
    print(f"Errors: {len(result['errors'])}")
    
    assert result['status'] == 'completed', "Investigation should complete"
    assert result['recommendation'] in ['CLEAR', 'REVIEW', 'ESCALATE'], "Should have valid recommendation"
    assert len(result['journal']) == 10, "Should have 10 journal entries"
    assert result['narrative'] is not None, "Should have narrative"
    
    print(f"\n✅ PASS: Full investigation completed successfully")
    
    return result


def test_journal_entries(result):
    """Test 3: Journal Entries"""
    print_section("TEST 3: Journal Entries")
    
    journal = result['journal']
    
    print(f"Total journal entries: {len(journal)}\n")
    
    for entry in journal:
        print(f"Step {entry['step']}: {entry['step_name']}")
        print(f"  Tool: {entry['tool']}")
        print(f"  Findings: {len(entry['findings'])}")
        print(f"  Status: {entry['status']}")
        print()
    
    # Verify all steps completed
    expected_steps = [
        "Alert Details Retrieval",
        "Customer Profile Review",
        "Transaction History Search",
        "Baseline Calculation",
        "Income Verification",
        "Keyword Search",
        "Network Analysis",
        "Sanctions Screening",
        "Risk Score Calculation",
        "Narrative Generation"
    ]
    
    actual_steps = [entry['step_name'] for entry in journal]
    
    for expected in expected_steps:
        assert expected in actual_steps, f"Missing step: {expected}"
    
    print(f"✅ PASS: All journal entries present and valid")


def test_risk_factors(result):
    """Test 4: Risk Factor Analysis"""
    print_section("TEST 4: Risk Factor Analysis")
    
    risk_score = result['risk_score']
    
    print(f"Risk Score: {risk_score['risk_score']}/100")
    print(f"Risk Level: {risk_score['risk_level']}")
    print(f"Factors Analyzed: {risk_score['factors_analyzed']}")
    print(f"\nTop Risk Factors:")
    
    for factor in risk_score['factor_breakdown'][:5]:
        print(f"  • {factor['factor']}: {factor['contribution']}% contribution (weight: {factor['weight']})")
    
    assert risk_score['factors_analyzed'] > 0, "Should have risk factors"
    assert 0 <= risk_score['risk_score'] <= 200, "Risk score should be in valid range"
    
    print(f"\n✅ PASS: Risk factor analysis complete")


def test_narrative_generation(result):
    """Test 5: Narrative Generation"""
    print_section("TEST 5: Narrative Generation")
    
    narrative = result['narrative']
    
    print(f"Narrative length: {len(narrative)} characters\n")
    print("Narrative preview:")
    print("-" * 70)
    print(narrative[:500] + "...")
    print("-" * 70)
    
    # Check narrative contains key sections
    assert "INVESTIGATION NARRATIVE" in narrative, "Should have title"
    assert "ALERT SUMMARY" in narrative, "Should have alert summary"
    assert "CUSTOMER PROFILE" in narrative, "Should have customer profile"
    assert "KEY FINDINGS" in narrative, "Should have key findings"
    assert "RISK ASSESSMENT" in narrative, "Should have risk assessment"
    assert "RECOMMENDATION" in narrative, "Should have recommendation"
    
    print(f"\n✅ PASS: Narrative generated successfully")


def test_recommendation_logic(result):
    """Test 6: Recommendation Logic"""
    print_section("TEST 6: Recommendation Logic")
    
    risk_score = result['risk_score']['risk_score']
    recommendation = result['recommendation']
    confidence = result['confidence']
    
    print(f"Risk Score: {risk_score}/100")
    print(f"Recommendation: {recommendation}")
    print(f"Confidence: {confidence}%")
    
    # Verify recommendation logic
    if risk_score >= 75:
        expected = "ESCALATE"
    elif risk_score >= 50:
        expected = "REVIEW"
    else:
        expected = "CLEAR"
    
    assert recommendation == expected, f"Recommendation should be {expected} for score {risk_score}"
    assert 0 <= confidence <= 100, "Confidence should be 0-100%"
    
    print(f"\n✅ PASS: Recommendation logic correct")


def run_all_tests():
    """Run all agent tests"""
    print("\n" + "="*70)
    print("  THEMIS AGENT ORCHESTRATOR - TEST SUITE")
    print("="*70)
    
    tests = [
        test_agent_initialization,
        test_full_investigation,
    ]
    
    passed = 0
    failed = 0
    investigation_result = None
    
    # Run basic tests
    for test in tests:
        try:
            if test == test_full_investigation:
                investigation_result = test()
            else:
                test()
            passed += 1
        except Exception as e:
            failed += 1
            print(f"\n❌ FAIL: {test.__name__}")
            print(f"   Error: {str(e)}")
    
    # Run tests that depend on investigation result
    if investigation_result:
        dependent_tests = [
            test_journal_entries,
            test_risk_factors,
            test_narrative_generation,
            test_recommendation_logic
        ]
        
        for test in dependent_tests:
            try:
                test(investigation_result)
                passed += 1
            except Exception as e:
                failed += 1
                print(f"\n❌ FAIL: {test.__name__}")
                print(f"   Error: {str(e)}")
    
    total_tests = len(tests) + (4 if investigation_result else 0)
    
    print_section("TEST SUMMARY")
    print(f"Total Tests: {total_tests}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"\nSuccess Rate: {(passed/total_tests*100):.1f}%")
    
    if failed == 0:
        print(f"\n🎉 ALL TESTS PASSED! Phase 3 Agent Orchestrator is ready.")
    
    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
