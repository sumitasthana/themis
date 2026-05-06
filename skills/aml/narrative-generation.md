---
name: narrative-generation
description: Generate SAR-compliant investigation narratives with proper structure and regulatory format
version: 1.0.0
author: Themis Platform
metadata:
  hermes:
    tags: [aml, sar, narrative, reporting]
    category: aml
---

# SAR Narrative Generation

Generate comprehensive, SAR-compliant investigation narratives that document findings, evidence, and disposition decisions.

## When to Use

- Final step of alert investigation (Step 9-10)
- After decision is made (CLEAR or ESCALATE)
- Before closing alert or filing SAR
- For audit trail and regulatory review

## SAR Narrative Requirements

### FinCEN SAR Format

**Required sections:**
1. **Subject Information** - Who is involved
2. **Suspicious Activity** - What happened
3. **Investigation Summary** - How it was investigated
4. **Evidence & Findings** - What was discovered
5. **Risk Assessment** - Why it's suspicious (or not)
6. **Disposition** - What action was taken

### Narrative Guidelines

**Length:**
- CLEAR decisions: 600-900 words
- ESCALATE decisions: 900-1,200 words
- Complex cases: Up to 2,000 words

**Tone:**
- Professional and objective
- Fact-based, not speculative
- Clear and concise
- Avoid jargon (or define it)

**Format:**
- Chronological order
- Bullet points for lists
- Tables for data
- Clear section headers

## Narrative Structure

### Section 1: Opening Summary (100-150 words)

**Include:**
- Alert ID and trigger date
- Customer name and ID
- Rules/typologies that fired
- Alert window period
- Total flagged volume
- Current account status

**Template:**
```
Alert [ALERT-ID] was triggered on [DATE] for customer [NAME] ([CUSTOMER-ID]) 
based on [RULES FIRED]. The alert covered a [X]-day window from [START] to [END], 
during which [X] transactions totaling $[AMOUNT] were flagged for review. 
The customer's account has been [ACTIVE/UNDER REVIEW/FROZEN] since alert detection.
```

**Example:**
```
Alert ALERT-0109 was triggered on December 12, 2025 for customer Neal Hall 
(C-4490-0109) based on HighRiskKeyword, VelocityIncrease, and StructuredDeposits 
rules. The alert covered a 30-day window from November 12 to December 12, 2025, 
during which 9 transactions totaling $1,250,000 inflow and $980,000 outflow were 
flagged for review. The customer's account has been under enhanced monitoring 
since alert detection.
```

### Section 2: Customer Profile (150-200 words)

**Include:**
- Personal/business information
- Occupation and stated income
- Account opening date and type
- Customer risk score
- Prior alert history
- KYC status
- PEP/sanctions screening results
- Beneficial ownership (if entity)

**Template:**
```
[NAME] is a [AGE]-year-old [OCCUPATION] residing at [ADDRESS]. The customer 
opened a [ACCOUNT TYPE] account on [DATE] ([X] years ago) with stated annual 
income of $[AMOUNT]. The customer's baseline risk score is [SCORE] ([LEVEL]), 
and the alert-specific risk score is [SCORE] ([LEVEL]).

[If entity: The customer operates [BUSINESS NAME], a [TYPE] entity incorporated 
in [STATE] on [DATE]. Beneficial ownership: [OWNERS].]

KYC status: [CURRENT/STALE - last refreshed [DATE]]. PEP screening: [RESULTS]. 
Sanctions screening: [RESULTS]. Prior alert history: [COUNT] alerts, [OUTCOMES].
```

### Section 3: Investigation Summary (200-300 words)

**Include:**
- Investigation steps performed (list all 9-10 steps)
- Tools executed
- Data sources queried
- Timeframe of investigation
- Investigators involved

**Template:**
```
A comprehensive investigation was conducted from [START DATE] to [END DATE] 
by [INVESTIGATOR NAME/SYSTEM]. The investigation consisted of [X] steps:

1. Alert Details Retrieval - Retrieved alert metadata and triggered rules
2. Customer Profile & KYC Review - Gathered customer context and risk factors
3. Flagged Transaction Retrieval - Analyzed [X] flagged transactions
4. Baseline Transaction Summary - Established 90-day baseline behavior
5. Income Verification Calculation - Calculated income ratios and anomalies
6. High-Risk Keyword Search - Searched for [X] keywords in descriptions
7. Representative Window Analysis - Analyzed [X] time windows
8. Network & Circular Movement Analysis - Mapped fund flows and counterparties
9. Risk Factor Synthesis & Decision - Weighted [X] risk factors
10. Narrative Generation - Documented findings in this narrative

All investigation steps were completed successfully with [X]% tool execution rate.
```

