"""Unit tests for agent.harvesting.extractor.BedrockExtractor.

All boto3 calls are mocked; no test makes a real Bedrock request.
"""
from __future__ import annotations

import io
import json
import os
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from agent.harvesting.extractor import BedrockExtractor


# Path to the real prompt file shipped with the package — used by the
# happy-path test so prompt_sha256 reflects the production template.
_PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "typology_extraction_v1.yaml"


def _stub_invoke_model_response(tool_input):
    """Build the JSON payload Bedrock returns when the model invokes
    the submit_typologies tool with `tool_input`."""
    payload = {
        "id": "msg-test",
        "type": "message",
        "role": "assistant",
        "model": "anthropic.claude-test",
        "content": [
            {"type": "tool_use", "name": "submit_typologies", "input": tool_input}
        ],
        "stop_reason": "tool_use",
        "usage": {"input_tokens": 42, "output_tokens": 17},
    }
    return {"body": io.BytesIO(json.dumps(payload).encode("utf-8"))}


@pytest.fixture
def fake_source():
    return {
        "source_org": "FATF",
        "source_url": "https://fatf.invalid/x",
        "publication_date": "2025-01-01",
        "title": "Test report",
        "content": "Some regulatory text.",
    }


def test_init_without_aws_key_raises(monkeypatch, tmp_path):
    monkeypatch.delenv("AWS_ACCESS_KEY_ID", raising=False)
    with pytest.raises(RuntimeError, match="AWS_ACCESS_KEY_ID"):
        BedrockExtractor(prompt_path=_PROMPT_PATH)


def test_prompt_sha256_is_stable_and_nonempty(monkeypatch):
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "test-key")
    e1 = BedrockExtractor(prompt_path=_PROMPT_PATH, boto3_client=MagicMock())
    e2 = BedrockExtractor(prompt_path=_PROMPT_PATH, boto3_client=MagicMock())
    assert e1.prompt_sha256 == e2.prompt_sha256
    assert len(e1.prompt_sha256) == 64       # sha256 hex digest length
    assert e1.prompt_version == "1.0.0"


def test_tool_use_success_returns_parsed_candidates(monkeypatch, fake_source):
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "test-key")
    fake_client = MagicMock()
    fake_client.invoke_model.return_value = _stub_invoke_model_response({
        "typologies": [
            {
                "name": "Test Typology",
                "category": "emerging_tech",
                "ml_stage": ["layering"],
                "definition": "Defn.",
                "example": "Ex.",
                "red_flags": ["a", "b"],
            }
        ]
    })

    e = BedrockExtractor(prompt_path=_PROMPT_PATH, boto3_client=fake_client)
    out = e.extract(fake_source)
    assert len(out) == 1
    assert out[0]["name"] == "Test Typology"
    assert out[0]["category"] == "emerging_tech"
    assert out[0]["red_flags"] == ["a", "b"]
    fake_client.invoke_model.assert_called_once()


def test_empty_tool_call_returns_empty_list(monkeypatch, fake_source):
    """A FATF press release with no typologies — the model invokes the
    tool with an empty list. Valid empty result, not a failure."""
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "test-key")
    fake_client = MagicMock()
    fake_client.invoke_model.return_value = _stub_invoke_model_response({"typologies": []})

    e = BedrockExtractor(prompt_path=_PROMPT_PATH, boto3_client=fake_client)
    assert e.extract(fake_source) == []


def test_no_tool_call_returns_empty_no_fabrication(monkeypatch, fake_source):
    """If the model answers in plain text without invoking the tool,
    that's an extraction failure — we return [], not salvaged text."""
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "test-key")
    fake_client = MagicMock()
    fake_client.invoke_model.return_value = {
        "body": io.BytesIO(json.dumps({
            "content": [{"type": "text", "text": "Sure, here is a typology: ..."}],
            "stop_reason": "end_turn",
            "usage": {"input_tokens": 10, "output_tokens": 5},
        }).encode("utf-8"))
    }

    e = BedrockExtractor(prompt_path=_PROMPT_PATH, boto3_client=fake_client)
    assert e.extract(fake_source) == []


def test_client_error_returns_empty(monkeypatch, fake_source):
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "test-key")
    from botocore.exceptions import ClientError

    fake_client = MagicMock()
    fake_client.invoke_model.side_effect = ClientError(
        error_response={"Error": {"Code": "ThrottlingException", "Message": "slow down"}},
        operation_name="InvokeModel",
    )

    e = BedrockExtractor(prompt_path=_PROMPT_PATH, boto3_client=fake_client)
    assert e.extract(fake_source) == []
