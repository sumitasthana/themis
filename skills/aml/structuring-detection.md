---
name: structuring-detection
description: Detect and analyze cash structuring patterns (smurfing) to evade CTR reporting
version: 1.0.0
author: Themis Platform
metadata:
  hermes:
    tags: [aml, structuring, cash, typology]
    category: aml
---

# Cash Structuring Detection

Identify and analyze structuring patterns where customers make multiple deposits below the $10,000 CTR threshold to evade reporting requirements.

## When to Use

- Alert triggered by StructuredDeposits or RapidCashDeposits rules
- Multiple cash deposits in short timeframe
- Deposits systematically below $10,000
- Multi-branch deposit patterns
- Customer with no historical cash activity suddenly depositing cash

## What is Structuring?

**Definition**: Breaking up large cash deposits into smaller amounts (typically <$10,000) to avoid Currency Transaction Report (CTR) filing requirements.

**Legal basis**: 31 USC 5324 - Structuring transactions to evade reporting is a federal crime, even if the source funds are legitimate.

## Detection Indicators

### Primary Red Flags

1. **Sub-threshold amounts**: Multiple deposits of $9,000-$9,900
2. **Same-day multi-branch**: 2+ branches visited same day
3. **Sequential days**: Deposits on consecutive or near-consecutive days
4. **Round amounts near threshold**: $9,000, $9,500, $9,800
5. **Geographic dispersion**: Branches in different cities/counties
6. **Timing patterns**: Deposits clustered in specific time windows

### Secondary Indicators

- Customer has no historical cash activity
- Occupation doesn't explain cash (e.g., software engineer)
- Deposits stop immediately after reaching target amount
- Customer appears nervous or evasive (branch notes)
- Multiple people depositing to same account (smurfing)

## Investigation Procedure

### Step 1: Identify Deposit Pattern

**Tool**: `search_transactions(alert_id, flagged=true, category='cash_deposit')`

Gather all flagged cash deposits:
- Count total deposits
- Calculate average amount
- Identify date range
- Map branch locations
- Check for round amounts

**Structuring confirmed if:**
- 3+ deposits in 30 days
- Average amount $8,500-$9,900
- All below $10,000 threshold
- Multiple branches used

### Step 2: Calculate Aggregated CTR Threshold

**Tool**: `calculate(operation='ctr_aggregation', alert_id=alert_id)`

Determine if CTRs should have been filed:
- Sum all deposits in rolling 24-hour windows
- Sum all deposits in rolling 7-day windows
- Identify periods exceeding $10,000

**CTR filing required if:**
- Any 24-hour period > $10,000
- Systematic pattern indicates intent to evade

### Step 3: Check Historical Cash Activity

**Tool**: `get_baseline_summary(customer_id, lookback_days=365, transaction_types=['cash_deposit'])`

Compare to historical baseline:
- Cash deposits in past 12 months
- Typical cash deposit amounts
- Frequency of cash activity

**Red flag if:**
- Zero cash deposits in baseline
- Sudden spike in cash activity
- No business reason for cash

### Step 4: Verify Occupation & Business Type

**Tool**: `get_customer_details(customer_id)`

Check if occupation explains cash:

**Cash-intensive businesses** (legitimate):
- Retail stores (convenience, liquor, gas stations)
- Restaurants and bars
- Laundromats
- Car washes
- Vending machine operators

**Non-cash businesses** (suspicious):
- Software engineers
- Consultants (unless cash-based clients)
- Office workers
- Remote employees

### Step 5: Geographic Dispersion Analysis

**Tool**: `analyze_geographic_pattern(customer_id, transaction_type='cash_deposit')`

Map branch locations:
- Count unique branches
- Calculate distances between branches
- Check if branches are on logical route (commute) or deliberate dispersion

**Deliberate dispersion indicators:**
- 3+ branches in different counties
- Branches not on commute route
- No logical reason for branch selection
- Branches visited in rapid succession (1-2 hours apart)

### Step 6: Timing Pattern Analysis

