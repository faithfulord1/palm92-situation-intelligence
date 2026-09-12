# Palm92 Situation Intelligence

**See the situation. Understand the risk. Keep humans in control.**

Palm92 Situation Intelligence is a governed geospatial intelligence platform for combining public data, incident evidence, infrastructure context, AI-assisted analysis, and human approval into one explainable operational picture.

## Current status

**Phase 1 live map is working.**

Connected now:

- USGS daily earthquake feed
- Transport for London status feed
- Open-Meteo current London weather
- Interactive Leaflet + OpenStreetMap operational map
- Selectable live markers and intelligence panel
- Layer controls for earthquakes, weather, transport, and fires
- Source provenance and freshness
- NASA FIRMS adapter scaffold with API-key detection

The dashboard refreshes public data automatically every two minutes.

## Why this exists

Most real-world incidents are not short of data. They are short of coordination. Weather feeds, transport disruption, satellite observations, public reports, infrastructure maps, media evidence, and official notices often live in separate systems.

Palm92 brings those signals together and turns them into an evidence-backed situation model.

**Observe → Correlate → Explain → Assess risk → Preserve evidence → Recommend action → Human decides**

## Run locally

The starter uses Node's built-in modules for the server.

```bash
node app/server.mjs
```

Then open:

```text
http://127.0.0.1:4173
```

Internet access is needed in the browser for the OpenStreetMap tiles and Leaflet CDN.

## Optional NASA FIRMS setup

```bash
NASA_FIRMS_MAP_KEY=your_key_here node app/server.mjs
```

The full FIRMS parser remains the next live-data adapter task.

## Core principles

- AI investigates. Humans decide.
- Every material claim should be traceable to evidence.
- Confidence must be visible, not implied.
- Sensitive actions require human approval.
- Public safety and privacy controls are part of the architecture, not an afterthought.
- No covert person tracking, facial recognition, licence-plate tracking, or other individual surveillance is included in the baseline build.

## Next

1. Complete NASA FIRMS active-fire parsing.
2. Add incident objects and cross-source correlation.
3. Add wider UK rail disruption.
4. Add infrastructure dependencies.
5. Add Impact Path.
6. Add AI incident brief generation with approval gates.
