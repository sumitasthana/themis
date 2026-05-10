# Orchestrator Module (`agent/orchestrator.py`)

## Purpose
The orchestrator implements Themis’ deterministic 10-step AML investigation workflow and creates structured investigation journals.

## Main Class
- `ThemisAgent`
  - Loads skills through `SkillsLoader`.
  - Executes step methods from alert retrieval through narrative generation.
  - Aggregates risk factors and final recommendation.
  - Persists full run artifacts.

## Investigation State Model
The `InvestigationState` typed dict tracks:
- Input identifiers (`alert_id`, `investigation_id`)
- Step outputs (`alert_details`, `transactions`, `network_analysis`, etc.)
- Accumulated risk factors
- Journal entries and workflow completion markers
- Final recommendation/confidence/narrative/errors

## Workflow Sequence
1. Alert Details Retrieval
2. Customer Profile Review
3. Transaction History Search
4. Baseline Calculation
5. Income Verification
6. Keyword Search
7. Network Analysis
8. Sanctions Screening
9. Risk Score Calculation
10. Narrative Generation

## Persistence
`_persist_investigation` writes:
- 1 row in `investigations`
- N rows in `investigation_journal`
- M rows in `investigation_risk_factors`

## Extension Guidelines
- Keep step order stable unless process policy changes.
- Preserve state key names consumed by downstream serializers/UI.
- Keep recommendation/confidence logic driven by risk-scoring output.
- Use single-session transactional persistence for run consistency.
