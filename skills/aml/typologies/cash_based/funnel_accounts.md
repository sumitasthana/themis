---
name: typology-funnel-accounts
description: Cash deposited into an account in one region and rapidly withdrawn or wired from another, used to move funds across jurisdictions while concealing the source
version: 1.0.0
author: Themis Platform
typology_id: FUN-001
category: cash_based
ml_stage: [placement, layering]
status: active
sources:
  - org: FinCEN
    citation: "FIN-2014-A005, Update on US Currency Restrictions in Mexico"
    type: advisory
  - org: FATF
    citation: "Trade-Based Money Laundering Trends 2020, section 4.3"
    type: typology_report
risk_indicators:
  - geographic_dispersion_deposit_to_withdrawal
  - rapid_account_drain_after_cash_deposit
  - multiple_unrelated_depositors_into_single_account
  - cash_in_one_region_wire_out_another
last_reviewed: 2026-01-15
approved_by:
  - {name: J. Smith, role: AML Analyst, date: 2026-01-15}
  - {name: A. Patel, role: MLRO, date: 2026-01-15}
metadata:
  hermes:
    tags: [aml, typology, cash, funnel, geographic, placement]
    category: aml-typology
---

# Definition

A funnel account is an account opened in one geographic region that
receives cash deposits — frequently from multiple unrelated depositors —
and then rapidly disburses the aggregate via wire transfer or
withdrawal from a different region. The pattern obscures the path of
funds and is closely associated with bulk-cash smuggling and the Black
Market Peso Exchange.

# Example

An account is opened at a branch in Houston, TX. Over a four-day window,
$48,200 in cash is deposited in nine increments by six different parties
across branches in El Paso, San Antonio, and Laredo. On day five, the
account balance is wired to a Hong Kong correspondent account belonging
to a separate beneficial owner. The account-holder's stated occupation
("self-employed consultant") does not plausibly account for the cash
inflow profile.

# Red Flags

- Cash deposits made in one geographic region and outbound transfers initiated from another
- Account drained to near zero within 72 hours of deposit clusters
- Multiple depositors, none of whom are the account holder or known affiliates
- Wire destinations include high-risk jurisdictions (FATF grey/black list)
- Stated occupation or business type inconsistent with cash deposit volume

# Detection Hint

```sql
-- Flag accounts where cash deposit cities and outbound wire originating
-- cities differ, and balance drains > 80% within 3 days.
WITH deposits AS (
  SELECT customer_id, array_agg(DISTINCT city) AS deposit_cities,
         SUM(amount) AS deposit_total,
         MAX(date) AS last_deposit
    FROM transactions
   WHERE category = 'cash_deposit'
     AND date >= CURRENT_DATE - INTERVAL '7 days'
   GROUP BY customer_id
),
wires AS (
  SELECT customer_id, array_agg(DISTINCT city) AS wire_cities,
         SUM(ABS(amount)) AS wire_out_total
    FROM transactions
   WHERE category = 'wire_transfer'
     AND amount < 0
     AND date >= CURRENT_DATE - INTERVAL '7 days'
   GROUP BY customer_id
)
SELECT d.*, w.*
  FROM deposits d
  JOIN wires w USING (customer_id)
 WHERE NOT d.deposit_cities && w.wire_cities
   AND w.wire_out_total >= 0.8 * d.deposit_total;
```

# References

- FinCEN, *FIN-2014-A005*, Update on US Currency Restrictions in Mexico — funnel-account discussion.
- FATF, *Trade-Based Money Laundering Trends and Developments*, December 2020, §4.3.
- US Department of Justice, *National Money Laundering Risk Assessment*, 2022, pp. 31-34.
