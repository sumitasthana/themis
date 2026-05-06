---
name: network-analysis
description: Detect circular movement, layering, and suspicious network patterns in fund flows
version: 1.0.0
author: Themis Platform
metadata:
  hermes:
    tags: [aml, network, layering, circular-movement]
    category: aml
---

# Network Analysis & Circular Movement Detection

Identify layering schemes, circular fund movements, and suspicious network patterns that indicate money laundering.

## When to Use

- Alert triggered by CircularMovement rule
- Multiple related entities in transaction history
- Funds moving through intermediaries
- International wire patterns
- Shell company involvement
- Rapid fund movement (in/out within days)

## Money Laundering Stages

### 1. Placement
Initial introduction of illicit funds into the financial system.
- Large cash deposits
- Structuring
- Currency exchange
- Purchase of monetary instruments

### 2. Layering
Complex series of transactions to obscure the source.
- **Circular movement**: Funds return to originator
- **Shell companies**: Intermediaries with no real business
- **International wires**: Cross-border to obscure trail
- **Rapid movement**: In and out quickly

### 3. Integration
Illicit funds re-enter legitimate economy.
- Real estate purchases
- Business investments
- Luxury goods
- Legitimate-appearing income

**Network analysis focuses on detecting LAYERING.**

## Network Detection Indicators

### Primary Red Flags

1. **Circular Movement**
   - Funds originate from Customer A
   - Pass through 2-4 intermediaries
   - Return to Customer A (or related party)
   - **Haircut**: 20-40% absorbed by intermediaries

2. **Shell Entity Intermediaries**
   - No web presence
   - Registered agent address only
   - Recently formed (<12 months)
   - No employees
   - Nominee officers

3. **Rapid Fund Movement**
   - Funds received and dispersed within 1-7 days
   - No economic purpose for holding period
   - Minimal balance retention

4. **Geographic Layering**
   - Funds routed through multiple jurisdictions
   - High-risk jurisdictions (Panama, BVI, Cayman)
   - Correspondent banking chains

5. **Cross-Institution Patterns**
   - Same entities appear at multiple banks
   - FinCEN 314(b) matches
   - Coordinated timing across institutions

## Investigation Procedure

### Step 1: Map Direct Counterparties

**Tool**: `analyze_network(customer_id, depth=1)`

Identify first-degree connections:
- All counterparties in alert window
- Transaction amounts and dates
- Counterparty types (individual, entity, international)
- Frequency of transactions

**Categorize counterparties:**
- **Legitimate**: Employers, known merchants, utilities
- **Suspicious**: Shell entities, high-risk jurisdictions, unknown entities
- **Neutral**: Other individuals, small businesses

### Step 2: Expand Network (2-3 Degrees)

**Tool**: `analyze_network(customer_id, depth=2, include_cross_institution=True)`

Map second and third-degree connections:
- Where do counterparties send/receive funds?
- Are there return paths to originator?
- What entities appear multiple times?

**Network graph should show:**
- Nodes: Customers and entities
- Edges: Fund flows with amounts
- Directionality: Arrows showing flow direction
- Timing: Sequence of transactions

### Step 3: Detect Circular Patterns

**Algorithm**: Graph cycle detection

**Circular movement confirmed if:**
- Funds return to originator (or related party)
- Path length: 2-5 hops
- Timeframe: 1-30 days
- Haircut: 15-50% absorbed

**Example:**
```
Neal Hall → Nexus Realty ($95K)
Nexus Realty → Pacific Shell Corp ($40K)
Pacific Shell Corp → Ryan Torres ($35K)
Ryan Torres → Neal Hall ($30K)

Haircut: $65K (68% absorbed)
Confidence: 87%
```

**Tool**: `analyze_network(customer_id, depth=2)` → check `circularMovement` field

### Step 4: Analyze Shell Entities

For each entity in the network, verify:

**Legitimate business indicators:**
- Active website with real content
- Physical office location (not registered agent)
- Employees (LinkedIn, public records)
- Business license active
- Years in operation (5+ years)
- Real business purpose

**Shell entity indicators:**
- No web presence or placeholder site
- Registered agent address only
- Formation date <12 months
- No employees found
- Nominee officers (registered agent services)
- BVI, Panama, Cayman incorporation
- Name is generic ("Global Trade Partners", "Pacific Shell Corp")

**Tool**: External business registry lookup + Google search

### Step 5: Check FinCEN 314(b) Data

**Query cross-institution data:**
- Has this entity appeared at other banks?
- What activity patterns were observed?
- Were SARs filed?
- Are there active investigations?

**Red flags:**
- Same entity at 3+ institutions
- Similar patterns (large credit → rapid dispersal)
- Active 314(b) information request
- Prior SARs filed

**Tool**: `analyze_network(customer_id, include_cross_institution=True)` → check `fincen314b` field

### Step 6: Timing Analysis

**Analyze transaction timing:**
- How quickly do funds move through each hop?
- Are transactions coordinated (same day, same hour)?
- Is there a logical business reason for timing?

**Suspicious timing patterns:**
- Funds received and dispersed same day
- Multiple hops within 24-48 hours
- Coordinated timing across multiple accounts
- No holding period (immediate pass-through)

