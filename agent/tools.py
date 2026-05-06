"""
Themis AML Investigation Tools

This module provides the core investigation tools used by the agent
to execute AML alert investigations. Each tool returns structured data
that can be used for analysis and narrative generation.
"""

import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict


# ═══════════════════════════════════════════════════════════════════
# MOCK DATA GENERATORS
# ═══════════════════════════════════════════════════════════════════

def generate_customer_id():
    """Generate realistic customer ID"""
    return f"CUST{random.randint(100000, 999999)}"

def generate_transaction_id():
    """Generate realistic transaction ID"""
    return f"TXN{random.randint(10000000, 99999999)}"

def generate_alert_id():
    """Generate realistic alert ID"""
    return f"AML{random.randint(100000, 999999)}"

def random_date(days_back=90):
    """Generate random date within last N days"""
    return (datetime.now() - timedelta(days=random.randint(0, days_back))).strftime("%Y-%m-%d")

def random_amount(min_amt=100, max_amt=50000):
    """Generate random transaction amount"""
    return round(random.uniform(min_amt, max_amt), 2)


# ═══════════════════════════════════════════════════════════════════
# TOOL 1: GET ALERT DETAILS
# ═══════════════════════════════════════════════════════════════════

def get_alert_details(alert_id: str) -> Dict[str, Any]:
    """
    Retrieve comprehensive alert metadata and triggering information.
    
    Args:
        alert_id: Alert identifier (e.g., "AML123456")
    
    Returns:
        Dict containing alert metadata, rules fired, flagged transactions, etc.
    """
    
    # Mock alert data
    rules_fired = random.sample([
        "STRUCT_CASH_DEP",
        "HIGH_RISK_COUNTRY", 
        "RAPID_MOVEMENT",
        "ROUND_DOLLAR",
        "VELOCITY_SPIKE",
        "PEER_DEVIATION"
    ], k=random.randint(1, 3))
    
    risk_level = "CRITICAL" if len(rules_fired) >= 3 else "HIGH" if len(rules_fired) == 2 else "MEDIUM"
    
    customer_id = generate_customer_id()
    
    flagged_txns = [generate_transaction_id() for _ in range(random.randint(3, 12))]
    
    return {
        "alert_id": alert_id,
        "status": "OPEN",
        "created_date": random_date(30),
        "assigned_to": "John Smith",
        "customer_id": customer_id,
        "customer_name": random.choice([
            "Acme Trading LLC",
            "Global Imports Inc", 
            "Pacific Ventures",
            "Metro Services Corp",
            "Sunrise Enterprises"
        ]),
        "risk_level": risk_level,
        "rules_fired": rules_fired,
        "rule_count": len(rules_fired),
        "alert_window": {
            "start_date": random_date(60),
            "end_date": random_date(10)
        },
        "flagged_transactions": flagged_txns,
        "total_flagged_volume": round(sum([random_amount(5000, 50000) for _ in flagged_txns]), 2),
        "alert_score": round(random.uniform(65, 95), 1),
        "previous_alerts": random.randint(0, 3),
        "account_age_days": random.randint(180, 1800)
    }


# ═══════════════════════════════════════════════════════════════════
# TOOL 2: SEARCH TRANSACTIONS
# ═══════════════════════════════════════════════════════════════════

