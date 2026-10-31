# Palm92 Community Pulse

Community Pulse is a community reporting and communications layer for Palm92 Situation Intelligence. It gives residents and community groups a shared pattern for raising local concerns, organising evidence, and preparing a human-reviewed hand-off.

## Areas in the first prototype

- Flood and blocked drains
- Road and pedestrian safety
- Missed or overflowing waste collection
- Fire risks in markets and community venues
- Access to trusted health information
- Scam and fraud risk awareness

## Current prototype boundary

The static browser demo at `/community.html` stores sample reports in the current browser's local storage. It has no user accounts, shared server database, authority integration, live AI model, emergency dispatch, or verified incident feed. Its triage view is a transparent interface prototype, not an AI prediction. Fictional sample reports are labelled.

The user chooses the issue category and urgency. The demo displays what was submitted, lets the user export JSON, and can prepare a LinkedIn post draft. A person must check any report before it is shared or acted on.

## Design rules

1. **AI investigates. Humans decide.** Keep people responsible for verification, escalation, and decisions.
2. **Collect the minimum.** The prototype does not request names, phone numbers, images, or precise GPS coordinates.
3. **No public accusation feed.** Reports describe an observed condition, not a named person's alleged wrongdoing.
4. **No emergency substitute.** The service must clearly direct urgent emergencies to the appropriate emergency service and local authority.
5. **Keep provenance.** A future shared service should record reporter consent, source, received time, evidence freshness, review status, and action outcome.
6. **Localise carefully.** UK and Nigerian deployments need separate authority routes, language, emergency guidance, privacy review, and community validation.
7. **Do not imply verified AI.** Any future AI summary or classification must be labelled, explain evidence, show uncertainty, and support human correction.

## Suggested next engineering phase

- Connect this page to Situation Intelligence's incident schema through a reviewed adapter.
- Add a shared backend only after a data protection and safeguarding review, with access controls, retention rules, and an audit log.
- Add trusted, permissioned source links for official flood, transport, waste, fire-safety, health-service, and fraud guidance.
- Build a human review queue with status changes and an exportable evidence bundle.
- Pilot one category and one locality with a named receiving organisation before expanding.

## Video and LinkedIn workflow

The first story is “Could AI help us spot flood danger earlier?” It presents a proposed community reporting pilot, not a deployed service. The dashboard creates a LinkedIn draft for a person to review and post. It does not publish to LinkedIn.
