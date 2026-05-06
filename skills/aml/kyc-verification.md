---
name: kyc-verification
description: Customer profile and KYC verification for enhanced due diligence
version: 1.0.0
author: Themis Platform
metadata:
  hermes:
    tags: [aml, kyc, edd, customer-diligence]
    category: aml
---

# KYC Verification & Enhanced Due Diligence

Comprehensive customer profile review and Know Your Customer (KYC) verification procedures for AML investigations.

## When to Use

- During alert investigation (Step 2 of main workflow)
- When customer risk score is elevated (>60)
- When KYC is stale (>24 months)
- For high-risk customers (PEP, high-risk jurisdiction)
- Before escalating an alert to SAR
- When onboarding requires enhanced due diligence

## KYC Components

### 1. Customer Identification Program (CIP)

**Required data points:**
- Full legal name
- Date of birth
- Physical address (not PO Box)
- SSN or Tax ID
- Government-issued ID verification

**Tool**: `get_customer_details(customer_id)`

**Red flags:**
- Missing or incomplete CIP data
- Address is registered agent only
- Recent address changes (multiple in 6 months)
- ID verification failed or pending

### 2. Beneficial Ownership (for Entities)

**Required for legal entities:**
- Ownership structure (25%+ owners)
- Control persons (CEO, CFO, etc.)
- Ultimate beneficial owners (UBO)
- Corporate structure diagram

**Red flags:**
- Nominee shareholders
- Complex ownership layers (>3 levels)
- Offshore holding companies
- Bearer shares
- Frequent ownership changes

### 3. Occupation & Source of Wealth

**Verify:**
- Stated occupation matches activity
- Income level is plausible
- Source of wealth documented
- Business license (if applicable)
- Employment verification

**Tool**: `get_customer_details(customer_id)` + `calculate(operation='income_verification')`

**Red flags:**
- Occupation inconsistent with transaction volume
- Income ratio >8x stated income
- Vague occupation ("consultant", "investor")
- No employment verification available
- Source of wealth unexplained

### 4. Expected Account Activity

**Document:**
- Purpose of account
- Expected transaction types
- Expected monthly volume
- Expected counterparties
- Geographic scope

**Compare to actual:**
- Actual volume vs expected
- Transaction types match purpose
- Counterparties are expected
- Geographic activity matches stated scope

**Red flags:**
- Actual volume 5x+ expected
- Unexpected transaction types (e.g., international wires for local business)
- Counterparties in high-risk jurisdictions
- Activity inconsistent with stated purpose

## Enhanced Due Diligence (EDD) Triggers

### Automatic EDD Required

1. **PEP (Politically Exposed Person)**
   - Current or former government official
   - Immediate family of PEP
   - Close associate of PEP
   - **Action**: Senior management approval, enhanced monitoring

2. **High-Risk Jurisdiction**
   - FATF blacklist countries
   - FATF greylist countries
   - OFAC sanctioned countries
   - **Action**: Transaction-level review, source of funds documentation

3. **High-Risk Business Type**
   - Money services business (MSB)
   - Cash-intensive business
   - Import/export
   - Real estate
   - Precious metals/jewelry
   - **Action**: Business verification, sales records review

4. **Adverse Media**
   - Criminal charges (financial crimes)
   - Regulatory enforcement actions
   - Negative news (fraud, corruption)
   - **Action**: Document findings, assess current risk

### Discretionary EDD

- Customer risk score >70
- Multiple prior alerts (3+)
- Dormant account reactivation
- Sudden change in activity pattern
- Complex entity structure

## KYC Refresh Requirements

### Standard Refresh Cycle

- **Low risk customers**: Every 36 months
- **Medium risk customers**: Every 24 months
- **High risk customers**: Every 12 months
- **PEP/EDD customers**: Every 6-12 months

### Trigger-Based Refresh

Refresh KYC immediately if:
- Alert escalated to investigation
- Customer risk score increases significantly
- Adverse media discovered
- Significant change in account activity
- Customer requests account changes

**Tool**: Check `kycStatus` and `kycLastRefresh` in customer details

**Red flag**: KYC >24 months stale during alert investigation

## Investigation Procedure

### Step 1: Retrieve Customer Profile

**Tool**: `get_customer_details(customer_id)`

Review all fields:
- Personal/entity information
- Risk scores (customer risk, alert risk)
- Account details (type, opening date)
- KYC status and refresh date
- Prior alert history
- PEP/sanctions screening results

### Step 2: Verify Occupation & Income

**Cross-reference:**
- Stated occupation vs transaction patterns
- Stated income vs observed inflows
- Business type vs account activity

**For businesses:**
- Verify business license (state registry)
- Check business website/online presence
- Validate business address (not just registered agent)
- Review business structure (LLC, Corp, Sole Prop)

