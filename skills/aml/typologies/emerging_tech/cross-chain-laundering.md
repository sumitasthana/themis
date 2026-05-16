---
name: typology-cross-chain-laundering
description: Cross-chain laundering uses bridge protocols, atomic swaps, and decentralized exchange routing to move illicit virtual-asset proceeds between separate blockchain networks. By hopping chains, the subject defeats chain-analytics traceback that depends on observing a continuous flow on a single ledger. Privacy-enhancing tools (mixers, batching contracts) are frequently layered on top of the bridging activity to further fragment the path. (FATF Mid-Year Review 2025, §4.7.)
version: 1.0.0
author: Themis Harvester
typology_id: TEC-100
category: emerging_tech
ml_stage: [layering]
status: active
sources:
  - org: FATF
    citation: "FATF Mid-Year Review of Emerging Money Laundering Typologies, 2025"
    type: harvested
risk_indicators:
  - rapid_sequential_use_of_two_or_more_bridges_within_72_hours
  - bridge_destination_interacted_with_sanctioned_mixer_in_last_30_days
  - vasp_customer_behavior_shift_from_single_asset_to_multi_chain
  - bridge_transaction_amounts_sized_below_internal_vasp_threshold
last_reviewed: 2026-05-16
approved_by:
  - {name: Sumit, role: MLRO, date: 2026-05-16}
  - {name: Manash, role: AML Analyst, date: 2026-05-16}
metadata:
  hermes:
    tags: [aml, typology, emerging-tech, layering]
    category: aml-typology
---
# Definition

Cross-chain laundering uses bridge protocols, atomic swaps, and decentralized exchange routing to move illicit virtual-asset proceeds between separate blockchain networks. By hopping chains, the subject defeats chain-analytics traceback that depends on observing a continuous flow on a single ledger. Privacy-enhancing tools (mixers, batching contracts) are frequently layered on top of the bridging activity to further fragment the path. (FATF Mid-Year Review 2025, §4.7.)

# Example

A subject deposits 130 BTC at a Bitcoin-native VASP, bridges the value to USDT on Tron via a cross-chain bridge, then moves the resulting USDT through a Solana mixer before final off-ramping at a different VASP. Aggregate value across the chain involved approximately USD 8.4 million split across 18 bridge transactions sized USD 220,000 to USD 580,000.

# Red Flags

- rapid_sequential_use_of_two_or_more_bridges_within_72_hours
- bridge_destination_interacted_with_sanctioned_mixer_in_last_30_days
- vasp_customer_behavior_shift_from_single_asset_to_multi_chain
- bridge_transaction_amounts_sized_below_internal_vasp_threshold

# Detection Hint

_To be authored at promotion time._

# References

- FATF: FATF Mid-Year Review of Emerging Money Laundering Typologies, 2025
