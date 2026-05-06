"""
Test suite for Themis AML Investigation Tools
"""

import sys
import json
from pathlib import Path

# Add agent directory to path
sys.path.insert(0, str(Path(__file__).parent / "agent"))

from tools import (
    get_alert_details,
    search_transactions,
    get_customer_profile,
    analyze_network,
    check_sanctions,
    calculate_baseline,
    search_keywords,
    verify_income,
    calculate_risk_score,
    list_tools,
    get_tool_info,
    TOOL_REGISTRY
)


def print_section(title):
    """Print formatted section header"""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")


def test_tool_registry():
    """Test 1: Tool Registry"""
    print_section("TEST 1: Tool Registry")
    
    tools = list_tools()
    print(f"✓ Total tools registered: {len(tools)}")
    print(f"✓ Tools: {', '.join(tools)}\n")
    
    for tool_name in tools:
        info = get_tool_info(tool_name)
        print(f"  • {tool_name}")
        print(f"    Description: {info['description']}")
        print(f"    Parameters: {', '.join(info['parameters'])}")
    
    assert len(tools) == 9, "Should have 9 tools"
    print(f"\n✅ PASS: Tool registry contains all 9 tools")


def test_get_alert_details():
    """Test 2: Get Alert Details"""
    print_section("TEST 2: Get Alert Details")
    
    result = get_alert_details("AML123456")
    
    print(f"Alert ID: {result['alert_id']}")
    print(f"Customer: {result['customer_name']} ({result['customer_id']})")
    print(f"Risk Level: {result['risk_level']}")
    print(f"Rules Fired: {', '.join(result['rules_fired'])}")
    print(f"Flagged Transactions: {len(result['flagged_transactions'])}")
    print(f"Total Volume: ${result['total_flagged_volume']:,.2f}")
    print(f"Alert Score: {result['alert_score']}")
    
    assert "alert_id" in result
    assert "customer_id" in result
    assert "rules_fired" in result
    assert len(result['flagged_transactions']) > 0
    
    print(f"\n✅ PASS: Alert details retrieved successfully")


def test_search_transactions():
    """Test 3: Search Transactions"""
    print_section("TEST 3: Search Transactions")
    
    result = search_transactions("CUST123456", min_amount=5000)
    
    print(f"Total transactions found: {len(result)}")
    if result:
        print(f"\nSample transaction:")
        txn = result[0]
        print(f"  ID: {txn['transaction_id']}")
        print(f"  Date: {txn['date']}")
        print(f"  Type: {txn['type']}")
        print(f"  Amount: ${txn['amount']:,.2f}")
        print(f"  Description: {txn['description']}")
        if txn['flags']:
            print(f"  Flags: {', '.join(txn['flags'])}")
    
    assert len(result) > 0
    assert all('transaction_id' in txn for txn in result)
    
    print(f"\n✅ PASS: Transaction search working correctly")


def test_get_customer_profile():
    """Test 4: Get Customer Profile"""
    print_section("TEST 4: Get Customer Profile")
    
    result = get_customer_profile("CUST123456")
    
    print(f"Customer: {result['customer_name']}")
    print(f"Type: {result['customer_type']}")
    print(f"Business Type: {result['business_type']}")
    print(f"KYC Status: {result['kyc_status']}")
    print(f"Risk Rating: {result['risk_rating']}")
    print(f"PEP Status: {'YES' if result['pep_status'] else 'NO'}")
    print(f"Beneficial Owners: {len(result['beneficial_owners'])}")
    print(f"Expected Monthly Volume: ${result['expected_activity']['monthly_volume']:,.2f}")
    
    assert "customer_id" in result
    assert "kyc_status" in result
    assert "risk_rating" in result
    
    print(f"\n✅ PASS: Customer profile retrieved successfully")


def test_analyze_network():
    """Test 5: Analyze Network"""
    print_section("TEST 5: Analyze Network")
    
    result = analyze_network("CUST123456", depth=2)
    
    print(f"Total Connections: {result['total_connections']}")
    print(f"High Risk Connections: {result['high_risk_connections']}")
    print(f"Network Risk Score: {result['network_risk_score']}")
    print(f"Circular Flows Detected: {len(result['circular_flows'])}")
    print(f"Layering Detected: {'YES' if result['layering_detected'] else 'NO'}")
    
    if result['connections']:
        print(f"\nSample connection:")
        conn = result['connections'][0]
        print(f"  Entity: {conn['entity_name']} ({conn['entity_id']})")
        print(f"  Relationship: {conn['relationship_type']}")
        print(f"  Transactions: {conn['transaction_count']}")
        print(f"  Volume: ${conn['total_volume']:,.2f}")
        print(f"  Risk Score: {conn['risk_score']}")
    
    assert "total_connections" in result
    assert "network_risk_score" in result
    
    print(f"\n✅ PASS: Network analysis completed successfully")


def test_check_sanctions():
    """Test 6: Check Sanctions"""
    print_section("TEST 6: Check Sanctions")
    
    result = check_sanctions("Test Entity LLC", "BUSINESS")
    
    print(f"Entity: {result['entity_name']}")
    print(f"Lists Checked: {', '.join(result['lists_checked'])}")
    print(f"Total Hits: {result['total_hits']}")
    
    if result['matches']:
        print(f"\nMatch found:")
        match = result['matches'][0]
        print(f"  List: {match['list']}")
        print(f"  Match Score: {match['match_score']}%")
        print(f"  Program: {match['program']}")
        print(f"  Requires Review: {'YES' if match['requires_review'] else 'NO'}")
    else:
        print(f"✓ No sanctions matches found")
    
    assert "total_hits" in result
    assert "lists_checked" in result
    
    print(f"\n✅ PASS: Sanctions screening completed")


