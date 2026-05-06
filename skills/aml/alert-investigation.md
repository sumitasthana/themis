---
name: alert-investigation
description: Comprehensive AML alert investigation workflow for compliance analysts
version: 1.0.0
author: Themis Platform
metadata:
  hermes:
    tags: [aml, compliance, investigation, workflow]
    category: aml
---

# AML Alert Investigation

Complete workflow for investigating Anti-Money Laundering alerts from trigger to disposition.

## When to Use

- When an AML alert is triggered by the transaction monitoring system
- When a compliance analyst needs to investigate suspicious activity
- When determining whether to CLEAR or ESCALATE an alert
- When preparing for potential SAR filing

## Prerequisites

- Alert ID from the monitoring system
- Access to customer data and transaction history
- Understanding of AML typologies and red flags

## Investigation Procedure

### Step 1: Alert Details Retrieval
**Tool**: `get_alert_details(alert_id)`

Retrieve the alert metadata including:
- Alert ID and trigger date
- Customer ID and basic info
- Rules/typologies that fired
- Flagged transactions list
- Alert window period
- Total flagged volume

**What to look for:**
- Multiple rules firing = higher risk
- Large flagged volumes relative to customer profile
- Recent vs historical alert patterns

### Step 2: Customer Profile & KYC Review
**Tool**: `get_customer_details(customer_id)`

Gather comprehensive customer context:
- Personal/business information
- Occupation and stated income
- Account type and opening date
- Customer risk score (baseline)
- Prior alert history
- KYC status and last refresh date
- Beneficial ownership (if entity)
- PEP/sanctions screening status

**Red flags:**
- Stale KYC (>24 months)
- Multiple prior alerts
- High customer risk score
- PEP matches
- Occupation inconsistent with activity

### Step 3: Flagged Transaction Retrieval
**Tool**: `search_transactions(alert_id, flagged=true, limit=50)`

Analyze the specific transactions that triggered the alert:
- Transaction dates, times, amounts
- Counterparties and their types
- Geographic locations
- Transaction categories
- Risk indicators

**Patterns to identify:**
- Structuring (multiple sub-$10K deposits)
- Rapid movement (funds in/out quickly)
- Geographic dispersion (multiple branches)
- Round amounts
- High-risk jurisdictions

### Step 4: Baseline Transaction Summary
**Tool**: `get_baseline_summary(customer_id, lookback_days=90, exclude_flagged=True)`

Establish normal behavior baseline:
- Average monthly inflow/outflow
- Typical transaction sizes
- Common counterparties
- Historical cash activity
- Income consistency

**Purpose:**
- Compare alert activity to normal patterns
- Identify anomalies and deviations
- Validate stated income alignment

### Step 5: Income Verification Calculation
**Tool**: `calculate(operation='income_verification', alert_id=alert_id)`

Calculate income ratios:
- Total observed inflow vs stated income
- Annualized income projection
- Ratio analysis (acceptable: 1-3x for most profiles)
- Cash-intensive business adjustments

**Thresholds:**
- 1-3x: Normal variance
- 3-8x: Elevated (may be explainable for cash businesses)
- >8x: Highly anomalous - requires documentation

### Step 6: High-Risk Keyword Search
**Tool**: `search_keyword_transactions(customer_id, keywords=[...], window_days=30)`

Search for suspicious keywords in transaction descriptions:
- Common keywords: "green light", "fronting", "owe", "clean", "wash", "layering", "offshore"
- Context matters - investigate each hit
- Distinguish between benign and suspicious usage

**Investigation steps:**
- Review full transaction description
- Check counterparty relationships
- Look for patterns across multiple transactions
- Document benign explanations (e.g., "green light" = tournament name)

### Step 7: Representative Window Analysis
**Tool**: `analyze_window(customer_id, window_1='YYYY-MM-DD:YYYY-MM-DD', window_2='...')`

