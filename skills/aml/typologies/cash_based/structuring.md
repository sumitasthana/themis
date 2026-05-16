---
name: typology-structuring
description: Structuring is the deliberate breaking up of a cash transaction into smaller amounts below the $10,000 CTR threshold to evade Bank Secrecy Act reporting. FinCEN Advisory FIN-2026-A002 confirms that the same evasive intent and underlying conduct extends to open-loop prepaid card acquisitions and subsequent reloads through MSB agents, and that institutions must cover this variant within their existing structuring monitoring scenarios.
version: 1.1.0
author: Themis Harvester
typology_id: STR-001
category: cash_based
ml_stage: [placement]
status: active
sources:
  - org: FinCEN
    citation: "FinCEN Advisory FIN-2026-A002: Prepaid Card Structuring and Reload Aggregation Schemes"
    type: harvested
risk_indicators:
  - multiple_subthreshold_cash_deposits
  - same_day_multi_branch_deposits
  - multiple_same_day_prepaid_card_purchases
  - prepaid_reload_aggregation_above_ctr_threshold
last_reviewed: 2026-05-16
approved_by:
  - {name: Sumit, role: MLRO, date: 2026-05-16}
  - {name: Manash, role: AML Analyst, date: 2026-05-16}
metadata:
  hermes:
    tags: [aml, typology, cash-based, placement]
    category: aml-typology
---
# Definition

Structuring is the deliberate breaking up of a cash transaction into smaller amounts below the $10,000 CTR threshold to evade Bank Secrecy Act reporting. FinCEN Advisory FIN-2026-A002 confirms that the same evasive intent and underlying conduct extends to open-loop prepaid card acquisitions and subsequent reloads through MSB agents, and that institutions must cover this variant within their existing structuring monitoring scenarios.

# Example

A subject acquires 11 prepaid cards across three retailers in a single day with initial loads sized between $1,800 and $4,900 per card (none above the CTR threshold), then over the following six business days reloads the same cards through MSB agents in increments of $950 to $4,750, accumulating $84,750 of additional value. No individual transaction triggers a CTR; the aggregate behavior is the same cash structuring pattern executed across the prepaid channel.

# Red Flags

- multiple_subthreshold_cash_deposits
- same_day_multi_branch_deposits
- multiple_same_day_prepaid_card_purchases
- prepaid_reload_aggregation_above_ctr_threshold

# Detection Hint

_To be authored at promotion time._

# References

- FinCEN: FinCEN Advisory FIN-2026-A002: Prepaid Card Structuring and Reload Aggregation Schemes
