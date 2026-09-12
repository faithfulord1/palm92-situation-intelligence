# MCP Tool Plan

The tool layer should expose small, auditable capabilities rather than one unrestricted super-tool.

## Proposed tools

- `get_active_incidents`
- `get_incident_details`
- `get_evidence_for_incident`
- `get_events_near_location`
- `compare_evidence_sources`
- `get_affected_infrastructure`
- `prepare_incident_brief`
- `prepare_recommended_actions`
- `request_human_approval`
- `record_human_decision`
- `export_incident_report`

## Approval rule

Tools that change status, publish information, or trigger external actions must require human confirmation.