Check deposit timing:
- Same time of day (e.g., always 9-10am)
- Same day of week
- Immediately after payroll
- Stops after target amount reached

**Suspicious patterns:**
- Deposits stop exactly when aggregate reaches target
- Systematic timing (every Tuesday at 9am)
- No deposits after alert triggered (awareness)

### Step 7: Cross-Reference with Income

**Tool**: `calculate(operation='income_verification', alert_id=alert_id)`

Compare cash deposits to stated income:
- Total cash deposits vs annual income
- Source of cash explained?
- Documentation available?

**For cash businesses:**
- Request sales records
- Verify business license
- Check merchant processor statements
- Validate cash makes sense for business size

## Structuring Typologies

### Type 1: Classic Structuring
- Customer makes 5-10 deposits of $9,000-$9,900
- All at same branch or 2-3 nearby branches
- Over 7-14 day period
- **Intent**: Avoid single $50K+ deposit triggering CTR

### Type 2: Multi-Branch Smurfing
- Customer visits 5+ branches in single day
- Each deposit $3,000-$5,000
- Total exceeds $10,000 in 24 hours
- **Intent**: Evade CTR by geographic dispersion

### Type 3: Systematic Structuring
- Weekly deposits of $9,500 for 8-12 weeks
- Always same amount, same day
- Stops after reaching target ($75K-$100K)
- **Intent**: Long-term evasion pattern

### Type 4: Third-Party Smurfing
- Multiple individuals deposit cash to same account
- Each person deposits <$10,000
- Coordinated timing
- **Intent**: Use multiple people to evade detection

## Decision Criteria

### ESCALATE if:
- 5+ deposits averaging $9,000-$9,900
- 3+ branches used with no logical explanation
- No cash activity in 12-month baseline
- Occupation doesn't explain cash
- Customer can't document source of funds
- Pattern stops after alert triggered

**Confidence**: 85-95%

### CLEAR if:
- Cash-intensive business with documentation
- Deposits align with business revenue
- Branch selection has logical explanation (commute route)
- Historical cash activity consistent
- Sales records validate amounts

**Confidence**: 80-90%

### REVIEW if:
- Borderline cash business (e.g., small retail)
- Some documentation but gaps
- 3-4 deposits (not systematic pattern)
- Need to request additional documentation

**Confidence**: 60-75%

## Documentation Requirements

For CLEAR decision on cash business:
- [ ] Business license verified
- [ ] Sales records reviewed (if available)
- [ ] Merchant processor statements checked
- [ ] Business size validates cash volume
- [ ] No prior structuring alerts

For ESCALATE decision:
- [ ] Structuring pattern documented (count, amounts, dates)
- [ ] Branch dispersion mapped
- [ ] Lack of business explanation documented
- [ ] Income ratio calculated
- [ ] CTR aggregation analysis completed

## Pitfalls

### False Positive: Legitimate Cash Business
A convenience store owner depositing $9,200 daily is NOT structuring if:
- Business is verified and active
- Deposits align with business size
- Consistent historical pattern
- No branch-hopping behavior

**Solution**: Always verify business legitimacy before escalating.

### False Positive: Payroll Timing
Employee depositing $9,500 every two weeks matching payroll dates is likely legitimate if:
- Amount matches stated salary
- Timing aligns with employer payroll schedule
- No multi-branch pattern

**Solution**: Check payroll ACH history for validation.

### Missing Context: Large Purchase
Customer depositing $9,800 x 3 over one week might be saving for large purchase (car, home down payment) from legitimate source.

**Solution**: Check for corresponding large outflow (wire, check) shortly after.

## Regulatory Notes

**31 USC 5324**: Structuring transactions to evade CTR reporting is illegal regardless of source fund legitimacy.

**FinCEN Guidance**: Financial institutions must file SARs on structuring even if the customer is not charged criminally.

**Safe Harbor**: Filing a SAR on structuring provides safe harbor from civil liability.

## Related Skills

- `alert-investigation.md` - Main investigation workflow
- `kyc-verification.md` - Verify business legitimacy
- `narrative-generation.md` - SAR narrative for structuring cases
