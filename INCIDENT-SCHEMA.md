# Incident Object Schema

Palm92 incident objects are derived from observations and remain explainable.

```json
{
  "id": "tfl-victoria-1",
  "type": "Transport disruption",
  "title": "Victoria line disruption",
  "location": "London transport network",
  "severity": "medium",
  "confidence": 85,
  "status": "Unconfirmed incident object",
  "summary": "Source-grounded summary",
  "evidence": [
    {
      "kind": "observed",
      "source": "Transport for London",
      "claim": "Reported status",
      "freshness": "2m ago"
    },
    {
      "kind": "inferred",
      "source": "Palm92 correlation rule",
      "claim": "Possible operational pressure",
      "freshness": "computed now"
    }
  ],
  "impact": [
    ["Signal", "Observed disruption"],
    ["Asset", "Affected line or stations"],
    ["Service", "Journey reliability"],
    ["People", "Passengers"],
    ["Mitigation", "Review alternatives"],
    ["Recovery", "Return to normal service"]
  ],
  "recommendation": "Human-reviewable next step"
}
```

## Rules

1. Observed evidence must name the source.
2. Inference must never be labelled as observed fact.
3. Confidence is not probability of truth; it is a decision-support score reflecting evidence quality and corroboration.
4. An incident is not "confirmed" until an authorised human or authoritative source confirms it.
5. Recommendations do not execute themselves.
