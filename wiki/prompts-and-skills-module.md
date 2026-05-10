# Prompts & Skills Module (`prompts/`, `skills/`, `agent/skills_loader.py`, `agent/agents.json`)

## Purpose
This module defines the AI behavior layer: agent registry, prompt instructions, and reusable AML skill content loaded at runtime.

## Components

### Agent Registry (`agent/agents.json`)
Defines active agents and metadata:
- `supervisor`
- `alert-investigator`
- `network-analyst`
- `risk-scorer`
- `sar-drafter`

Each entry includes routing role, model, prompt file, tool list, status, and operational metrics.

### Prompt Definitions (`prompts/*.yaml`)
Prompt files define persona, constraints, tools, guardrails, output schema, and decision rules for each agent role.

### Skill Library (`skills/aml/*.md`)
Markdown skill documents with YAML frontmatter and detailed procedural guidance:
- `alert-investigation`
- `structuring-detection`
- `network-analysis`
- `kyc-verification`
- `risk-scoring`
- `narrative-generation`

### Skill Loader (`agent/skills_loader.py`)
- Discovers markdown skill files recursively.
- Parses YAML frontmatter + markdown body.
- Caches skills for lookup efficiency.
- Supports listing/filtering/search and full-content retrieval.

## Runtime Integration
1. `ThemisAgent` instantiates `SkillsLoader`.
2. Skills are discovered and surfaced through `/api/skills`.
3. Prompt/skill assets shape agent behavior and specialist task boundaries.

## Extension Guidelines
- Keep frontmatter valid YAML and include `name` + `description`.
- Preserve stable skill names referenced by prompts/agent registry.
- Treat prompt updates as behavior changes requiring regression verification.
