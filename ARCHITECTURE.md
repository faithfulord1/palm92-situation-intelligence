# Architecture

## High-level flow

```text
Public / permitted data sources
        ↓
Ingestion + normalisation
        ↓
Geospatial observations
        ↓
Correlation engine
        ↓
Incident object
        ↓
Evidence bundle + confidence
        ↓
Impact Path / affected entities
        ↓
Recommendation
        ↓
Human review / approval
        ↓
Audit trail
```

## Components

### 1. Data ingestion
Adapters for public APIs and authorised sources. Each adapter records source, retrieval time, licence/terms notes, geographic scope, freshness, and confidence.

### 2. Observation model
Normalises earthquakes, weather, transport status, fires, infrastructure assets, and submitted evidence into source-labelled observations.

### 3. Correlation engine
Groups related observations into an incident object. The current browser implementation uses deterministic rules. A server-side correlation service can replace or augment this later.

### 4. Incident object
Each incident contains:
- stable ID
- type
- title and location
- severity
- confidence
- source-labelled evidence
- status
- Impact Path
- recommended next action
- human-review state

### 5. Evidence bundle
Observed evidence and inferred conclusions are displayed separately. Conflicting or stale evidence must remain visible.

### 6. Confidence engine
Confidence is explicit and should decrease when evidence is missing, stale, conflicting, or coverage is weak.

### 7. Impact Path
Palm92 models the consequence chain, for example:

```text
Signal → Asset → Service → People → Mitigation → Recovery
```

### 8. Intelligence layer
AI may summarise, compare, explain, and prepare actions. It must not fabricate missing evidence or silently promote inference to fact.

### 9. Human governance
Consequential actions remain behind human approval gates.

### 10. Audit trail
Stores what the system observed, inferred, recommended, what a human decided, and what happened afterwards.
