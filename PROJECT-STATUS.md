# Project Status

## Palm92 Situation Intelligence v1.0

Status: **MVP complete**

### Working capabilities

The product can ingest current public feeds, display them spatially, turn selected signals into incident objects, show evidence and confidence, map TfL infrastructure dependencies, generate an Impact Path, prepare recommendations, capture local human-review events, export incident JSON, save scenes, and accept deterministic text / browser voice commands.

### Live / external dependencies

- USGS earthquake feed
- Transport for London Unified API
- TfL StopPoint API
- Open-Meteo
- OpenStreetMap tiles
- Leaflet CDN
- NASA FIRMS when a MAP_KEY is configured

### Data handling

No secrets are committed to the repository. Optional provider credentials are expected through environment variables.

The local audit trail and saved scenes currently use browser localStorage. They are intentionally local and are not presented as enterprise-grade persistent evidence storage.

### Production-readiness gap

Before operational deployment, add authentication, RBAC, durable audit storage, formal DPIA/privacy review where applicable, threat modelling, dependency monitoring, API rate-limit handling, incident retention rules, accessibility testing, automated tests, and domain-owner validation.

### Portfolio statement

Palm92 Situation Intelligence demonstrates how governed AI-assisted systems can transform fragmented public signals into explainable incident intelligence while preserving human authority over consequential decisions.
