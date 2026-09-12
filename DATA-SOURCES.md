# Data Sources Strategy

The MVP should start with public, documented, low-risk sources.

## Planned layers

| Layer | Example source class | Notes |
|---|---|---|
| Earthquakes | Geological agencies | Public event feeds, magnitude, depth, timestamps |
| Active fires | Satellite fire detection | Public hotspot data with freshness metadata |
| Weather | National meteorological services | Alerts, warnings, forecasts |
| Rail / transport | Public transport disruption feeds | Incidents, closures, delays |
| Infrastructure | Open mapping / operator-published datasets | Sites, routes, dependencies |

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
