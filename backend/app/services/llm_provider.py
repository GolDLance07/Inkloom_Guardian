import json
import logging
from typing import List, Dict, Any, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)


async def run_ai_review(
    content: str,
    brand_name: str,
    knowledge_items: List[Dict[str, Any]],
) -> Optional[List[Dict[str, Any]]]:
    """
    Optional LLM-assisted semantic check.
    Fails safely and never blocks deterministic review if unconfigured, timed out, or failing.
    """
    if not settings.LLM_API_KEY:
        return None

    # Construct clean prompt with only active brand knowledge
    system_prompt = (
        f"You are Inkloom Guardian AI Reviewer for brand '{brand_name}'. "
        "Review the submitted draft strictly against the provided brand knowledge items. "
        "Identify unverified claims or subtle tone violations. "
        "Return ONLY a JSON array of findings with keys: "
        "knowledge_item_id (string or null), category (string), severity ('critical'|'warning'|'info'), "
        "claim_status ('supported'|'contradicted'|'unverified'|'not_applicable'), "
        "title (string), explanation (string), evidence (string or null), "
        "content_excerpt (string or null), suggested_rewrite (string or null). "
        "Do not invent facts. Return valid JSON only."
    )

    valid_ids = {str(item.get("id")) for item in knowledge_items}

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": system_prompt},
                    {
                        "text": f"Brand Knowledge:\n{json.dumps(knowledge_items)}\n\nDraft Content:\n{content}"
                    },
                ]
            }
        ],
        "generationConfig": {
            "response_mime_type": "application/json",
            "thinking_config": {
                "thinking_budget": 0
            }
        }
    }

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{settings.LLM_MODEL}:generateContent?key={settings.LLM_API_KEY}"
    )

    try:
        timeout_sec = max(30, settings.LLM_TIMEOUT_SECONDS)
        async with httpx.AsyncClient(timeout=timeout_sec) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                logger.warning(f"AI provider returned status {resp.status_code}: {resp.text}")
                return None

            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return None

            parts = candidates[0].get("content", {}).get("parts", [])
            raw_text = "".join(p.get("text", "") for p in parts if p.get("text"))
            # Clean markdown codeblocks if returned
            clean_json = raw_text.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            if clean_json.startswith("```"):
                clean_json = clean_json[3:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]
            clean_json = clean_json.strip()

            # Extract JSON array slice
            start_idx = clean_json.find("[")
            end_idx = clean_json.rfind("]")
            if start_idx != -1 and end_idx != -1:
                clean_json = clean_json[start_idx : end_idx + 1]

            items = json.loads(clean_json)
            if not isinstance(items, list):
                return None

            validated_findings = []
            for it in items:
                k_id = it.get("knowledge_item_id")
                # Validate that referenced knowledge ID belongs to selected brand
                if k_id and str(k_id) not in valid_ids:
                    k_id = None

                validated_findings.append({
                    "knowledge_item_id": k_id,
                    "source_type": "ai",
                    "category": it.get("category", "semantic_review"),
                    "severity": it.get("severity", "warning"),
                    "claim_status": it.get("claim_status", "unverified"),
                    "title": it.get("title", "AI Advisory Finding"),
                    "explanation": it.get("explanation", ""),
                    "evidence": it.get("evidence"),
                    "content_excerpt": it.get("content_excerpt"),
                    "suggested_rewrite": it.get("suggested_rewrite"),
                    "location_start": None,
                    "location_end": None,
                })
            return validated_findings

    except Exception as e:
        logger.warning(f"AI review skipped due to exception: {repr(e)}")
        return None
