---
name: typology-business-email-compromise
description: Fraudulent wire transfers induced through social engineering of corporate email accounts, with proceeds laundered through money-mule networks before final extraction
version: 1.0.0
author: Themis Platform
typology_id: BEC-001
category: fraud_linked
ml_stage: [placement, layering]
status: active
sources:
  - org: FinCEN
    citation: "FIN-2019-A005, Updated Advisory on Email Compromise Fraud Schemes Targeting Vulnerable Business Processes"
    type: advisory
  - org: FBI IC3
    citation: "2024 Internet Crime Report — Business Email Compromise section"
    type: enforcement_report
risk_indicators:
  - first_time_payee_wire_above_baseline_threshold
  - urgent_change_of_payment_instructions_via_email
  - beneficiary_account_recently_opened
  - beneficiary_name_mismatch_with_known_vendor
  - rapid_onward_transfer_to_secondary_account
last_reviewed: 2026-01-15
approved_by:
  - {name: J. Smith, role: AML Analyst, date: 2026-01-15}
  - {name: A. Patel, role: MLRO, date: 2026-01-15}
metadata:
  hermes:
    tags: [aml, typology, fraud, bec, wire]
    category: aml-typology
---

# Definition

Business Email Compromise (BEC) fraud induces a victim — typically a
corporate finance staff member — to wire funds to an attacker-controlled
account under the pretext of an urgent invoice, payroll change, or
vendor banking-detail update. Once the wire lands, the attacker
launders the proceeds rapidly through "money-mule" intermediaries
before final extraction in cash, cryptocurrency, or onward wire to a
foreign jurisdiction. The bank-side AML challenge is detecting the
mule-receiving account in time to interdict, since the originating
transaction often appears as a routine commercial wire.

# Example

A 14-month-old personal checking account at a US community bank, with
an average monthly inflow of $3,800, receives an inbound wire of
$187,500 marked "vendor payment - invoice 2025-0842" from a corporate
originator the account holder has never previously transacted with.
Within 41 minutes, $92,000 is wired onward to a second account at a
different US institution, $48,000 is withdrawn in cash across two
branches, and a $40,000 cryptocurrency exchange purchase is initiated.

# Red Flags

- Inbound wire of unusual size relative to the receiving account's six-month average
- Originator and beneficiary have no prior transaction history
- Beneficiary account opened within the last 12-24 months and previously low-activity
- Funds dispersed (wired onward, withdrawn as cash, or moved to a VASP) within hours of receipt
- Account holder's stated occupation or business profile cannot plausibly receive vendor payments at this scale

# Detection Hint

```sql
-- Flag inbound wires where beneficiary account is young, the originator
-- is new to the account, and >50% of the funds leave within 24 hours.
WITH inbound AS (
  SELECT t.id AS txn_id, t.customer_id, t.amount, t.date, t.counterparty,
         c.opened, (t.date - c.opened) AS account_age_days
    FROM transactions t
    JOIN customers c ON c.id = t.customer_id
   WHERE t.category = 'wire_transfer' AND t.amount > 50000
     AND (t.date - c.opened) < 730
),
prior AS (
  SELECT customer_id, counterparty
    FROM transactions
   GROUP BY 1, 2
  HAVING MIN(date) < CURRENT_DATE - INTERVAL '30 days'
),
outflow_24h AS (
  SELECT t.customer_id, t.date AS inbound_date,
         SUM(ABS(t2.amount)) AS outbound_within_24h
    FROM inbound t
    JOIN transactions t2
      ON t2.customer_id = t.customer_id
     AND t2.amount < 0
     AND t2.date BETWEEN t.date AND t.date + INTERVAL '1 day'
   GROUP BY 1, 2
)
SELECT i.*, o.outbound_within_24h
  FROM inbound i
  LEFT JOIN prior p ON p.customer_id = i.customer_id AND p.counterparty = i.counterparty
  JOIN outflow_24h o
    ON o.customer_id = i.customer_id AND o.inbound_date = i.date
 WHERE p.counterparty IS NULL  -- first-time counterparty
   AND o.outbound_within_24h >= 0.5 * i.amount;
```

# References

- FinCEN, *FIN-2019-A005*, Updated Advisory on Email Compromise Fraud Schemes Targeting Vulnerable Business Processes.
- FBI Internet Crime Complaint Center, *2024 Internet Crime Report*, BEC section.
- US Treasury, *2024 National Strategy for Combating Terrorist and Other Illicit Financing*, BEC laundering chapter.
