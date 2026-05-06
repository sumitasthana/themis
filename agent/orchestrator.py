"""
Themis AML Investigation Agent Orchestrator

This module implements the LangGraph-based agent orchestrator that:
1. Loads investigation skills from SKILL.md files
2. Executes investigation tools based on skill procedures
3. Uses LLM reasoning to analyze findings
4. Generates investigation journal entries
5. Makes disposition recommendations (CLEAR/ESCALATE)
"""

import json
import os
from typing import Dict, List, Any, Optional, TypedDict, Annotated
from datetime import datetime
from operator import add

# LangGraph and LangChain imports (will be used in future)
# from langgraph.graph import StateGraph, END
# from langchain_aws import ChatBedrock
# from langchain.schema import HumanMessage, SystemMessage

from skills_loader import SkillsLoader
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
    TOOL_REGISTRY
)


# ═══════════════════════════════════════════════════════════════════
# STATE DEFINITION
# ═══════════════════════════════════════════════════════════════════

class InvestigationState(TypedDict):
    """State for the investigation workflow"""
    # Input
    alert_id: str
    
    # Investigation data
    alert_details: Optional[Dict[str, Any]]
    customer_profile: Optional[Dict[str, Any]]
    transactions: Optional[List[Dict[str, Any]]]
    network_analysis: Optional[Dict[str, Any]]
    baseline_analysis: Optional[Dict[str, Any]]
    sanctions_results: Optional[Dict[str, Any]]
    keyword_results: Optional[Dict[str, Any]]
    income_verification: Optional[Dict[str, Any]]
    
    # Analysis
    risk_factors: Dict[str, float]
    risk_score: Optional[Dict[str, Any]]
    
    # Journal entries (accumulated)
    journal_entries: Annotated[List[Dict[str, Any]], add]
    
    # Workflow control
    current_step: str
    completed_steps: Annotated[List[str], add]
    errors: Annotated[List[str], add]
    
    # Final output
    recommendation: Optional[str]
    confidence: Optional[float]
    narrative: Optional[str]


# ═══════════════════════════════════════════════════════════════════
# AGENT ORCHESTRATOR
# ═══════════════════════════════════════════════════════════════════