### Section 4: Flagged Transactions (200-300 words)

**Include:**
- Count and total volume
- Transaction types and patterns
- Dates and timing
- Counterparties
- Geographic locations
- Risk indicators

**For structuring cases:**
```
The investigation identified [X] cash deposits totaling $[AMOUNT] over [X] days:

| Date | Branch | Amount | Risk Indicators |
|------|--------|--------|-----------------|
| [DATE] | [LOCATION] | $[AMT] | Sub-threshold, multi-branch |
| [DATE] | [LOCATION] | $[AMT] | Sub-threshold, multi-branch |

All deposits were below the $10,000 CTR threshold, averaging $[AVG]. The customer 
visited [X] different branch locations across [X] counties, indicating deliberate 
geographic dispersion. Combined deposits totaled $[AMOUNT], which would have 
triggered [X] CTRs if aggregated properly.
```

**For network cases:**
```
The investigation identified a circular fund movement pattern:

[CUSTOMER A] → [ENTITY B] ($[AMT], [DATE])
[ENTITY B] → [ENTITY C] ($[AMT], [DATE])
[ENTITY C] → [CUSTOMER A] ($[AMT], [DATE])

Total haircut: $[AMT] ([X]%) absorbed by intermediary entities. Network analysis 
confidence: [X]%. Timeframe: [X] days from initial outflow to return.
```

### Section 5: Baseline Analysis (150-200 words)

**Include:**
- 90-day baseline summary
- Average monthly inflow/outflow
- Typical transaction types
- Historical cash activity
- Comparison to alert window

**Template:**
```
Baseline analysis covered [X] days from [START] to [END], excluding the alert 
window. During this period, the customer had:

- Total inflow: $[AMOUNT] across [X] transactions
- Average monthly inflow: $[AMOUNT]
- Typical transaction size: $[AMOUNT]
- Cash deposits: [COUNT] totaling $[AMOUNT] (or NONE)
- Largest single transaction: $[AMOUNT] ([TYPE])

Alert window comparison:
- Alert inflow: $[AMOUNT] vs baseline monthly average $[AMOUNT] = [X]x spike
- Cash activity: [NONE in baseline → $[AMOUNT] in alert = entirely new behavior]
- Transaction velocity: [X]% above baseline

Conclusion: [Alert activity is/is not consistent with historical behavior.]
```

### Section 6: Income Verification (100-150 words)

**Include:**
- Stated income
- Observed inflow (baseline + alert)
- Annualized projection
- Income ratio
- Explanation (if applicable)

**Template:**
```
Income verification analysis:

- Stated annual income: $[AMOUNT]
- Baseline inflow (90-day): $[AMOUNT] → annualized: $[AMOUNT]
- Alert window inflow: $[AMOUNT]
- Combined observed inflow: $[AMOUNT] → annualized: $[AMOUNT]
- Income ratio: [X]x stated income

[If ratio >3x: This ratio is [ELEVATED/HIGHLY ANOMALOUS]. For [OCCUPATION TYPE], 
acceptable ratios typically range [X-X]x. The observed ratio of [X]x [EXCEEDS/
IS WITHIN] normal variance.]

[If cash business: For cash-intensive businesses, gross revenue commonly exceeds 
owner income by 4-8x depending on margin. A [BUSINESS TYPE] with $[INCOME] owner 
income could plausibly generate $[RANGE] in gross sales.]
```

### Section 7: Risk Factor Matrix (200-300 words)

**Include:**
- All suspicious indicators with weights
- All mitigating factors with weights
- Net risk score
- Decision rationale

**Template:**
```
Risk factor synthesis identified [X] suspicious indicators and [X] mitigating factors:

SUSPICIOUS INDICATORS:
1. [FACTOR NAME] (weight: [X]) - [DETAIL]
2. [FACTOR NAME] (weight: [X]) - [DETAIL]
3. [FACTOR NAME] (weight: [X]) - [DETAIL]
...

Total suspicious weight: [X]

MITIGATING FACTORS:
1. [FACTOR NAME] (weight: [X]) - [DETAIL]
2. [FACTOR NAME] (weight: [X]) - [DETAIL]
...

Total mitigating weight: [X]

NET RISK SCORE: [X] ([LEVEL])

DECISION RATIONALE:
[For CLEAR: The weight of evidence supports legitimate business activity. While 
[SUSPICIOUS INDICATORS] were identified, these are outweighed by [MITIGATING 
FACTORS]. Specifically, [KEY MITIGATING FACTOR] provides a benign explanation 
for the flagged activity.]

[For ESCALATE: The suspicious indicators clearly outweigh mitigating factors. 
Specifically, [CRITICAL FACTOR] combined with [OTHER FACTORS] indicate [TYPOLOGY]. 
No benign explanation was found for [KEY SUSPICIOUS ACTIVITY].]
```