def search_transactions(
    customer_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    transaction_type: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Search and retrieve transaction history for a customer.
    
    Args:
        customer_id: Customer identifier
        start_date: Start date filter (YYYY-MM-DD)
        end_date: End date filter (YYYY-MM-DD)
        min_amount: Minimum transaction amount
        max_amount: Maximum transaction amount
        transaction_type: Filter by type (CASH_DEP, WIRE_IN, WIRE_OUT, ACH, CHECK)
    
    Returns:
        List of transaction records
    """
    
    txn_types = ["CASH_DEP", "WIRE_IN", "WIRE_OUT", "ACH", "CHECK", "ATM_WITHDRAWAL"]
    
    num_txns = random.randint(5, 20)
    transactions = []
    
    for _ in range(num_txns):
        txn_type = transaction_type if transaction_type else random.choice(txn_types)
        amount = random_amount(min_amount or 100, max_amount or 50000)
        
        txn = {
            "transaction_id": generate_transaction_id(),
            "customer_id": customer_id,
            "date": random_date(90),
            "type": txn_type,
            "amount": amount,
            "currency": "USD",
            "description": random.choice([
                "Business deposit",
                "Wire transfer",
                "Cash deposit",
                "Check deposit",
                "ATM withdrawal",
                "International wire"
            ]),
            "counterparty": random.choice([
                "ABC Corp",
                "XYZ Trading",
                "Global Partners",
                "Metro Bank",
                None
            ]),
            "location": random.choice([
                "Branch 001 - Downtown",
                "Branch 005 - Midtown",
                "ATM Network",
                "Online Banking",
                None
            ]),
            "flags": random.sample(["ROUND_DOLLAR", "HIGH_RISK_COUNTRY", "VELOCITY"], k=random.randint(0, 2))
        }
        
        transactions.append(txn)
    
    # Sort by date descending
    transactions.sort(key=lambda x: x["date"], reverse=True)
    
    return transactions


# ═══════════════════════════════════════════════════════════════════
# TOOL 3: GET CUSTOMER PROFILE
# ═══════════════════════════════════════════════════════════════════

def get_customer_profile(customer_id: str) -> Dict[str, Any]:
    """
    Retrieve customer KYC profile and account information.
    
    Args:
        customer_id: Customer identifier
    
    Returns:
        Dict containing customer profile, KYC data, risk rating
    """
    
    business_types = [
        "Import/Export Trading",
        "Retail Services",
        "Consulting Services",
        "Real Estate",
        "Construction",
        "Technology Services"
    ]
    
    return {
        "customer_id": customer_id,
        "customer_name": random.choice([
            "Acme Trading LLC",
            "Global Imports Inc",
            "Pacific Ventures",
            "Metro Services Corp"
        ]),
        "customer_type": random.choice(["BUSINESS", "INDIVIDUAL"]),
        "account_opened": random_date(1800),
        "kyc_status": random.choice(["CURRENT", "NEEDS_REFRESH", "EXPIRED"]),
        "kyc_last_updated": random_date(365),
        "business_type": random.choice(business_types),
        "industry_code": f"NAICS{random.randint(100000, 999999)}",
        "expected_activity": {
            "monthly_volume": random_amount(50000, 500000),
            "transaction_types": ["CASH_DEP", "WIRE_IN", "WIRE_OUT", "CHECK"],
            "geographic_scope": random.choice(["DOMESTIC", "INTERNATIONAL", "REGIONAL"])
        },
        "risk_rating": random.choice(["LOW", "MEDIUM", "HIGH"]),
        "pep_status": random.choice([False, False, False, True]),  # 25% chance
        "sanctions_hit": False,
        "adverse_media": random.choice([False, False, True]),  # 33% chance
        "beneficial_owners": [
            {
                "name": f"Owner {i+1}",
                "ownership_pct": random.randint(20, 50),
                "pep_status": False
            }
            for i in range(random.randint(1, 3))
        ],
        "addresses": [
            {
                "type": "BUSINESS",
                "street": f"{random.randint(100, 9999)} Main St",
                "city": random.choice(["New York", "Los Angeles", "Chicago", "Miami"]),
                "state": random.choice(["NY", "CA", "IL", "FL"]),
                "country": "USA"
            }
        ],
        "phone": f"+1-{random.randint(200, 999)}-{random.randint(200, 999)}-{random.randint(1000, 9999)}",
        "email": f"contact@customer{random.randint(100, 999)}.com"
    }


# ═══════════════════════════════════════════════════════════════════
# TOOL 4: ANALYZE NETWORK
# ═══════════════════════════════════════════════════════════════════

def analyze_network(customer_id: str, depth: int = 2) -> Dict[str, Any]:
    """
    Analyze transaction network and identify connected entities.
    
    Args:
        customer_id: Customer identifier
        depth: Network depth to analyze (1-3)
    
    Returns:
        Dict containing network graph, connected entities, circular flows
    """
    
    num_connections = random.randint(3, 8)
    connections = []
    
    for i in range(num_connections):
        connected_id = generate_customer_id()
        connections.append({
            "entity_id": connected_id,
            "entity_name": f"Entity {chr(65+i)}",
            "relationship_type": random.choice([
                "FREQUENT_COUNTERPARTY",
                "SHARED_ADDRESS",
                "SHARED_OFFICER",
                "WIRE_PARTNER"
            ]),
            "transaction_count": random.randint(5, 50),
            "total_volume": random_amount(10000, 500000),
            "risk_score": round(random.uniform(30, 85), 1)
        })
    
    # Detect potential circular flows
    circular_flows = []
    if random.random() > 0.6:  # 40% chance of circular flow
        flow_entities = random.sample(connections, min(3, len(connections)))
        circular_flows.append({
            "pattern": "CIRCULAR",
            "entities": [e["entity_id"] for e in flow_entities],
            "total_amount": random_amount(50000, 200000),
            "time_span_days": random.randint(7, 30),
            "suspicion_score": round(random.uniform(60, 90), 1)
        })
    
    return {
        "customer_id": customer_id,
        "analysis_depth": depth,
        "total_connections": len(connections),
        "connections": connections,
        "circular_flows": circular_flows,
        "network_risk_score": round(random.uniform(40, 80), 1),
        "high_risk_connections": len([c for c in connections if c["risk_score"] > 70]),
        "shared_infrastructure": random.choice([True, False]),
        "layering_detected": len(circular_flows) > 0
    }


# ═══════════════════════════════════════════════════════════════════
# TOOL 5: CHECK SANCTIONS
# ═══════════════════════════════════════════════════════════════════

def check_sanctions(entity_name: str, entity_type: str = "INDIVIDUAL") -> Dict[str, Any]:
    """
    Screen entity against sanctions lists (OFAC, UN, EU, etc.).
    
    Args:
        entity_name: Name to screen
        entity_type: INDIVIDUAL or BUSINESS
    
    Returns:
        Dict containing screening results and any hits
    """
    
    # 95% no hit, 5% potential match
    has_hit = random.random() < 0.05
    
    result = {
        "entity_name": entity_name,
        "entity_type": entity_type,
        "screening_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "lists_checked": ["OFAC_SDN", "UN_CONSOLIDATED", "EU_SANCTIONS", "UK_HMT"],
        "total_hits": 0,
        "matches": []
    }
    
    if has_hit:
        result["total_hits"] = 1
        result["matches"].append({
            "list": random.choice(["OFAC_SDN", "UN_CONSOLIDATED"]),
            "match_name": entity_name,
            "match_score": round(random.uniform(85, 98), 1),
            "match_type": "POTENTIAL",
            "entity_type": entity_type,
            "program": random.choice(["NARCOTICS", "TERRORISM", "CYBER", "IRAN"]),
            "added_date": random_date(1800),
            "requires_review": True
        })
    
    return result


# ═══════════════════════════════════════════════════════════════════
# TOOL 6: CALCULATE BASELINE
# ═══════════════════════════════════════════════════════════════════

def calculate_baseline(customer_id: str, period_days: int = 90) -> Dict[str, Any]:
    """
    Calculate customer's normal transaction baseline for comparison.
    
    Args:
        customer_id: Customer identifier
        period_days: Historical period to analyze (default 90 days)
    
    Returns:
        Dict containing baseline metrics and deviation analysis
    """
    
    baseline_monthly = random_amount(20000, 200000)
    alert_monthly = baseline_monthly * random.uniform(1.5, 4.0)
    
    return {
        "customer_id": customer_id,
        "analysis_period_days": period_days,
        "baseline_metrics": {
            "avg_monthly_volume": round(baseline_monthly, 2),
            "avg_transaction_size": random_amount(1000, 10000),
            "transaction_frequency": random.randint(10, 50),
            "cash_deposit_ratio": round(random.uniform(0.1, 0.4), 2),
            "wire_ratio": round(random.uniform(0.2, 0.6), 2)
        },
        "alert_period_metrics": {
            "monthly_volume": round(alert_monthly, 2),
            "avg_transaction_size": random_amount(5000, 20000),
            "transaction_frequency": random.randint(20, 80)
        },
        "deviations": {
            "volume_deviation_pct": round(((alert_monthly - baseline_monthly) / baseline_monthly) * 100, 1),
            "frequency_deviation_pct": round(random.uniform(50, 200), 1),
            "size_deviation_pct": round(random.uniform(30, 150), 1)
        },
        "is_significant_deviation": alert_monthly > baseline_monthly * 1.5,
        "deviation_score": round(random.uniform(60, 90), 1)
    }


# ═══════════════════════════════════════════════════════════════════
# TOOL 7: SEARCH KEYWORDS
# ═══════════════════════════════════════════════════════════════════

def search_keywords(customer_id: str, keywords: List[str]) -> Dict[str, Any]:
    """
    Search transaction descriptions and notes for suspicious keywords.
    
    Args:
        customer_id: Customer identifier
        keywords: List of keywords to search for
    
    Returns:
        Dict containing keyword matches and flagged transactions
    """
    
    suspicious_keywords = [
        "loan", "gift", "family", "friend", "cash", "business expense",
        "consulting", "services", "payment", "reimbursement"
    ]
    
    matches = []
    
    # Generate some random matches
    num_matches = random.randint(0, 5)
    for _ in range(num_matches):
        keyword = random.choice(keywords if keywords else suspicious_keywords)
        matches.append({
            "transaction_id": generate_transaction_id(),
            "date": random_date(60),
            "amount": random_amount(1000, 20000),
            "description": f"Transaction for {keyword} services",
            "keyword_matched": keyword,
            "context": random.choice([
                "Memo field",
                "Wire instructions",
                "Check memo",
                "Description"
            ])
        })
    
    return {
        "customer_id": customer_id,
        "keywords_searched": keywords if keywords else suspicious_keywords,
        "total_matches": len(matches),
        "matches": matches,
        "high_risk_keywords_found": [m["keyword_matched"] for m in matches if m["keyword_matched"] in ["loan", "gift", "cash"]],
        "requires_review": len(matches) > 2
    }


# ═══════════════════════════════════════════════════════════════════
# TOOL 8: VERIFY INCOME
# ═══════════════════════════════════════════════════════════════════

def verify_income(customer_id: str) -> Dict[str, Any]:
    """
    Verify customer's stated income/revenue against transaction activity.
    
    Args:
        customer_id: Customer identifier
    
    Returns:
        Dict containing income verification results and discrepancies
    """
    
    stated_income = random_amount(100000, 1000000)
    observed_volume = stated_income * random.uniform(0.5, 3.0)
    
    discrepancy_pct = abs(observed_volume - stated_income) / stated_income * 100
    
    return {
        "customer_id": customer_id,
        "stated_annual_income": round(stated_income, 2),
        "income_source": random.choice([
            "Business Revenue",
            "Salary",
            "Investment Income",
            "Rental Income",
            "Multiple Sources"
        ]),
        "documentation_provided": random.choice([
            "Tax Returns (2 years)",
            "Bank Statements",
            "Financial Statements",
            "None"
        ]),
        "observed_annual_volume": round(observed_volume, 2),
        "discrepancy_pct": round(discrepancy_pct, 1),
        "is_consistent": discrepancy_pct < 50,
        "red_flags": [
            "Volume exceeds stated income by >100%"
        ] if discrepancy_pct > 100 else [],
        "verification_status": "VERIFIED" if discrepancy_pct < 30 else "QUESTIONABLE" if discrepancy_pct < 100 else "INCONSISTENT"
    }


# ═══════════════════════════════════════════════════════════════════
# TOOL 9: CALCULATE RISK SCORE
# ═══════════════════════════════════════════════════════════════════

def calculate_risk_score(factors: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate comprehensive risk score based on investigation findings.
    
    Args:
        factors: Dict of risk factors with weights
            Example: {
                "structuring_detected": 0.35,
                "high_risk_country": 0.25,
                "kyc_expired": 0.15,
                ...
            }
    
    Returns:
        Dict containing risk score, breakdown, and recommendation
    """
    
    # Calculate weighted score
    total_score = sum(factors.values()) * 100
    
    # Determine recommendation
    if total_score >= 75:
        recommendation = "ESCALATE"
        confidence = round(random.uniform(85, 95), 1)
    elif total_score >= 50:
        recommendation = "REVIEW"
        confidence = round(random.uniform(70, 85), 1)
    else:
        recommendation = "CLEAR"
        confidence = round(random.uniform(60, 75), 1)
    
    return {
        "risk_score": round(total_score, 1),
        "risk_level": "CRITICAL" if total_score >= 80 else "HIGH" if total_score >= 60 else "MEDIUM" if total_score >= 40 else "LOW",
        "factors_analyzed": len(factors),
        "factor_breakdown": [
            {
                "factor": factor,
                "weight": weight,
                "contribution": round(weight * 100, 1)
            }
            for factor, weight in sorted(factors.items(), key=lambda x: x[1], reverse=True)
        ],
        "recommendation": recommendation,
        "confidence": confidence,
        "requires_sar": total_score >= 75,
        "requires_edd": total_score >= 60,
        "calculated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


# ═══════════════════════════════════════════════════════════════════
# TOOL REGISTRY
# ═══════════════════════════════════════════════════════════════════

TOOL_REGISTRY = {
    "get_alert_details": {
        "function": get_alert_details,
        "description": "Retrieve comprehensive alert metadata and triggering information",
        "parameters": ["alert_id"],
        "returns": "Alert details including rules fired, flagged transactions, risk level"
    },
    "search_transactions": {
        "function": search_transactions,
        "description": "Search and retrieve transaction history for a customer",
        "parameters": ["customer_id", "start_date", "end_date", "min_amount", "max_amount", "transaction_type"],
        "returns": "List of transaction records with amounts, types, counterparties"
    },
    "get_customer_profile": {
        "function": get_customer_profile,
        "description": "Retrieve customer KYC profile and account information",
        "parameters": ["customer_id"],
        "returns": "Customer profile with KYC status, business type, risk rating, beneficial owners"
    },
    "analyze_network": {
        "function": analyze_network,
        "description": "Analyze transaction network and identify connected entities",
        "parameters": ["customer_id", "depth"],
        "returns": "Network graph with connections, circular flows, layering detection"
    },
    "check_sanctions": {
        "function": check_sanctions,
        "description": "Screen entity against sanctions lists (OFAC, UN, EU)",
        "parameters": ["entity_name", "entity_type"],
        "returns": "Screening results with any hits and match scores"
    },
    "calculate_baseline": {
        "function": calculate_baseline,
        "description": "Calculate customer's normal transaction baseline for comparison",
        "parameters": ["customer_id", "period_days"],
        "returns": "Baseline metrics and deviation analysis"
    },
    "search_keywords": {
        "function": search_keywords,
        "description": "Search transaction descriptions for suspicious keywords",
        "parameters": ["customer_id", "keywords"],
        "returns": "Keyword matches in transaction descriptions and memos"
    },
    "verify_income": {
        "function": verify_income,
        "description": "Verify customer's stated income against transaction activity",
        "parameters": ["customer_id"],
        "returns": "Income verification with discrepancy analysis"
    },
    "calculate_risk_score": {
        "function": calculate_risk_score,
        "description": "Calculate comprehensive risk score based on investigation findings",
        "parameters": ["factors"],
        "returns": "Risk score, breakdown, and disposition recommendation"
    }
}


def get_tool(tool_name: str):
    """Get tool function by name"""
    if tool_name not in TOOL_REGISTRY:
        raise ValueError(f"Tool '{tool_name}' not found in registry")
    return TOOL_REGISTRY[tool_name]["function"]


def list_tools() -> List[str]:
    """List all available tools"""
    return list(TOOL_REGISTRY.keys())


def get_tool_info(tool_name: str) -> Dict[str, Any]:
    """Get tool metadata"""
    if tool_name not in TOOL_REGISTRY:
        raise ValueError(f"Tool '{tool_name}' not found in registry")
    return TOOL_REGISTRY[tool_name]