class ThemisAgent:
    """
    Themis AML Investigation Agent
    
    Orchestrates the investigation workflow using skills and tools.
    """
    
    def __init__(self, skills_dir: str = None):
        """
        Initialize the agent
        
        Args:
            skills_dir: Path to skills directory (default: ../skills/aml)
        """
        if skills_dir is None:
            # Default to skills/aml directory relative to this file
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            skills_dir = os.path.join(base_dir, "skills", "aml")
        
        self.skills_loader = SkillsLoader(skills_dir)
        self.skills = self.skills_loader.list_skills()
        
        print(f"✅ Themis Agent initialized with {len(self.skills)} skills")
    
    
    def create_journal_entry(
        self,
        step_number: int,
        step_name: str,
        tool_name: str,
        tool_input: Dict[str, Any],
        tool_output: Dict[str, Any],
        analysis: str,
        findings: List[str]
    ) -> Dict[str, Any]:
        """
        Create a structured journal entry
        
        Args:
            step_number: Step number in investigation
            step_name: Name of the investigation step
            tool_name: Tool that was executed
            tool_input: Input parameters to the tool
            tool_output: Output from the tool
            analysis: LLM analysis of the findings
            findings: Key findings from this step
        
        Returns:
            Journal entry dict
        """
        return {
            "step": step_number,
            "step_name": step_name,
            "timestamp": datetime.now().isoformat(),
            "tool": tool_name,
            "tool_input": tool_input,
            "tool_output": tool_output,
            "analysis": analysis,
            "findings": findings,
            "status": "completed"
        }
    
    
    def investigate_alert(self, alert_id: str) -> Dict[str, Any]:
        """
        Run complete AML alert investigation
        
        Args:
            alert_id: Alert identifier
        
        Returns:
            Investigation results with journal, recommendation, and narrative
        """
        print(f"\n{'='*70}")
        print(f"🔍 Starting Investigation: {alert_id}")
        print(f"{'='*70}\n")
        
        # Initialize state
        state = {
            "alert_id": alert_id,
            "alert_details": None,
            "customer_profile": None,
            "transactions": None,
            "network_analysis": None,
            "baseline_analysis": None,
            "sanctions_results": None,
            "keyword_results": None,
            "income_verification": None,
            "risk_factors": {},
            "risk_score": None,
            "journal_entries": [],
            "current_step": "init",
            "completed_steps": [],
            "errors": [],
            "recommendation": None,
            "confidence": None,
            "narrative": None
        }
        
        # Execute investigation workflow
        try:
            # Step 1: Get Alert Details
            state = self._step_1_alert_details(state)
            
            # Step 2: Get Customer Profile
            state = self._step_2_customer_profile(state)
            
            # Step 3: Search Transactions
            state = self._step_3_transactions(state)
            
            # Step 4: Calculate Baseline
            state = self._step_4_baseline(state)
            
            # Step 5: Verify Income
            state = self._step_5_income(state)
            
            # Step 6: Search Keywords
            state = self._step_6_keywords(state)
            
            # Step 7: Analyze Network
            state = self._step_7_network(state)
            
            # Step 8: Check Sanctions
            state = self._step_8_sanctions(state)
            
            # Step 9: Calculate Risk Score
            state = self._step_9_risk_score(state)
            
            # Step 10: Generate Narrative
            state = self._step_10_narrative(state)
            
        except Exception as e:
            print(f"❌ Investigation error: {str(e)}")
            state["errors"].append(str(e))
        
        # Return investigation results
        return {
            "alert_id": alert_id,
            "status": "completed" if not state["errors"] else "error",
            "recommendation": state["recommendation"],
            "confidence": state["confidence"],
            "risk_score": state["risk_score"],
            "journal": state["journal_entries"],
            "narrative": state["narrative"],
            "errors": state["errors"],
            "completed_at": datetime.now().isoformat()
        }
    
    
    def _step_1_alert_details(self, state: Dict) -> Dict:
        """Step 1: Retrieve alert details"""
        print("📋 Step 1: Retrieving alert details...")
        
        alert_details = get_alert_details(state["alert_id"])
        state["alert_details"] = alert_details
        
        # Analyze findings
        analysis = f"Alert {alert_details['alert_id']} was triggered on {alert_details['created_date']} " \
                   f"for customer {alert_details['customer_name']} ({alert_details['customer_id']}). " \
                   f"Risk level: {alert_details['risk_level']}. " \
                   f"{alert_details['rule_count']} rules fired: {', '.join(alert_details['rules_fired'])}. " \
                   f"Total flagged volume: ${alert_details['total_flagged_volume']:,.2f} across " \
                   f"{len(alert_details['flagged_transactions'])} transactions."
        
        findings = [
            f"Risk Level: {alert_details['risk_level']}",
            f"Rules Fired: {', '.join(alert_details['rules_fired'])}",
            f"Flagged Volume: ${alert_details['total_flagged_volume']:,.2f}",
            f"Transaction Count: {len(alert_details['flagged_transactions'])}"
        ]
        
        # Add risk factors
        if alert_details['rule_count'] >= 3:
            state["risk_factors"]["multiple_rules_fired"] = 0.30
        elif alert_details['rule_count'] == 2:
            state["risk_factors"]["multiple_rules_fired"] = 0.20
        
        if "STRUCT_CASH_DEP" in alert_details['rules_fired']:
            state["risk_factors"]["structuring_detected"] = 0.35
        
        # Create journal entry
        entry = self.create_journal_entry(
            step_number=1,
            step_name="Alert Details Retrieval",
            tool_name="get_alert_details",
            tool_input={"alert_id": state["alert_id"]},
            tool_output=alert_details,
            analysis=analysis,
            findings=findings
        )
        
        state["journal_entries"].append(entry)
        state["completed_steps"].append("alert_details")
        
        print(f"  ✓ {alert_details['customer_name']} - {alert_details['risk_level']} risk")
        print(f"  ✓ {alert_details['rule_count']} rules fired\n")
        
        return state
    
    
    def _step_2_customer_profile(self, state: Dict) -> Dict:
        """Step 2: Retrieve customer profile"""
        print("👤 Step 2: Retrieving customer profile...")
        
        customer_id = state["alert_details"]["customer_id"]
        profile = get_customer_profile(customer_id)
        state["customer_profile"] = profile
        
        analysis = f"Customer {profile['customer_name']} is a {profile['customer_type']} " \
                   f"in the {profile['business_type']} industry. " \
                   f"Account opened: {profile['account_opened']}. " \
                   f"KYC status: {profile['kyc_status']} (last updated {profile['kyc_last_updated']}). " \
                   f"Current risk rating: {profile['risk_rating']}. " \
                   f"PEP status: {'YES' if profile['pep_status'] else 'NO'}."
        
        findings = [
            f"Business Type: {profile['business_type']}",
            f"KYC Status: {profile['kyc_status']}",
            f"Risk Rating: {profile['risk_rating']}",
            f"PEP: {'YES' if profile['pep_status'] else 'NO'}"
        ]
        
        # Add risk factors
        if profile['kyc_status'] == 'EXPIRED':
            state["risk_factors"]["kyc_expired"] = 0.15
        elif profile['kyc_status'] == 'NEEDS_REFRESH':
            state["risk_factors"]["kyc_needs_refresh"] = 0.10
        
        if profile['pep_status']:
            state["risk_factors"]["pep_status"] = 0.25
        
        if profile['risk_rating'] == 'HIGH':
            state["risk_factors"]["high_risk_customer"] = 0.20
        
        entry = self.create_journal_entry(
            step_number=2,
            step_name="Customer Profile Review",
            tool_name="get_customer_profile",
            tool_input={"customer_id": customer_id},
            tool_output=profile,
            analysis=analysis,
            findings=findings
        )
        
        state["journal_entries"].append(entry)
        state["completed_steps"].append("customer_profile")
        
        print(f"  ✓ {profile['business_type']} - {profile['risk_rating']} risk")
        print(f"  ✓ KYC: {profile['kyc_status']}\n")
        
        return state
    
    
    def _step_3_transactions(self, state: Dict) -> Dict:
        """Step 3: Search transactions"""
        print("💳 Step 3: Searching transaction history...")
        
        customer_id = state["alert_details"]["customer_id"]
        transactions = search_transactions(customer_id, min_amount=1000)
        state["transactions"] = transactions
        
        total_volume = sum(t['amount'] for t in transactions)
        flagged_count = sum(1 for t in transactions if t['flags'])
        
        analysis = f"Found {len(transactions)} transactions totaling ${total_volume:,.2f}. " \
                   f"{flagged_count} transactions have risk flags. " \
                   f"Transaction types: {', '.join(set(t['type'] for t in transactions[:5]))}."
        
        findings = [
            f"Total Transactions: {len(transactions)}",
            f"Total Volume: ${total_volume:,.2f}",
            f"Flagged Transactions: {flagged_count}",
            f"Avg Transaction: ${total_volume/len(transactions):,.2f}" if transactions else "N/A"
        ]
        
        entry = self.create_journal_entry(
            step_number=3,
            step_name="Transaction History Search",
            tool_name="search_transactions",
            tool_input={"customer_id": customer_id, "min_amount": 1000},
            tool_output={"transactions": transactions, "count": len(transactions)},
            analysis=analysis,
            findings=findings
        )
        
        state["journal_entries"].append(entry)
        state["completed_steps"].append("transactions")
        
        print(f"  ✓ {len(transactions)} transactions found")
        print(f"  ✓ ${total_volume:,.2f} total volume\n")
        
        return state
    
    
    def _step_4_baseline(self, state: Dict) -> Dict:
        """Step 4: Calculate baseline"""
        print("📊 Step 4: Calculating transaction baseline...")
        
        customer_id = state["alert_details"]["customer_id"]
        baseline = calculate_baseline(customer_id, period_days=90)
        state["baseline_analysis"] = baseline
        
        deviation_pct = baseline['deviations']['volume_deviation_pct']
        
        analysis = f"Baseline monthly volume: ${baseline['baseline_metrics']['avg_monthly_volume']:,.2f}. " \
                   f"Alert period volume: ${baseline['alert_period_metrics']['monthly_volume']:,.2f}. " \
                   f"Deviation: {deviation_pct:+.1f}%. " \
                   f"Significant deviation: {'YES' if baseline['is_significant_deviation'] else 'NO'}."
        
        findings = [
            f"Baseline Volume: ${baseline['baseline_metrics']['avg_monthly_volume']:,.2f}/month",
            f"Alert Period Volume: ${baseline['alert_period_metrics']['monthly_volume']:,.2f}/month",
            f"Deviation: {deviation_pct:+.1f}%",
            f"Significant: {'YES' if baseline['is_significant_deviation'] else 'NO'}"
        ]
        
        # Add risk factor
        if baseline['is_significant_deviation'] and deviation_pct > 100:
            state["risk_factors"]["extreme_volume_deviation"] = 0.30
        elif baseline['is_significant_deviation']:
            state["risk_factors"]["volume_deviation"] = 0.20
        
        entry = self.create_journal_entry(
            step_number=4,
            step_name="Baseline Calculation",
            tool_name="calculate_baseline",
            tool_input={"customer_id": customer_id, "period_days": 90},
            tool_output=baseline,
            analysis=analysis,
            findings=findings
        )
        
        state["journal_entries"].append(entry)
        state["completed_steps"].append("baseline")
        
        print(f"  ✓ Deviation: {deviation_pct:+.1f}%")
        print(f"  ✓ Significant: {'YES' if baseline['is_significant_deviation'] else 'NO'}\n")
        
        return state
    
    
    def _step_5_income(self, state: Dict) -> Dict:
        """Step 5: Verify income"""
        print("💰 Step 5: Verifying income...")
        
        customer_id = state["alert_details"]["customer_id"]
        income = verify_income(customer_id)
        state["income_verification"] = income
        
        analysis = f"Stated annual income: ${income['stated_annual_income']:,.2f}. " \
                   f"Observed annual volume: ${income['observed_annual_volume']:,.2f}. " \
                   f"Discrepancy: {income['discrepancy_pct']:.1f}%. " \
                   f"Verification status: {income['verification_status']}."
        
        findings = [
            f"Stated Income: ${income['stated_annual_income']:,.2f}",
            f"Observed Volume: ${income['observed_annual_volume']:,.2f}",
            f"Discrepancy: {income['discrepancy_pct']:.1f}%",
            f"Status: {income['verification_status']}"
        ]
        
        # Add risk factor
        if income['verification_status'] == 'INCONSISTENT':
            state["risk_factors"]["income_inconsistent"] = 0.25
        elif income['verification_status'] == 'QUESTIONABLE':
            state["risk_factors"]["income_questionable"] = 0.15
        
        entry = self.create_journal_entry(
            step_number=5,
            step_name="Income Verification",
            tool_name="verify_income",
            tool_input={"customer_id": customer_id},
            tool_output=income,
            analysis=analysis,
            findings=findings
        )
        
        state["journal_entries"].append(entry)
        state["completed_steps"].append("income")
        
        print(f"  ✓ Discrepancy: {income['discrepancy_pct']:.1f}%")
        print(f"  ✓ Status: {income['verification_status']}\n")
        
        return state
    
    
    def _step_6_keywords(self, state: Dict) -> Dict:
        """Step 6: Search keywords"""
        print("🔍 Step 6: Searching for suspicious keywords...")
        
        customer_id = state["alert_details"]["customer_id"]
        keywords = ["loan", "gift", "cash", "consulting", "services"]
        keyword_results = search_keywords(customer_id, keywords)
        state["keyword_results"] = keyword_results
        
        analysis = f"Searched for {len(keywords)} suspicious keywords. " \
                   f"Found {keyword_results['total_matches']} matches. " \
                   f"High-risk keywords: {', '.join(keyword_results['high_risk_keywords_found']) if keyword_results['high_risk_keywords_found'] else 'None'}."
        
        findings = [
            f"Keywords Searched: {len(keywords)}",
            f"Matches Found: {keyword_results['total_matches']}",
            f"High-Risk Keywords: {', '.join(keyword_results['high_risk_keywords_found']) if keyword_results['high_risk_keywords_found'] else 'None'}"
        ]
        
        # Add risk factor
        if keyword_results['total_matches'] > 3:
            state["risk_factors"]["suspicious_keywords"] = 0.15
        
        entry = self.create_journal_entry(
            step_number=6,
            step_name="Keyword Search",
            tool_name="search_keywords",
            tool_input={"customer_id": customer_id, "keywords": keywords},
            tool_output=keyword_results,
            analysis=analysis,
            findings=findings
        )
        
        state["journal_entries"].append(entry)
        state["completed_steps"].append("keywords")
        
        print(f"  ✓ {keyword_results['total_matches']} keyword matches\n")
        
        return state
    
    
    def _step_7_network(self, state: Dict) -> Dict:
        """Step 7: Analyze network"""
        print("🕸️  Step 7: Analyzing transaction network...")
        
        customer_id = state["alert_details"]["customer_id"]
        network = analyze_network(customer_id, depth=2)
        state["network_analysis"] = network
        
        analysis = f"Network analysis found {network['total_connections']} connected entities. " \
                   f"High-risk connections: {network['high_risk_connections']}. " \
                   f"Circular flows detected: {len(network['circular_flows'])}. " \
                   f"Layering detected: {'YES' if network['layering_detected'] else 'NO'}."
        
        findings = [
            f"Total Connections: {network['total_connections']}",
            f"High-Risk Connections: {network['high_risk_connections']}",
            f"Circular Flows: {len(network['circular_flows'])}",
            f"Layering: {'YES' if network['layering_detected'] else 'NO'}"
        ]
        
        # Add risk factors
        if network['layering_detected']:
            state["risk_factors"]["network_layering"] = 0.30
        
        if network['high_risk_connections'] > 2:
            state["risk_factors"]["high_risk_network"] = 0.20
        
        entry = self.create_journal_entry(
            step_number=7,
            step_name="Network Analysis",
            tool_name="analyze_network",
            tool_input={"customer_id": customer_id, "depth": 2},
            tool_output=network,
            analysis=analysis,
            findings=findings
        )
        
        state["journal_entries"].append(entry)
        state["completed_steps"].append("network")
        
        print(f"  ✓ {network['total_connections']} connections")
        print(f"  ✓ Layering: {'YES' if network['layering_detected'] else 'NO'}\n")
        
        return state
    
    
    def _step_8_sanctions(self, state: Dict) -> Dict:
        """Step 8: Check sanctions"""
        print("🚫 Step 8: Screening against sanctions lists...")
        
        customer_name = state["customer_profile"]["customer_name"]
        sanctions = check_sanctions(customer_name, "BUSINESS")
        state["sanctions_results"] = sanctions
        
        analysis = f"Screened {customer_name} against {len(sanctions['lists_checked'])} sanctions lists. " \
                   f"Total hits: {sanctions['total_hits']}. " \
                   f"{'POTENTIAL MATCH FOUND - requires review.' if sanctions['total_hits'] > 0 else 'No matches found.'}"
        
        findings = [
            f"Lists Checked: {len(sanctions['lists_checked'])}",
            f"Total Hits: {sanctions['total_hits']}",
            f"Status: {'⚠️ MATCH FOUND' if sanctions['total_hits'] > 0 else '✓ Clear'}"
        ]
        
        # Add risk factor
        if sanctions['total_hits'] > 0:
            state["risk_factors"]["sanctions_hit"] = 0.40  # Critical risk factor
        
        entry = self.create_journal_entry(
            step_number=8,
            step_name="Sanctions Screening",
            tool_name="check_sanctions",
            tool_input={"entity_name": customer_name, "entity_type": "BUSINESS"},
            tool_output=sanctions,
            analysis=analysis,
            findings=findings
        )
        
        state["journal_entries"].append(entry)
        state["completed_steps"].append("sanctions")
        
        print(f"  ✓ {sanctions['total_hits']} sanctions hits\n")
        
        return state
    
    
    def _step_9_risk_score(self, state: Dict) -> Dict:
        """Step 9: Calculate risk score"""
        print("⚖️  Step 9: Calculating risk score...")
        
        risk_score = calculate_risk_score(state["risk_factors"])
        state["risk_score"] = risk_score
        state["recommendation"] = risk_score["recommendation"]
        state["confidence"] = risk_score["confidence"]
        
        analysis = f"Risk score: {risk_score['risk_score']}/100 ({risk_score['risk_level']}). " \
                   f"Analyzed {risk_score['factors_analyzed']} risk factors. " \
                   f"Recommendation: {risk_score['recommendation']} (confidence: {risk_score['confidence']}%). " \
                   f"Requires SAR: {'YES' if risk_score['requires_sar'] else 'NO'}."
        
        findings = [
            f"Risk Score: {risk_score['risk_score']}/100",
            f"Risk Level: {risk_score['risk_level']}",
            f"Recommendation: {risk_score['recommendation']}",
            f"Confidence: {risk_score['confidence']}%",
            f"Requires SAR: {'YES' if risk_score['requires_sar'] else 'NO'}"
        ]
        
        entry = self.create_journal_entry(
            step_number=9,
            step_name="Risk Score Calculation",
            tool_name="calculate_risk_score",
            tool_input={"factors": state["risk_factors"]},
            tool_output=risk_score,
            analysis=analysis,
            findings=findings
        )
        
        state["journal_entries"].append(entry)
        state["completed_steps"].append("risk_score")
        
        print(f"  ✓ Score: {risk_score['risk_score']}/100")
        print(f"  ✓ Recommendation: {risk_score['recommendation']}\n")
        
        return state
    
    
    def _step_10_narrative(self, state: Dict) -> Dict:
        """Step 10: Generate investigation narrative"""
        print("📝 Step 10: Generating investigation narrative...")
        
        # Generate narrative summary
        alert = state["alert_details"]
        profile = state["customer_profile"]
        risk = state["risk_score"]
        
        narrative = f"""
INVESTIGATION NARRATIVE - {state['alert_id']}

ALERT SUMMARY:
Alert {alert['alert_id']} was triggered on {alert['created_date']} for {alert['customer_name']} 
({alert['customer_id']}). The alert was classified as {alert['risk_level']} risk with an alert 
score of {alert['alert_score']}.

RULES FIRED:
{chr(10).join(f'- {rule}' for rule in alert['rules_fired'])}

CUSTOMER PROFILE:
{profile['customer_name']} is a {profile['customer_type']} entity operating in the 
{profile['business_type']} industry. The account was opened on {profile['account_opened']}. 
Current risk rating: {profile['risk_rating']}. KYC status: {profile['kyc_status']}.

KEY FINDINGS:
{chr(10).join(f'- {finding}' for entry in state['journal_entries'] for finding in entry['findings'][:2])}

RISK ASSESSMENT:
Total risk score: {risk['risk_score']}/100 ({risk['risk_level']})
Top risk factors:
{chr(10).join(f"- {factor['factor']}: {factor['contribution']}% contribution" for factor in risk['factor_breakdown'][:5])}

RECOMMENDATION:
Based on the investigation findings, the recommendation is to {risk['recommendation']} this alert.
Confidence level: {risk['confidence']}%
SAR filing required: {'YES' if risk['requires_sar'] else 'NO'}
EDD required: {'YES' if risk['requires_edd'] else 'NO'}

INVESTIGATION COMPLETED: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
        
        state["narrative"] = narrative.strip()
        
        analysis = f"Investigation narrative generated. Recommendation: {risk['recommendation']}. " \
                   f"Total investigation steps completed: {len(state['completed_steps'])}."
        
        findings = [
            f"Steps Completed: {len(state['completed_steps'])}",
            f"Final Recommendation: {risk['recommendation']}",
            f"Narrative Length: {len(narrative)} characters"
        ]
        
        entry = self.create_journal_entry(
            step_number=10,
            step_name="Narrative Generation",
            tool_name="generate_narrative",
            tool_input={"investigation_state": "complete"},
            tool_output={"narrative": narrative[:200] + "..."},
            analysis=analysis,
            findings=findings
        )
        
        state["journal_entries"].append(entry)
        state["completed_steps"].append("narrative")
        
        print(f"  ✓ Narrative generated ({len(narrative)} chars)\n")
        
        return state


# ═══════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════

def run_investigation(alert_id: str, skills_dir: str = None) -> Dict[str, Any]:
    """
    Convenience function to run an investigation
    
    Args:
        alert_id: Alert identifier
        skills_dir: Optional path to skills directory
    
    Returns:
        Investigation results
    """
    agent = ThemisAgent(skills_dir=skills_dir)
    return agent.investigate_alert(alert_id)
