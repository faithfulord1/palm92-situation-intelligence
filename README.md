# Palm92 Situation Intelligence

**See the situation. Understand the risk. Keep humans in control.**

Palm92 Situation Intelligence is a governed geospatial intelligence platform for combining public data, incident evidence, infrastructure context, AI-assisted analysis, and human approval into one explainable operational picture.

## Why this exists

Most real-world incidents are not short of data. They are short of coordination. Weather feeds, transport disruption, satellite observations, public reports, infrastructure maps, media evidence, and official notices often live in separate systems.

Palm92 Situation Intelligence brings those signals together and turns them into an evidence-backed situation model.

**Observe → Correlate → Explain → Assess risk → Preserve evidence → Recommend action → Human decides**

## MVP

The first MVP focuses on five safe, high-value layers:

- Earthquakes
- Active fires
- Severe weather
- Public transport and rail disruption
- Critical infrastructure context

It also includes an Incident Mode for timelines, evidence provenance, confidence scoring, affected assets, and recommended next actions.

## Core principles

- AI investigates. Humans decide.
- Every material claim should be traceable to evidence.
- Confidence must be visible, not implied.
- Sensitive actions require human approval.
- Public safety and privacy controls are part of the architecture, not an afterthought.
- No covert person tracking, facial recognition, licence-plate tracking, or other individual surveillance is included in the baseline build.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md), [GOVERNANCE.md](GOVERNANCE.md), and [DATA-SOURCES.md](DATA-SOURCES.md).

## Run locally

The starter dashboard uses only Node's built-in modules.

```bash
node app/server.mjs
```

Then open `http://127.0.0.1:4173`.

## Pinokio

The repository includes a starter Pinokio launcher structure (`pinokio.js`, `pinokio.json`, `install.js`, `start.js`, `update.js`, `reset.js`).

## Status

**Phase 0: foundation scaffold**

Next: connect real public feeds, add evidence storage, implement incident reconstruction, then add domain packs for rail, humanitarian response, infrastructure, and governance.
