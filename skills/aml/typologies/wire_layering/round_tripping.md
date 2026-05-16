---
name: typology-round-tripping
description: Funds wired through a chain of intermediary accounts and returned to the originator's control, often via offshore vehicles, to obscure source and add an apparent business rationale
version: 1.0.0
author: Themis Platform
typology_id: RT-001
category: wire_layering
ml_stage: [layering, integration]
status: active
sources:
  - org: Wolfsberg Group
    citation: "Wolfsberg Trade Finance Principles 2019, Appendix B"
    type: industry_guidance
  - org: FATF
    citation: "Money Laundering through the Physical Transportation of Cash, 2015, paragraph 5.5"
    type: typology_report
risk_indicators:
  - circular_fund_flow_returning_to_originator
  - intermediary_account_in_offshore_jurisdiction
  - same_beneficial_owner_at_origin_and_terminus
  - artificial_invoice_supporting_round_trip
  - rapid_pass_through_no_economic_substance
last_reviewed: 2026-01-15
approved_by:
  - {name: J. Smith, role: AML Analyst, date: 2026-01-15}
  - {name: A. Patel, role: MLRO, date: 2026-01-15}
metadata:
  hermes:
    tags: [aml, typology, wire, layering, offshore]
    category: aml-typology
---

# Definition

Round-tripping is a layering technique in which funds are wired through
two or more intermediary accounts — frequently spanning offshore
jurisdictions and shell entities — and ultimately returned to an account
under the originator's beneficial control. The intermediary hops add
apparent commercial substance (often through fabricated invoices,
"consulting fees," or intercompany loans) without genuine economic
purpose, allowing the funds to re-enter the originator's economy with a
plausible origin story.

# Example

A US LLC wires $215,000 to a Panamanian intermediary as a "consulting
retainer." Within nine days the same amount, minus a $4,500 "service
fee," is wired from a Cayman Islands shell company — owned indirectly by
the same beneficial owner — back to a different US account controlled by
the originator, characterized as a "loan repayment." No deliverables,
contracts, or services support either leg, and the original LLC has no
operating presence in Panama.

# Red Flags

- Funds returning to the originator (or a related party) within 30 days, after one or more international hops
- Intermediaries domiciled in jurisdictions with strong corporate-secrecy regimes (Panama, Cayman, BVI, Seychelles)
- Invoices supporting the transfers describe vague services with no measurable deliverable
- Beneficial owner of origin and terminus accounts is the same individual or family group
- Round-trip amount within a narrow tolerance of the original (typically <5% spread, covering "fees")

# Detection Hint

```sql
-- Detect customer pairs where outbound and inbound wires within 30 days
-- net to near-zero and pass through a high-risk jurisdiction.
WITH outbound AS (
  SELECT customer_id, counterparty, ABS(amount) AS amt, date AS sent_date,
         country
    FROM transactions
   WHERE category = 'wire_transfer' AND amount < 0
     AND country IN ('PAN','CYM','VGB','SYC','BHS')
),
inbound AS (
  SELECT customer_id, counterparty, amount AS amt, date AS received_date,
         country
    FROM transactions
   WHERE category = 'wire_transfer' AND amount > 0
     AND country IN ('PAN','CYM','VGB','SYC','BHS')
)
SELECT o.customer_id, o.amt AS sent, i.amt AS received,
       o.sent_date, i.received_date,
       (i.received_date - o.sent_date) AS round_trip_days
  FROM outbound o
  JOIN inbound  i ON i.customer_id = o.customer_id
 WHERE i.received_date BETWEEN o.sent_date AND o.sent_date + INTERVAL '30 days'
   AND ABS(o.amt - i.amt) / o.amt < 0.05;
```

# References

- Wolfsberg Group, *Trade Finance Principles*, 2019 edition, Appendix B — Layering through trade and finance vehicles.
- FATF, *Money Laundering through the Physical Transportation of Cash*, 2015, paragraph 5.5.
- US Senate Permanent Subcommittee on Investigations, *Tax Haven Banks and US Tax Compliance*, July 2008 — round-trip case studies.
