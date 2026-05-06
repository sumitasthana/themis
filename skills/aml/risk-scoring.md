---
name: risk-scoring
description: Risk factor weighting methodology and decision-making framework for AML alerts
version: 1.0.0
author: Themis Platform
metadata:
  hermes:
    tags: [aml, risk, scoring, decision]
    category: aml
---

# Risk Scoring & Decision Framework

Systematic methodology for weighing risk factors, calculating risk scores, and making CLEAR vs ESCALATE decisions with confidence levels.

## When to Use

- Step 8-9 of alert investigation workflow
- After gathering all evidence
- Before making final disposition decision
- When calculating confidence scores
- For quality assurance review

## Risk Factor Framework

### Risk Factor Structure

Each risk factor has:
- **Factor name**: Brief description
- **Weight**: 0.0-1.0 (relative importance)
- **Direction**: "up" (suspicious) or "down" (mitigating)
- **Detail**: Explanation and context
- **Evidence**: Supporting data/tool output

### Factor Categories

**Suspicious Indicators (direction: "up"):**
- Transaction patterns (structuring, velocity, round amounts)
- Customer profile (PEP, high-risk jurisdiction, stale KYC)
- Network patterns (circular movement, shell entities)
- Income anomalies (ratio >8x)
- Keyword hits (unexplained)
- Dormant account reactivation
- Geographic dispersion (deliberate)

**Mitigating Factors (direction: "down"):**
- Documented business purpose
- Verified employment/business
- Historical consistency
- Prior alerts cleared
- Full KYC documentation
- Legitimate counterparties
- Logical timing/amounts

## Weight Assignment Guidelines

### Critical Factors (0.30-0.40)

**Assign high weight to:**
- Confirmed structuring pattern (8+ deposits)
- Circular movement (confidence >80%)
- Dormant account reactivation + large unexplained credit
- FinCEN 314(b) active inquiry
- OFAC/sanctions match (potential)
- Income ratio >20x

**Example:**
```
{
  factor: "Structuring pattern confirmed",
  weight: 0.35,
  direction: "up",
  detail: "9 deposits between $8,900-$9,800 on consecutive days across 3 branches"
}
```

### Major Factors (0.20-0.29)

**Assign moderate-high weight to:**
- Shell entity involvement
- High-risk jurisdiction exposure
- Keyword hits (unexplained context)
- Transaction velocity spike (>5x baseline)
- Real estate layering risk
- Prior SAR history

**Example:**
```
{
  factor: "Shell entity network",
  weight: 0.28,
  direction: "up",
  detail: "Linked to 3 entities with no web presence or known staff"
}
```

### Moderate Factors (0.10-0.19)

**Assign moderate weight to:**
- Geographic dispersion
- Stale KYC (>24 months)
- Multiple prior alerts (3+)
- Cash-intensive business (inherent risk)
- International wire frequency
- Business income plausibility questions

**Example:**
```
{
  factor: "Geographic dispersion",
  weight: 0.10,
  direction: "up",
  detail: "Branches in different counties — deliberate dispersion pattern"
}
```

### Minor Factors (0.05-0.09)

**Assign low weight to:**
- Account age (long relationship)
- Prior alert history (favorable)
- Single keyword hit (benign context)
- Minor income variance (1-3x)

**Example:**
```
{
  factor: "Prior alert dismissed",
  weight: 0.11,
  direction: "down",
  detail: "AL-0042 cleared with receipts in 2024 — favorable history"
}
```

## Risk Score Calculation

### Method 1: Weighted Sum (Simple)

```
Suspicious Score = Σ (weight × direction_multiplier) for all "up" factors
Mitigating Score = Σ (weight × direction_multiplier) for all "down" factors

Net Risk Score = Suspicious Score - Mitigating Score

where direction_multiplier = 1.0 for "up", 1.0 for "down"
```

**Example:**
```
Suspicious factors:
  0.35 (structuring) + 0.28 (shell entities) + 0.20 (layering) = 0.83

Mitigating factors:
  0.15 (income alignment) + 0.11 (prior alert cleared) = 0.26

Net Risk Score = 0.83 - 0.26 = 0.57 (HIGH RISK)
```

### Method 2: Weighted Average (Normalized)

```
Risk Score = (Suspicious Score) / (Suspicious Score + Mitigating Score)

Range: 0.0 (all mitigating) to 1.0 (all suspicious)
```

**Example:**
```
Risk Score = 0.83 / (0.83 + 0.26) = 0.76 (76% risk)
```

### Risk Score Thresholds

- **0.00-0.30**: LOW RISK → Strong candidate for CLEAR
- **0.31-0.60**: MEDIUM RISK → Requires careful review
- **0.61-0.80**: HIGH RISK → Strong candidate for ESCALATE
- **0.81-1.00**: CRITICAL RISK → Immediate escalation

## Decision Framework

### CLEAR Decision

**Criteria:**
- Net risk score <0.40 OR
- Mitigating factors clearly outweigh suspicious indicators
- All suspicious indicators have benign explanations
- Documentation supports legitimate activity

**Minimum requirements:**
- At least 3 mitigating factors
- All suspicious indicators investigated and explained
- Confidence ≥80%

**Example:**
```
Suspicious: 4 factors (0.83 total weight)
Mitigating: 8 factors (1.12 total weight)
Decision: CLEAR
Confidence: 85%
Rationale: "Weight of evidence supports legitimate business activity."
```

