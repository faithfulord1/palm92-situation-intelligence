# MCP Tool Contract

Palm92 should expose small auditable tools instead of one unrestricted super-tool.

## Read tools

- `get_active_incidents`
- `get_incident_details`
- `get_evidence_for_incident`
- `get_events_near_location`
- `compare_evidence_sources`
- `get_affected_infrastructure`
- `get_dependency_path`
- `get_source_freshness`

## Preparation tools

- `prepare_incident_brief`
- `prepare_recommended_actions`
- `prepare_escalation_package`
- `export_incident_report`
- `save_operational_scene`

## Human-control tools

- `request_human_approval`
- `record_human_decision`

## Approval contract

Read-only investigation can execute automatically.

Any tool that publishes, changes an incident state, contacts a third party, dispatches resources, or triggers another system must stop at a human approval gate.

The MVP implements this philosophy in the browser UI. A production MCP server remains a v2 workstream.
