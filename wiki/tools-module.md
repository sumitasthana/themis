# Tools Module (`agent/tools.py`)

## Purpose
This module contains the investigation toolset used by the orchestrator. Tools read live Postgres data and map results into orchestrator-ready schemas.

## Tool Inventory
1. `get_alert_details(alert_id)`
2. `search_transactions(customer_id, ...)`
3. `get_customer_profile(customer_id)`
4. `analyze_network(customer_id, depth=2)`
5. `check_sanctions(entity_name, entity_type='INDIVIDUAL')`
6. `calculate_baseline(customer_id, period_days=90)`
7. `search_keywords(customer_id, keywords=None, days=30)`
8. `verify_income(customer_id, transactions=None)`
9. `calculate_risk_score(risk_factors)` (pure computation)

## Design Characteristics
- Async SQLAlchemy queries for all data-reading tools.
- Payload normalization to backend contract expected by step handlers.
- Deterministic risk confidence outputs for reproducibility.
- Utility maps for risk and KYC vocabulary alignment.

## Important Behavioral Notes
- Missing schema fields are explicitly approximated (e.g., `kyc_last_updated`, beneficial owners).
- Network tool currently returns `circular_flows=[]` and `layering_detected=False` when no explicit cycle detection is computed.
- Risk scoring provides disposition and confidence bands without random variance.

## Extension Guidelines
- Maintain backward-compatible output keys used by orchestrator.
- Keep tools focused: one investigative concern per tool.
- For new tool additions, register in `TOOL_REGISTRY` and wire into orchestrator steps deliberately.
