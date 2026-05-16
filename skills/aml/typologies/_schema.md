---
name: typology-schema-reference
description: Documents the YAML frontmatter contract every typology MD must follow
version: 1.0.0
author: Themis Platform
metadata:
  hermes:
    tags: [aml, typology, schema]
    category: aml-typology-schema
---

# Typology MD Schema

Every file under `skills/aml/typologies/<category>/<slug>.md` must conform
to this contract. The skills loader (`agent/skills_loader.py`) parses
these via `rglob`, and the bootstrap script (`agent.harvesting.bootstrap_registry`)
inserts one row per file into the `typologies` table.

## Required frontmatter

| Field | Type | Notes |
|---|---|---|
| `name` | string | Unique across the whole `skills/aml/` tree. Convention: `typology-<slug>` |
| `description` | string | Single sentence: what it is + when to use |
| `version` | semver string | `MAJOR.MINOR.PATCH` |
| `author` | string | `Themis Platform` for seed; reviewer team for promoted candidates |
| `typology_id` | string | `<PREFIX>-<NNN>`; see allocation table below |
| `category` | enum | One of seven; see allowed values below |
| `ml_stage` | list of enums | Subset of allowed stages |
| `status` | enum | `candidate` \| `under_review` \| `approved` \| `active` \| `suspended` \| `retired` |
| `sources` | list of objects | Each item: `{org, citation, type}` |
| `risk_indicators` | list of snake_case strings | The atomic signals downstream rules detect |
| `last_reviewed` | ISO date | When approvers last signed off |
| `approved_by` | list of objects | Each item: `{name, role, date}` |
| `metadata.hermes.tags` | list of strings | Required so the skills loader picks it up |
| `metadata.hermes.category` | string | Use `aml-typology` |

## Allowed `category` values

The harvester allocates new typology IDs by category prefix:

| `category` | Prefix | Example seed |
|---|---|---|
| `cash_based` | `CSH` | `STR-001` (legacy seed prefix), `FUN-001` |
| `wire_layering` | `WIR` | `RT-001` (legacy seed prefix) |
| `account_behavior` | `ACC` | — |
| `trade_commercial` | `TRD` | — |
| `fraud_linked` | `FRD` | `BEC-001` (legacy seed prefix) |
| `terrorism_financing` | `TF` | — |
| `emerging_tech` | `TEC` | — |

Seed IDs (`STR-001`, `FUN-001`, `RT-001`, `BEC-001`) intentionally use
domain-named prefixes for human readability. Harvester-allocated IDs use
the category-prefix scheme starting at `<PREFIX>-100` to avoid collisions
with the seed range.

## Allowed `ml_stage` values

| Value | Meaning |
|---|---|
| `placement` | Cash entering the financial system |
| `layering` | Obfuscation through multiple transactions / jurisdictions |
| `integration` | Funds reintegrated into the legitimate economy |
| `pre_crime` | Preparatory activity before predicate offense |
| `terrorism_financing` | Funds raised or moved for terrorism (regardless of origin) |

## Body sections

In this exact order, in every typology MD:

1. `# Definition` — one paragraph, factual, citing the source document where applicable.
2. `# Example` — a concrete (real or paraphrased) scenario, monetary amounts in plausible AML ranges (no `$1,000,000` placeholders).
3. `# Red Flags` — bullet list matching `risk_indicators` in frontmatter.
4. `# Detection Hint` — SQL-pseudocode rule sketch the downstream agent can use.
5. `# References` — full citations matching `sources` in frontmatter.

## Authorship rules

- **Never edit a published file directly.** Submit changes through the harvester → review → promote pipeline so an audit trail is captured.
- New typologies enter at `status: candidate`; they only flip to `active` when two distinct reviewers approve and `promote.py` runs.
- Updates increment the `version` field. The promote step writes the new SHA-256 to `typologies.md_sha256` and refreshes `approved_by`.
