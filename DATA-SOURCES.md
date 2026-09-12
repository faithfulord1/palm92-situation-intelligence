# Data Sources Strategy

The MVP starts with public, documented, low-risk sources.

## Connected sources

| Layer | Source | State | Notes |
|---|---|---|---|
| Earthquakes | USGS | Live | Daily GeoJSON feed, magnitude, depth, location, timestamps |
| London transport | Transport for London Unified API | Live | Tube, Overground, DLR and Elizabeth line status |
| Weather | Open-Meteo | Live | Current London weather and hourly precipitation probability |
| Active fires | NASA FIRMS | Adapter scaffold | API key detection is implemented; event parsing comes next |

## Planned sources

| Layer | Example source class | Notes |
|---|---|---|
| UK rail | Operator / public rail disruption feeds | Incidents, closures, delays |
| Infrastructure | Open mapping / operator-published datasets | Sites, routes, dependencies |
| Severe warnings | National meteorological services | Warning polygons and alert levels |

## Source acceptance checklist

Before a source is enabled:

1. Is use permitted by the source terms?
2. Is the data public or otherwise authorised?
3. What is its refresh rate?
4. What geographic coverage does it have?
5. What failure modes are known?
6. Does it expose personal or sensitive data?
7. What attribution is required?
8. Can the system preserve original provenance?