### Section 8: Final Disposition (100-150 words)

**Include:**
- Decision (CLEAR or ESCALATE)
- Confidence score
- Regulatory basis (if ESCALATE)
- Next steps
- Residual concerns (if any)

**Template for CLEAR:**
```
FINAL DISPOSITION: CLEAR (False Positive)
CONFIDENCE: [X]%

Based on the comprehensive investigation, this alert is recommended for clearance. 
The flagged activity is consistent with [LEGITIMATE EXPLANATION]. All suspicious 
indicators have been investigated and explained. No substantive suspicious behavior 
was confirmed.

RESIDUAL CONCERNS: [NONE or describe minor concerns that don't warrant escalation]

NEXT STEPS: Close alert. No SAR filing required. [If applicable: Recommend KYC 
refresh within 30 days due to stale documentation.]
```

**Template for ESCALATE:**
```
FINAL DISPOSITION: ESCALATE
CONFIDENCE: [X]%
REGULATORY BASIS: 31 USC 5318(g) - Suspicious Activity Reporting

Based on the comprehensive investigation, this alert is recommended for escalation 
and SAR filing. The evidence indicates [TYPOLOGY] consistent with money laundering 
typologies. Specifically, [CRITICAL FINDINGS].

SAR FILING DEADLINE: [DATE] (30 days from initial detection)

NEXT STEPS:
1. Create case [CASE-ID] - Assigned to [INVESTIGATOR] - Priority: [LEVEL]
2. Contact customer for documentation (if applicable)
3. Submit FinCEN 314(b) query (if applicable)
4. Prepare SAR draft [SAR-ID]
5. [If CRITICAL: Notify compliance officer immediately]

RESIDUAL CONCERNS: [Describe any unresolved questions or areas needing follow-up]
```

## Narrative Quality Checklist

Before finalizing narrative, verify:

- [ ] All required sections included
- [ ] Word count appropriate (600-1,200 words)
- [ ] Tone is professional and objective
- [ ] All facts are accurate and sourced
- [ ] All tools/steps documented
- [ ] Risk factors weighted and explained
- [ ] Decision clearly stated with confidence
- [ ] Regulatory basis cited (if ESCALATE)
- [ ] Next steps identified
- [ ] No typos or grammatical errors
- [ ] Tables/bullets formatted correctly
- [ ] Dates in consistent format (YYYY-MM-DD)
- [ ] Dollar amounts formatted ($X,XXX)

## Common Narrative Mistakes

### Mistake 1: Speculation Without Evidence

**Wrong:**
"The customer is probably involved in drug trafficking."

**Right:**
"The customer's transaction pattern (9 cash deposits averaging $9,212 across 5 branches) is consistent with structuring typology commonly associated with placement of illicit funds."

### Mistake 2: Incomplete Investigation Documentation

**Wrong:**
"We reviewed the transactions and they look suspicious."

**Right:**
"A 9-step investigation was conducted including: (1) alert details retrieval, (2) customer profile review, (3) flagged transaction analysis, (4) 90-day baseline establishment, (5) income verification, (6) keyword search, (7) window analysis, (8) network analysis, and (9) risk factor synthesis."

### Mistake 3: Missing Risk Factor Weights

**Wrong:**
"The customer has several red flags including structuring and shell entities."

**Right:**
"Risk factor analysis identified structuring (weight: 0.35), shell entity network (weight: 0.28), and real estate layering risk (weight: 0.20), totaling 0.83 suspicious weight vs 0.26 mitigating weight."

### Mistake 4: Vague Disposition

**Wrong:**
"This alert should probably be escalated."

**Right:**
"FINAL DISPOSITION: ESCALATE. Confidence: 80%. Regulatory basis: 31 USC 5318(g). SAR filing deadline: January 11, 2026."

## Regulatory References

- **FinCEN SAR Instructions**: Narrative field requirements
- **31 USC 5318(g)**: Suspicious Activity Reporting requirements
- **FFIEC BSA/AML Manual**: SAR narrative best practices
- **FinCEN Advisory**: Structuring narrative examples

## Related Skills

- `alert-investigation.md` - Investigation workflow
- `risk-scoring.md` - Risk factor methodology
- `structuring-detection.md` - Structuring narrative examples
- `network-analysis.md` - Network narrative examples