**Tool**: `calculate(operation='income_verification', alert_id=alert_id)`

### Step 3: Check PEP & Sanctions Screening

**Review screening results:**
- OFAC SDN list
- World-Check PEP database
- State/local PEP lists
- EU sanctions lists

**Match types:**
- **Exact match**: Immediate escalation, freeze account
- **Potential match**: Investigate further, document resolution
- **No match**: Document negative screening

**Tool**: Check `pepStatus`, `sanctionsStatus` in customer details

### Step 4: Adverse Media Search

**Search sources:**
- Google News
- LexisNexis
- Factiva
- Local news archives

**Keywords:**
- Customer name + "fraud"
- Customer name + "money laundering"
- Customer name + "indictment"
- Business name + "enforcement"

**Document:**
- Date of article
- Source
- Summary of allegations
- Current status (charged, convicted, dismissed)

### Step 5: Entity Verification (if applicable)

**For legal entities, verify:**
- State business registry (Secretary of State)
- Business license status (active, suspended, revoked)
- Registered agent
- Officers and directors
- Formation date
- Good standing status

**Red flags:**
- Recently formed (<6 months) with high activity
- License suspended or revoked
- No web presence or physical location
- Registered agent address only
- Officers are nominee services

**Tool**: External state registry lookup

### Step 6: Beneficial Ownership Analysis

**For entities, identify:**
- All owners with 25%+ ownership
- Control persons (CEO, CFO, President)
- Ultimate beneficial owners (UBO)

**Red flags:**
- Nominee shareholders
- Offshore holding companies in ownership chain
- Frequent ownership changes
- Bearer shares
- UBO cannot be identified

**Tool**: `get_customer_details(customer_id)` → `beneficialOwnership` field

### Step 7: Risk Factor Assessment

**Compile risk factors:**

**Elevated risk (+):**
- PEP status
- High-risk jurisdiction exposure
- Cash-intensive business
- Prior alerts (3+)
- Stale KYC (>24 months)
- Adverse media
- Complex entity structure

**Mitigating factors (-):**
- Long banking relationship (5+ years)
- Consistent activity pattern
- Full documentation on file
- No prior alerts
- Verified employment/business

**Tool**: `evaluate_risk(alert_id, include_factors=true)`

## KYC Documentation Checklist

### Individual Customers

- [ ] Government-issued ID (driver's license, passport)
- [ ] SSN verification
- [ ] Address verification (utility bill, lease)
- [ ] Occupation verification (pay stub, employment letter)
- [ ] Source of wealth documentation
- [ ] PEP screening (negative or documented)
- [ ] Sanctions screening (negative)
- [ ] Adverse media search (negative or documented)

### Business Customers

- [ ] Articles of incorporation/organization
- [ ] Business license (active status)
- [ ] EIN verification
- [ ] Beneficial ownership form (FinCEN)
- [ ] Business address verification
- [ ] Business website/online presence
- [ ] Officers and directors list
- [ ] Ownership structure diagram
- [ ] Business plan or description
- [ ] Financial statements (if available)
- [ ] Trade references

## Decision Criteria

### KYC is CURRENT and SUFFICIENT if:
- All required documents on file
- Refresh date within required cycle
- No stale information (>24 months)
- Activity matches expected profile
- No unresolved PEP/sanctions matches

### KYC REFRESH REQUIRED if:
- Refresh date exceeds cycle (>24 months for medium risk)
- Significant change in activity
- Alert escalation
- Risk score increase
- New adverse media

### EDD REQUIRED if:
- PEP match confirmed
- High-risk jurisdiction exposure
- Adverse media (financial crimes)
- Complex entity structure
- Customer risk score >70

## Pitfalls

### Don't Assume Stated Occupation is Accurate
Verify occupation through employment letter, business license, or tax documents. "Consultant" and "investor" are vague and require additional documentation.

### Don't Ignore Stale KYC
KYC >24 months old is a regulatory deficiency. Document the gap and recommend immediate refresh.

### Don't Skip Beneficial Ownership
For entities, you MUST identify beneficial owners. "Unknown" is not acceptable for regulatory purposes.

### Don't Overlook Adverse Media
A 5-year-old fraud charge that was dismissed is still relevant context. Document it even if resolved.

## Regulatory References

- **CIP Requirements**: 31 CFR 1020.220
- **Beneficial Ownership**: FinCEN CDD Rule (31 CFR 1010.230)
- **EDD for PEPs**: FATF Recommendation 12
- **Risk-Based Approach**: FFIEC BSA/AML Examination Manual

## Related Skills

- `alert-investigation.md` - Main investigation workflow
- `risk-scoring.md` - Risk factor weighting
- `narrative-generation.md` - Document KYC findings in narrative
