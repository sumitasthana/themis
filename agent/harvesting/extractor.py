"""Typology extractors.

Two implementations behind a single `TypologyExtractor` protocol:

  - FixtureExtractor — reads pre-computed `extracted_typologies` from
    the source dict. Used by all tests and offline demos.

  - BedrockExtractor — calls AWS Bedrock with tool-use (forced
    `submit_typologies` tool call). Real Bedrock work, opt-in via the
    `--extractor bedrock` flag in `harvest.py`.

The two extractors share a `CandidateTypology` TypedDict shape so the
harvester can treat them interchangeably.
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Mapping, Optional, Protocol, TypedDict


log = logging.getLogger(__name__)


# ---------------------------------------------------------------------
# Shared shape
# ---------------------------------------------------------------------

class CandidateTypology(TypedDict, total=False):
    name: str
    category: str
    ml_stage: List[str]
    definition: str
    example: str
    red_flags: List[str]


_VALID_CATEGORIES = {
    "cash_based", "wire_layering", "account_behavior", "trade_commercial",
    "fraud_linked", "terrorism_financing", "emerging_tech",
}

_VALID_ML_STAGES = {"placement", "layering", "integration", "pre_crime", "terrorism_financing"}


def _coerce_candidate(raw: Mapping[str, Any]) -> CandidateTypology:
    """Normalize a candidate dict into the canonical shape. Drops
    unknown keys, fills missing list fields with []."""
    return CandidateTypology(
        name=str(raw.get("name", "")).strip(),
        category=str(raw.get("category", "")).strip(),
        ml_stage=[str(s) for s in (raw.get("ml_stage") or [])],
        definition=str(raw.get("definition", "")).strip(),
        example=str(raw.get("example", "")).strip(),
        red_flags=[str(s) for s in (raw.get("red_flags") or [])],
    )


# ---------------------------------------------------------------------
# Protocol
# ---------------------------------------------------------------------

class TypologyExtractor(Protocol):
    name: str
    version: str

    def extract(self, source: Mapping[str, Any]) -> List[CandidateTypology]: ...


# ---------------------------------------------------------------------
# Fixture extractor
# ---------------------------------------------------------------------

class FixtureExtractor:
    """Returns the source's `extracted_typologies` field verbatim.
    Used by tests and offline demos so the pipeline can run without
    network access or AWS credentials."""

    name = "fixture_extractor"
    version = "0.1.0"
    prompt_version: Optional[str] = None
    prompt_sha256: Optional[str] = None

    def extract(self, source: Mapping[str, Any]) -> List[CandidateTypology]:
        raw = source.get("extracted_typologies") or []
        if not isinstance(raw, list):
            return []
        return [_coerce_candidate(x) for x in raw if isinstance(x, dict)]


# ---------------------------------------------------------------------
# Bedrock extractor
# ---------------------------------------------------------------------

# JSON schema for the forced tool. Matches CandidateTypology.
_TOOL_INPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "typologies": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "category": {"type": "string", "enum": sorted(_VALID_CATEGORIES)},
                    "ml_stage": {
                        "type": "array",
                        "items": {"type": "string", "enum": sorted(_VALID_ML_STAGES)},
                    },
                    "definition": {"type": "string"},
                    "example": {"type": "string"},
                    "red_flags": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["name", "category", "definition", "red_flags"],
            },
        }
    },
    "required": ["typologies"],
}


class BedrockExtractor:
    """Calls AWS Bedrock with a forced tool-use schema. Never fabricates
    output on failure — returns [] and logs the cause.

    Constructor argument `prompt_path` overrides the default location
    (used by tests so a temp YAML can be loaded). `boto3_client` lets
    tests inject a mock client without monkey-patching the module."""

    name = "bedrock_extractor"
    version = "1.0.0"

    def __init__(
        self,
        *,
        prompt_path: Optional[Path] = None,
        boto3_client: Any = None,
    ) -> None:
        if prompt_path is None:
            prompt_path = Path(__file__).parent / "prompts" / "typology_extraction_v1.yaml"
        self.prompt_path = Path(prompt_path)
        if not self.prompt_path.exists():
            raise FileNotFoundError(f"Prompt template not found at {self.prompt_path}")

        prompt_bytes = self.prompt_path.read_bytes()
        self.prompt_sha256: str = hashlib.sha256(prompt_bytes).hexdigest()
        self.prompt_version: str = "1.0.0"   # Pinned to v1; bump when YAML changes intent.
        self._prompt_text: str = prompt_bytes.decode("utf-8")

        self.region = os.getenv("AWS_BEDROCK_REGION", "us-east-1")
        self.model_id = os.getenv("AWS_BEDROCK_MODEL", "anthropic.claude-3-sonnet-20240229-v1:0")
        aws_key = os.getenv("AWS_ACCESS_KEY_ID")
        if not aws_key and boto3_client is None:
            raise RuntimeError(
                "BedrockExtractor requires AWS_ACCESS_KEY_ID in the environment "
                "(or an injected boto3_client for tests)."
            )

        if boto3_client is not None:
            self._client = boto3_client
        else:
            # Imported lazily so unit tests that mock the client don't need boto3 installed.
            import boto3  # type: ignore
            self._client = boto3.client("bedrock-runtime", region_name=self.region)

    # ----------------------------------------------------------------

    def _render_prompts(self, source: Mapping[str, Any]) -> tuple[str, str]:
        """Split the YAML into `system:` and `user:` blocks (rough YAML
        not full parse) and interpolate placeholders. We avoid `yaml.safe_load`
        on the multiline literal so the templates keep their newlines exactly."""
        text = self._prompt_text
        # Find the `system: |` block and the `user: |` block.
        def _extract(key: str) -> str:
            marker = f"\n{key}: |\n"
            i = text.find(marker)
            if i < 0:
                return ""
            j = i + len(marker)
            # Take following indented lines (those that start with 2+ spaces or are blank).
            lines = []
            for line in text[j:].splitlines():
                if line.startswith("  ") or line.strip() == "":
                    lines.append(line[2:] if line.startswith("  ") else line)
                else:
                    break
            return "\n".join(lines).rstrip()

        sys_template = _extract("system")
        usr_template = _extract("user")
        ctx = {
            "source_org": source.get("source_org", ""),
            "title": source.get("title", ""),
            "publication_date": source.get("publication_date", ""),
            "source_url": source.get("source_url", ""),
            "content": source.get("content", ""),
        }
        return sys_template.format(**ctx), usr_template.format(**ctx)

    def extract(self, source: Mapping[str, Any]) -> List[CandidateTypology]:
        from botocore.exceptions import ClientError  # type: ignore  # lazy import

        try:
            system_text, user_text = self._render_prompts(source)
        except KeyError as e:
            log.error("bedrock extractor: prompt rendering failed key=%s source_url=%s", e, source.get("source_url"))
            return []

        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4000,
            "temperature": 0.1,
            "system": system_text,
            "messages": [{"role": "user", "content": user_text}],
            "tools": [
                {
                    "name": "submit_typologies",
                    "description": "Submit the list of typologies extracted from the document.",
                    "input_schema": _TOOL_INPUT_SCHEMA,
                }
            ],
            "tool_choice": {"type": "tool", "name": "submit_typologies"},
        }

        t0 = time.time()
        try:
            resp = self._client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(body),
                contentType="application/json",
                accept="application/json",
            )
        except ClientError as e:
            log.error(
                "bedrock extractor: ClientError source_url=%s err=%s",
                source.get("source_url"), e,
            )
            log.info("extraction_failed=True extractor=%s source=%s", self.name, source.get("source_url"))
            return []
        except Exception as e:  # pragma: no cover - defensive
            log.error(
                "bedrock extractor: unexpected error source_url=%s err=%s",
                source.get("source_url"), e,
            )
            log.info("extraction_failed=True extractor=%s source=%s", self.name, source.get("source_url"))
            return []

        latency_ms = int((time.time() - t0) * 1000)

        try:
            payload = json.loads(resp["body"].read())
        except Exception as e:
            log.error("bedrock extractor: body read failed err=%s", e)
            return []

        usage = payload.get("usage") or {}
        log.info(
            "bedrock_call source_url=%s model=%s prompt_version=%s prompt_sha256=%s "
            "input_tokens=%s output_tokens=%s latency_ms=%s",
            source.get("source_url"),
            self.model_id,
            self.prompt_version,
            self.prompt_sha256,
            usage.get("input_tokens"),
            usage.get("output_tokens"),
            latency_ms,
        )

        # Anthropic-on-Bedrock returns content as a list of blocks. Find the tool_use.
        content_blocks = payload.get("content") or []
        for block in content_blocks:
            if block.get("type") == "tool_use" and block.get("name") == "submit_typologies":
                tool_input = block.get("input") or {}
                items = tool_input.get("typologies") or []
                if not isinstance(items, list):
                    log.error("bedrock extractor: tool input.typologies is not a list")
                    return []
                return [_coerce_candidate(x) for x in items if isinstance(x, dict)]

        # No tool call -> extraction failure. Do NOT salvage free text.
        log.warning(
            "bedrock extractor: model did not invoke submit_typologies; source_url=%s",
            source.get("source_url"),
        )
        log.info("extraction_failed=True extractor=%s source=%s", self.name, source.get("source_url"))
        return []
