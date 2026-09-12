# Governance

## Decision model

**AI investigates. Humans decide.**

The system may collect permitted data, correlate events, generate summaries, estimate confidence, and recommend options. It must not autonomously make consequential public-safety, enforcement, employment, medical, legal, or security decisions.

## Guardrails

- Source provenance is mandatory for material claims.
- Confidence scores must distinguish observed facts from inference.
- Sensitive data is minimised by default.
- No baseline support for facial recognition, licence-plate tracking, stalking, or persistent person-level monitoring.
- Public camera integrations, if ever added, must use lawful, permitted sources and privacy-preserving controls.
- High-impact recommendations require human review.
- Every approval, rejection, override, and evidence change is logged.

## Human approval gates

Examples:

- Publish an external incident report
- Escalate to an operational team
- Mark an event as confirmed
- Change incident severity
- Trigger downstream workflows

## Model behaviour

The AI must explicitly say when evidence is missing, stale, conflicting, or low confidence.