Analyze 1-3 day windows to understand behavior:
- Select earliest and most recent flagged periods
- Review all transactions in those windows
- Look for contradictory activity
- Validate lifestyle consistency

**What to check:**
- Payroll deposits align with stated income
- Spending patterns match occupation
- P2P transfers have clear purpose
- No unexplained large movements

### Step 8: Network & Circular Movement Analysis
**Tool**: `analyze_network(customer_id, depth=2, include_cross_institution=True)`

Detect layering and circular movement:
- Map fund flows between accounts
- Identify shell entities
- Check for round-trip patterns
- Query FinCEN 314(b) data

**Red flags:**
- Funds return to originator
- Multiple intermediary entities
- BVI/Cayman/Panama routing
- Nominee structures
- Haircut patterns (funds absorbed by intermediaries)

### Step 9: Risk Factor Synthesis & Decision
**Tool**: `evaluate_risk(alert_id, include_factors=true)`

Synthesize all findings:
- List suspicious indicators with weights
- List mitigating factors with weights
- Calculate net risk score
- Recommend CLEAR or ESCALATE
- Assign confidence level (0-100%)

**Decision criteria:**
- CLEAR: Mitigating factors outweigh suspicious indicators, confidence >80%
- ESCALATE: Suspicious indicators dominate, confidence >70%
- REVIEW: Borderline cases, need more investigation

### Step 10: Narrative Generation
**Tool**: `generate_narrative(alert_id, decision, include_evidence=true)`

Generate SAR-compliant investigation narrative:
- Opening summary (alert trigger and customer)
- Investigation steps performed
- Evidence summary (baseline, keywords, network)
- Risk factor matrix
- Final disposition with reasoning
- Residual concerns documented

**Format requirements:**
- FinCEN SAR-compliant structure
- 800-1200 words typical
- Regulatory basis cited (31 USC 5318(g))
- Attach to alert record

## Pitfalls & Common Mistakes

### Don't Skip Baseline Analysis
Without baseline context, you can't distinguish anomalies from normal behavior. Always establish a 90-day baseline minimum.

### Context Matters for Keywords
"Green light" could be a drug deal code OR a youth soccer tournament. Always investigate the full context before flagging.

### Income Ratios Vary by Industry
Cash-intensive businesses (retail, restaurants) commonly show 4-8x ratios between gross revenue and owner income. Don't auto-escalate without understanding the business model.

### Dormant Account Reactivation
14+ months dormancy followed by large unexplained credit is a classic money laundering typology. Always check last active date.

### Document Everything
Every decision must be justified with evidence. "Gut feeling" is not sufficient for regulatory scrutiny.

### Cross-Alert Patterns
Check if the same customer or counterparties appear in multiple alerts. Network effects are critical.

## Verification Checklist

- [ ] Journal has 9-10 steps minimum
- [ ] All tools executed successfully
- [ ] Baseline established and compared
- [ ] Income ratios calculated and explained
- [ ] Keywords investigated with context
- [ ] Network analysis performed (if applicable)
- [ ] Risk factors weighted and categorized
- [ ] Decision has confidence score >70%
- [ ] Narrative is SAR-compliant format
- [ ] All evidence documented in journal

## Expected Output

**Investigation Journal** with:
- 9-10 completed steps
- Each step has: icon, title, tool name, status, summary, details
- Total investigation time: 2-5 minutes (automated)
- Final decision: CLEAR or ESCALATE
- Confidence score: 70-95%
- Narrative: 800-1200 words

## Related Skills

- `structuring-detection.md` - Deep dive on cash structuring patterns
- `kyc-verification.md` - Enhanced customer due diligence
- `network-analysis.md` - Advanced network detection techniques
- `risk-scoring.md` - Risk factor weighting methodology
- `narrative-generation.md` - SAR narrative templates

## Regulatory References

- Bank Secrecy Act (BSA) - 31 USC 5318(g)
- FinCEN SAR Filing Requirements
- FATF Recommendations (R.10, R.11, R.20)
- FFIEC BSA/AML Examination Manual