def test_calculate_baseline():
    """Test 7: Calculate Baseline"""
    print_section("TEST 7: Calculate Baseline")
    
    result = calculate_baseline("CUST123456", period_days=90)
    
    baseline = result['baseline_metrics']
    alert = result['alert_period_metrics']
    deviations = result['deviations']
    
    print(f"Analysis Period: {result['analysis_period_days']} days")
    print(f"\nBaseline Metrics:")
    print(f"  Avg Monthly Volume: ${baseline['avg_monthly_volume']:,.2f}")
    print(f"  Avg Transaction Size: ${baseline['avg_transaction_size']:,.2f}")
    print(f"  Transaction Frequency: {baseline['transaction_frequency']}")
    
    print(f"\nAlert Period Metrics:")
    print(f"  Monthly Volume: ${alert['monthly_volume']:,.2f}")
    print(f"  Avg Transaction Size: ${alert['avg_transaction_size']:,.2f}")
    
    print(f"\nDeviations:")
    print(f"  Volume Deviation: {deviations['volume_deviation_pct']:+.1f}%")
    print(f"  Frequency Deviation: {deviations['frequency_deviation_pct']:+.1f}%")
    print(f"  Significant Deviation: {'YES' if result['is_significant_deviation'] else 'NO'}")
    print(f"  Deviation Score: {result['deviation_score']}")
    
    assert "baseline_metrics" in result
    assert "deviations" in result
    
    print(f"\n✅ PASS: Baseline calculation completed")


def test_search_keywords():
    """Test 8: Search Keywords"""
    print_section("TEST 8: Search Keywords")
    
    keywords = ["loan", "gift", "cash", "consulting"]
    result = search_keywords("CUST123456", keywords)
    
    print(f"Keywords Searched: {', '.join(result['keywords_searched'])}")
    print(f"Total Matches: {result['total_matches']}")
    
    if result['matches']:
        print(f"\nSample match:")
        match = result['matches'][0]
        print(f"  Transaction: {match['transaction_id']}")
        print(f"  Date: {match['date']}")
        print(f"  Amount: ${match['amount']:,.2f}")
        print(f"  Keyword: {match['keyword_matched']}")
        print(f"  Context: {match['context']}")
    
    if result['high_risk_keywords_found']:
        print(f"\n⚠ High Risk Keywords: {', '.join(result['high_risk_keywords_found'])}")
    
    assert "total_matches" in result
    assert "keywords_searched" in result
    
    print(f"\n✅ PASS: Keyword search completed")


def test_verify_income():
    """Test 9: Verify Income"""
    print_section("TEST 9: Verify Income")
    
    result = verify_income("CUST123456")
    
    print(f"Stated Annual Income: ${result['stated_annual_income']:,.2f}")
    print(f"Income Source: {result['income_source']}")
    print(f"Documentation: {result['documentation_provided']}")
    print(f"Observed Annual Volume: ${result['observed_annual_volume']:,.2f}")
    print(f"Discrepancy: {result['discrepancy_pct']:.1f}%")
    print(f"Verification Status: {result['verification_status']}")
    print(f"Is Consistent: {'YES' if result['is_consistent'] else 'NO'}")
    
    if result['red_flags']:
        print(f"\n⚠ Red Flags:")
        for flag in result['red_flags']:
            print(f"  • {flag}")
    
    assert "stated_annual_income" in result
    assert "verification_status" in result
    
    print(f"\n✅ PASS: Income verification completed")


def test_calculate_risk_score():
    """Test 10: Calculate Risk Score"""
    print_section("TEST 10: Calculate Risk Score")
    
    factors = {
        "structuring_detected": 0.35,
        "high_risk_country": 0.25,
        "kyc_expired": 0.15,
        "network_layering": 0.20,
        "income_inconsistent": 0.10
    }
    
    result = calculate_risk_score(factors)
    
    print(f"Risk Score: {result['risk_score']}")
    print(f"Risk Level: {result['risk_level']}")
    print(f"Recommendation: {result['recommendation']}")
    print(f"Confidence: {result['confidence']}%")
    print(f"Requires SAR: {'YES' if result['requires_sar'] else 'NO'}")
    print(f"Requires EDD: {'YES' if result['requires_edd'] else 'NO'}")
    
    print(f"\nFactor Breakdown:")
    for factor in result['factor_breakdown'][:5]:
        print(f"  • {factor['factor']}: {factor['contribution']:.1f}% contribution")
    
    assert "risk_score" in result
    assert "recommendation" in result
    assert result['recommendation'] in ["CLEAR", "REVIEW", "ESCALATE"]
    
    print(f"\n✅ PASS: Risk score calculation completed")


def run_all_tests():
    """Run all tool tests"""
    print("\n" + "="*70)
    print("  THEMIS AML INVESTIGATION TOOLS - TEST SUITE")
    print("="*70)
    
    tests = [
        test_tool_registry,
        test_get_alert_details,
        test_search_transactions,
        test_get_customer_profile,
        test_analyze_network,
        test_check_sanctions,
        test_calculate_baseline,
        test_search_keywords,
        test_verify_income,
        test_calculate_risk_score
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            failed += 1
            print(f"\n❌ FAIL: {test.__name__}")
            print(f"   Error: {str(e)}")
    
    print_section("TEST SUMMARY")
    print(f"Total Tests: {len(tests)}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"\nSuccess Rate: {(passed/len(tests)*100):.1f}%")
    
    if failed == 0:
        print(f"\n🎉 ALL TESTS PASSED! Phase 2 Tool Layer is ready.")
    
    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