### ESCALATE Decision

**Criteria:**
- Net risk score >0.60 OR
- Suspicious indicators clearly outweigh mitigating factors
- Critical red flags present (structuring, circular movement, shell entities)
- Insufficient documentation to explain activity

**Minimum requirements:**
- At least 3 suspicious indicators
- At least 1 critical factor (weight >0.25)
- Confidence ≥70%

**Example:**
```
Suspicious: 7 factors (1.42 total weight)
Mitigating: 1 factor (0.08 total weight)
Decision: ESCALATE
Confidence: 80%
Rationale: "Dormancy pattern, undocumented source, offshore dispersal."
```

### REVIEW Decision

**Criteria:**
- Net risk score 0.40-0.60
- Suspicious and mitigating factors roughly balanced
- Need additional documentation
- Confidence <70%

**Action items:**
- Request additional documentation from customer
- Conduct enhanced due diligence
- Consult with senior investigator
- Set review deadline (5-10 business days)

## Confidence Score Calculation

### Confidence Factors

**High confidence (85-95%):**
- All tools executed successfully
- Complete documentation available
- Clear pattern (structuring, circular movement)
- No ambiguity in evidence
- Consistent findings across multiple tools

**Medium confidence (70-84%):**
- Most tools executed successfully
- Some documentation gaps
- Pattern is present but not definitive
- Minor inconsistencies in evidence
- Some findings require interpretation

**Low confidence (50-69%):**
- Tool execution had errors
- Significant documentation gaps
- Pattern is unclear or borderline
- Conflicting evidence
- Requires additional investigation

**Formula:**
```
Confidence = Base_Confidence × Evidence_Completeness × Pattern_Clarity

Base_Confidence:
  - CLEAR with strong mitigating: 0.90
  - ESCALATE with critical factors: 0.85
  - Borderline cases: 0.70

Evidence_Completeness:
  - All tools successful: 1.0
  - 1-2 tools failed: 0.95
  - 3+ tools failed: 0.85

Pattern_Clarity:
  - Definitive pattern: 1.0
  - Probable pattern: 0.95
  - Possible pattern: 0.85
  - Unclear: 0.75
```

## Investigation Quality Checklist

Before finalizing decision, verify:

- [ ] All required tools executed
- [ ] Baseline established (90+ days)
- [ ] Income verification calculated
- [ ] Keywords investigated with context
- [ ] Network analysis performed (if applicable)
- [ ] All suspicious indicators documented
- [ ] All mitigating factors documented
- [ ] Weights assigned to all factors
- [ ] Risk score calculated
- [ ] Confidence score calculated
- [ ] Decision rationale documented
- [ ] Residual concerns noted (if any)

## Common Decision Scenarios

### Scenario 1: Clear Structuring + No Documentation

**Factors:**
- Structuring confirmed (0.35, up)
- No cash business (0.25, up)
- Income ratio 15x (0.20, up)
- No documentation (0.15, up)

**Risk Score**: 0.95 (CRITICAL)
**Decision**: ESCALATE
**Confidence**: 90%

### Scenario 2: Cash Business with Documentation

**Factors:**
- Multi-branch deposits (0.22, up)
- Velocity spike (0.24, up)
- Cash-intensive business (0.15, down)
- Business license verified (0.18, down)
- Sales records align (0.20, down)
- Prior alert cleared (0.11, down)

**Risk Score**: 0.42 (MEDIUM)
**Decision**: CLEAR
**Confidence**: 85%

### Scenario 3: Borderline Case

**Factors:**
- International wires (0.25, up)
- High-risk jurisdiction (0.20, up)
- Import/export business (0.15, down)
- Some documentation (0.10, down)
- Incomplete trade docs (0.15, up)

**Risk Score**: 0.55 (MEDIUM)
**Decision**: REVIEW
**Confidence**: 65%
**Action**: Request complete trade documentation

## Pitfalls

### Don't Double-Count Factors

**Wrong:**
```
- Structuring (0.35, up)
- Multiple deposits below $10K (0.25, up)  // Same as structuring!
- Sub-threshold amounts (0.20, up)         // Same as structuring!
```

**Right:**
```
- Structuring pattern confirmed (0.35, up)
- Geographic dispersion (0.10, up)
- Velocity spike (0.24, up)
```

### Don't Ignore Mitigating Factors

Even strong suspicious indicators can be explained by mitigating factors. Always document both sides.

### Don't Use Gut Feeling

Every factor must have evidence from tool execution or documentation review. "Seems suspicious" is not a factor.

### Don't Skip Confidence Calculation

Confidence score is critical for quality assurance and regulatory review. Always calculate and document.

## Regulatory Compliance

**SAR Filing Threshold:**
- Transactions ≥$5,000 with suspicious activity
- Confidence in suspicious activity ≥70%
- No reasonable explanation after investigation

**SAR Filing Deadline:**
- 30 calendar days from initial detection
- Extension to 60 days if identity unknown

**Documentation Requirements:**
- All risk factors documented
- All weights justified
- Decision rationale clear
- Confidence score calculated
- Residual concerns noted

## Related Skills

- `alert-investigation.md` - Main investigation workflow
- `narrative-generation.md` - Document risk factors in SAR
- `kyc-verification.md` - Customer risk factors
- `network-analysis.md` - Network risk factors