**Legitimate timing patterns:**
- Funds held for business cycle (30-90 days)
- Payments align with invoices/contracts
- Regular payment schedules (monthly rent, payroll)

### Step 7: Calculate Network Risk Score

**Scoring factors:**

**High risk (+):**
- Circular movement detected (confidence >70%)
- 2+ shell entities in path
- High-risk jurisdiction routing
- FinCEN 314(b) matches
- Rapid movement (<7 days)
- Large haircut (>30%)
- No documented business purpose

**Mitigating (-):**
- Documented trade relationships
- Contracts on file
- Legitimate business entities verified
- Logical business purpose
- Normal timing (30+ day cycles)

**Tool**: `evaluate_risk(alert_id, include_factors=true)` → network risk component

## Network Typologies

### Type 1: Simple Circular Movement
```
Customer A → Entity B → Customer A
```
- 2-hop return
- Typically 20-30% haircut
- Timeframe: 1-14 days
- **Purpose**: Create appearance of legitimate income

### Type 2: Complex Layering
```
Customer A → Entity B → Entity C → Entity D → Customer A
```
- 4+ hop return
- 40-60% haircut
- Multiple jurisdictions
- Timeframe: 7-30 days
- **Purpose**: Obscure source through complexity

### Type 3: Smurfing Network
```
Customer A → Person B, Person C, Person D (all deposit cash)
Person B, C, D → Customer A (wire back)
```
- Multiple individuals deposit cash
- Aggregate exceeds CTR threshold
- Funds return via wire/ACH
- **Purpose**: Evade CTR reporting via third parties

### Type 4: Trade-Based Layering
```
Customer A → Foreign Entity B (wire for "goods")
Foreign Entity B → Customer A (wire for "payment")
```
- Fake trade invoices
- Over/under invoicing
- No goods actually shipped
- **Purpose**: Create legitimate appearance via trade

### Type 5: Real Estate Layering
```
Customer A → Title Company (purchase property)
Property sold → Customer A (proceeds)
```
- Purchase property with illicit funds
- Sell quickly (sometimes at loss)
- Proceeds appear as legitimate real estate income
- **Purpose**: Integrate funds via real estate

## Decision Criteria

### ESCALATE if:
- Circular movement detected (confidence >70%)
- 2+ shell entities in network
- High-risk jurisdiction routing (Panama, BVI, Cayman)
- FinCEN 314(b) active inquiry
- No documented business purpose
- Rapid movement (<7 days)
- Large haircut (>30%)

**Confidence**: 75-90%

### CLEAR if:
- No circular patterns detected
- All entities are legitimate businesses (verified)
- Documented trade relationships
- Contracts/invoices on file
- Normal business timing (30+ days)
- Logical business purpose

**Confidence**: 80-90%

### REVIEW if:
- Potential circular pattern but low confidence (<60%)
- Some entities verified, others unclear
- Partial documentation
- Need to request additional documentation

**Confidence**: 50-70%

## Visualization

**Network graph should include:**
- **Nodes**: Circles for customers/entities
  - Size: Proportional to transaction volume
  - Color: Green (legitimate), Yellow (unknown), Red (shell/suspicious)
- **Edges**: Arrows for fund flows
  - Width: Proportional to amount
  - Label: Amount and date
- **Cycles**: Highlighted in red if circular movement detected
- **Jurisdictions**: Flag icons for international entities

**Tool**: `analyze_network()` returns graph data for visualization

## Pitfalls

### False Positive: Loan Repayment
Customer A → Customer B (loan)
Customer B → Customer A (repayment)

This looks circular but is legitimate if:
- Loan agreement on file
- Repayment schedule matches
- Interest paid (if applicable)

**Solution**: Request loan documentation before escalating.

### False Positive: Business Partnerships
Partner A → Business LLC (capital contribution)
Business LLC → Partner A (distribution)

This is normal partnership activity if:
- Partnership agreement on file
- Distributions align with ownership %
- Tax filings consistent

**Solution**: Verify partnership structure and distributions.

### Missing Context: Escrow/Title
Customer A → Title Company (home purchase)
Title Company → Customer A (refund - deal fell through)

This looks suspicious but is legitimate if:
- Purchase agreement on file
- Deal cancellation documented
- Refund timing makes sense

**Solution**: Check for real estate transaction documentation.

## Cross-Alert Linking

**If network analysis reveals connections to other alerts:**
- Link alerts in system
- Coordinate investigations
- Consider joint SAR filing
- Escalate to senior investigator

**Tool**: `link_alerts(primary=alert_id, related=[alert_id_2, alert_id_3])`

## Regulatory References

- **FATF Recommendation 10**: Customer due diligence
- **FATF Recommendation 16**: Wire transfers
- **FinCEN 314(b)**: Information sharing between financial institutions
- **FFIEC BSA/AML Manual**: Layering red flags

## Related Skills

- `alert-investigation.md` - Main investigation workflow
- `risk-scoring.md` - Network risk scoring methodology
- `narrative-generation.md` - Document network findings in SAR
