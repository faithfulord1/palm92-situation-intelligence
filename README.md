# Palm92 Situation Intelligence

**See the situation. Understand the risk. Keep humans in control.**

Palm92 Situation Intelligence is a governed geospatial incident-intelligence platform that combines live public data, evidence provenance, infrastructure dependencies, deterministic correlation, a local natural-language copilot, human approval gates, and exportable incident records.

## MVP status

**v1.0 MVP complete**

Implemented:

- USGS daily earthquake feed
- Transport for London live line status
- TfL infrastructure / stop dependencies
- Open-Meteo current London weather
- NASA FIRMS live fire adapter when `NASA_FIRMS_MAP_KEY` is configured
- Leaflet + OpenStreetMap interactive map
- Selectable data layers
- Incident correlation engine
- Confidence scoring
- Observed vs inferred evidence labels
- Evidence bundles
- Impact Path
- Dependency graph
- Human review and escalation-preparation gates
- Local audit trail
- Incident JSON export
- Saved operational scenes
- Deterministic text copilot
- Browser voice input where supported
- Pinokio launcher

## Product principle

**AI investigates. Humans decide. Evidence proves why.**

Palm92 is decision support, not an autonomous authority.

## Run locally

Node 18+ is recommended.

```bash
npm start
```

or:

```bash
node app/server.mjs
```

Open:

```text
http://127.0.0.1:4173
```

## Optional NASA FIRMS

Create a NASA FIRMS MAP_KEY and set:

```bash
NASA_FIRMS_MAP_KEY=your_key_here npm start
```

Without a key, the rest of the product remains usable and the fire layer is marked as unavailable.

## Example copilot commands

- What needs attention?
- Explain this incident
- What depends on this incident?
- Show me the infrastructure
- Focus on London
- What is the weather?
- Show earthquakes

The current copilot is deliberately deterministic. It does not call a remote LLM, so its behaviour remains auditable and predictable.

## Governance

The baseline deliberately excludes covert person tracking, facial recognition, licence-plate tracking, stalking, weapon-targeting workflows, and autonomous consequential actions.

See:

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [GOVERNANCE.md](GOVERNANCE.md)
- [INCIDENT-SCHEMA.md](INCIDENT-SCHEMA.md)
- [DATA-SOURCES.md](DATA-SOURCES.md)
- [MCP-TOOLS.md](MCP-TOOLS.md)
- [SECURITY.md](SECURITY.md)
- [PROJECT-STATUS.md](PROJECT-STATUS.md)

## Pinokio

The repository includes:

- `pinokio.js`
- `pinokio.json`
- `install.js`
- `start.js`
- `update.js`
- `reset.js`

This gives non-coders a local launcher path without exposing secrets in source code.

## What v1.0 is not

This is an MVP, not a production emergency-management system. Real deployment would still require source licensing review, service-level monitoring, role-based access control, durable server-side audit storage, security testing, privacy assessment, and operational validation with domain owners.
