# Architecture

## High-level flow

```text
Public / permitted data sources
        ↓
Ingestion + normalisation
        ↓
Geospatial event model
        ↓
Correlation engine
        ↓
AI-assisted interpretation
        ↓
Evidence + provenance layer
        ↓
Risk + confidence engine
        ↓
Human review / approval
        ↓
Dashboard + incident report + audit trail
```

## Components

### 1. Data ingestion
Adapters for public APIs and authorised sources. Each adapter records source, retrieval time, licence/terms notes, geographic scope, freshness, and confidence.

### 2. Common event model
Normalises earthquakes, fires, weather alerts, transport disruption, infrastructure assets, and submitted evidence into a shared schema.

### 3. Correlation engine
Groups related events by time, location, infrastructure dependency, and incident identifier.

### 4. Evidence graph
Links every material conclusion to its supporting observations. Conflicting evidence remains visible rather than being silently overwritten.

### 5. Intelligence layer
AI can summarise, compare, explain, and suggest next actions. It must not fabricate missing evidence or silently promote uncertain data to fact.

### 6. Human governance
Consequential actions remain behind human approval gates.

### 7. Audit trail
Stores what the system observed, what the AI inferred, what the human approved, and what changed afterwards.
