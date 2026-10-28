import re
from typing import List, Dict, Any, Optional
from app.models.base import KnowledgeItem


def extract_excerpt(content: str, start: int, end: int, context_chars: int = 40) -> str:
    ctx_start = max(0, start - context_chars)
    ctx_end = min(len(content), end + context_chars)
    prefix = "..." if ctx_start > 0 else ""
    suffix = "..." if ctx_end < len(content) else ""
    return f"{prefix}{content[ctx_start:ctx_end]}{suffix}"


def check_prohibited_terms(content: str, items: List[KnowledgeItem]) -> List[Dict[str, Any]]:
    findings = []
    prohibited_items = [it for it in items if it.active and it.kind in ("prohibited_term", "claim")]

    for item in prohibited_items:
        # Check phrase or terms
        targets = [item.content]
        if item.rule_config and "aliases" in item.rule_config:
            targets.extend(item.rule_config["aliases"])
        if item.normalized_value:
            targets.append(item.normalized_value)

        for target in targets:
            if not target.strip():
                continue
            pattern = rf"\b{re.escape(target.strip())}\b"
            for match in re.finditer(pattern, content, flags=re.IGNORECASE):
                start, end = match.span()
                matched_text = match.group(0)
                excerpt = extract_excerpt(content, start, end)
                
                replacement = item.rule_config.get("replacement") if item.rule_config else None
                suggested_rewrite = None
                if replacement:
                    suggested_rewrite = content[:start] + replacement + content[end:]

                findings.append({
                    "knowledge_item_id": item.id,
                    "source_type": "rule",
                    "category": "prohibited_term",
                    "severity": "critical",
                    "claim_status": "contradicted",
                    "title": f"Prohibited phrase detected: '{matched_text}'",
                    "explanation": f"Use of restricted terminology or prohibited claim '{matched_text}' violates brand policy.",
                    "evidence": f"Mandate from {item.source_label}: '{item.content}'",
                    "content_excerpt": excerpt,
                    "suggested_rewrite": suggested_rewrite,
                    "location_start": start,
                    "location_end": end,
                })
    return findings


def check_preferred_terms(content: str, items: List[KnowledgeItem]) -> List[Dict[str, Any]]:
    findings = []
    preferred_items = [it for it in items if it.active and it.kind == "preferred_term"]

    for item in preferred_items:
        # Check colloquial or disallowed synonyms
        disallowed = []
        if item.rule_config and "disallowed" in item.rule_config:
            disallowed.extend(item.rule_config["disallowed"])
        if item.normalized_value and item.normalized_value != item.content:
            disallowed.append(item.normalized_value)

        for non_standard in disallowed:
            if not non_standard.strip():
                continue
            pattern = rf"\b{re.escape(non_standard.strip())}\b"
            for match in re.finditer(pattern, content, flags=re.IGNORECASE):
                start, end = match.span()
                matched_text = match.group(0)
                excerpt = extract_excerpt(content, start, end)
                
                suggested_rewrite = content[:start] + item.content + content[end:]

                findings.append({
                    "knowledge_item_id": item.id,
                    "source_type": "rule",
                    "category": "terminology",
                    "severity": "warning",
                    "claim_status": "not_applicable",
                    "title": f"Non-standard terminology: '{matched_text}'",
                    "explanation": f"Term '{matched_text}' departs from approved brand lexicon. Standard term is '{item.content}'.",
                    "evidence": f"Approved Terminology from {item.source_label}: '{item.content}'",
                    "content_excerpt": excerpt,
                    "suggested_rewrite": suggested_rewrite,
                    "location_start": start,
                    "location_end": end,
                })
    return findings


def check_required_phrases(content: str, items: List[KnowledgeItem]) -> List[Dict[str, Any]]:
    findings = []
    required_items = [it for it in items if it.active and it.kind in ("required_phrase", "disclaimer")]

    content_lower = content.lower()
    for item in required_items:
        required_phrase = item.content.strip()
        if not required_phrase:
            continue
        
        # Check if the phrase or normalized form exists in the content
        phrase_found = required_phrase.lower() in content_lower
        if not phrase_found and item.normalized_value:
            phrase_found = item.normalized_value.lower() in content_lower

        if not phrase_found:
            findings.append({
                "knowledge_item_id": item.id,
                "source_type": "rule",
                "category": "missing_disclaimer",
                "severity": "warning" if item.kind == "disclaimer" else "critical",
                "claim_status": "unverified",
                "title": f"Missing required {item.kind.replace('_', ' ')}",
                "explanation": f"The draft does not include required wording: '{required_phrase}'.",
                "evidence": f"Mandatory compliance entry from {item.source_label}: '{item.content}'",
                "content_excerpt": None,
                "suggested_rewrite": f"{content.strip()}\n\n{required_phrase}",
                "location_start": None,
                "location_end": None,
            })
    return findings


def check_configured_fact_conflicts(content: str, items: List[KnowledgeItem]) -> List[Dict[str, Any]]:
    findings = []
    fact_items = [it for it in items if it.active and it.kind == "fact"]

    for item in fact_items:
        if not item.rule_config:
            continue

        # Look for explicit conflict regexes or keywords
        conflicts = item.rule_config.get("conflict_patterns", [])
        for pattern_str in conflicts:
            try:
                for match in re.finditer(pattern_str, content, flags=re.IGNORECASE):
                    start, end = match.span()
                    matched_text = match.group(0)
                    excerpt = extract_excerpt(content, start, end)

                    replacement = item.rule_config.get("replacement")
                    suggested = None
                    if replacement:
                        suggested = content[:start] + replacement + content[end:]

                    findings.append({
                        "knowledge_item_id": item.id,
                        "source_type": "rule",
                        "category": "fact_discrepancy",
                        "severity": "critical",
                        "claim_status": "contradicted",
                        "title": "Factual discrepancy with approved knowledge",
                        "explanation": f"Claim containing '{matched_text}' contradicts certified brand facts.",
                        "evidence": f"Certified fact from {item.source_label}: '{item.content}'",
                        "content_excerpt": excerpt,
                        "suggested_rewrite": suggested,
                        "location_start": start,
                        "location_end": end,
                    })
            except re.error:
                continue

    return findings


def run_deterministic_checks(content: str, items: List[KnowledgeItem]) -> List[Dict[str, Any]]:
    findings: List[Dict[str, Any]] = []
    findings.extend(check_prohibited_terms(content, items))
    findings.extend(check_preferred_terms(content, items))
    findings.extend(check_required_phrases(content, items))
    findings.extend(check_configured_fact_conflicts(content, items))

    # Sort findings by severity priority: critical first, then warning, then info
    severity_order = {"critical": 0, "warning": 1, "info": 2}
    findings.sort(key=lambda f: severity_order.get(f.get("severity", "info"), 3))
    return findings
