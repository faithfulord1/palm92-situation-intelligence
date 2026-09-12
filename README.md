# Palm92 Situation Intelligence

**See the situation. Understand the risk. Keep humans in control.**

Palm92 Situation Intelligence is a governed geospatial intelligence platform for combining public data, incident evidence, infrastructure context, AI-assisted analysis, and human approval into one explainable operational picture.

## Why this exists

Most real-world incidents are not short of data. They are short of coordination. Weather feeds, transport disruption, satellite observations, public reports, infrastructure maps, media evidence, and official notices often live in separate systems.

Palm92 Situation Intelligence brings those signals together and turns them into an evidence-backed situation model.

**Observe → Correlate → Explain → Assess risk → Preserve evidence → Recommend action → Human decides**

## Current status

**Phase 1 is now in progress with live public feeds.**

Connected now:

- USGS daily earthquake feed
- Transport for London status feed
- Open-Meteo current London weather
- NASA FIRMS adapter scaffold with API-key detection

The dashboard refreshes live data automatically every two minutes and displays source provenance and freshness.

## Run locally

The starter uses only Node's built-in modules.

```bash
node app/server.mjs
```

Then open:

```text
http://127.0.0.1:4173
```

## Optional NASA FIRMS setup

Add a NASA FIRMS MAP_KEY as an environment variable:

```bash
NASA_FIRMS_MAP_KEY=your_key_here node app/server.mjs
```

The full FIRMS parser is the next live-data adapter task.

## MVP

The MVP focuses on five safe, high-value layers:

- Earthquakes
- Active fires
- Severe weather
- Public transport and rail disruption
- Critical infrastructure context

It also includes Incident Mode for timelines, evidence provenance, confidence scoring, affected assets, and recommended next actions.

## Core principles

- AI investigates. Humans decide.
- Every material claim should be traceable to evidence.
- Confidence must be visible, not implied.
- Sensitive actions require human approval.
- Public safety and privacy controls are part of the architecture, not an afterthought.
- No covert person tracking, facial recognition, licence-plate tracking, or other individual surveillance is included in the baseline build.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md), [GOVERNANCE.md](GOVERNANCE.md), and [DATA-SOURCES.md](DATA-SOURCES.md).

## Pinokio

The repository includes a starter Pinokio launcher structure (`pinokio.js`, `pinokio.json`, `install.js`, `start.js`, `update.js`, `reset.js`).

## Next

1. Complete NASA FIRMS active-fire parsing.
2. Add a real interactive map.
3. Add evidence objects and incident correlation.
4. Add UK rail disruption beyond TfL.
5. Add infrastructure dependencies.
6. Add AI incident brief generation with human approval gates.
