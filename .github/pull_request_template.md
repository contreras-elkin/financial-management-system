<!--
Title format (Conventional Commits): <type>(<scope>): <description>
Types: feat, fix, chore, ci, build, docs, refactor, test
Example: feat(clients): add client creation endpoint
Base branch: develop (release/* and hotfix/* go to main)
-->

## Summary
<!-- What this PR does and why, in 1-3 sentences. -->

## Changes
- 

## Related requirements
<!-- Business rules from the technical test covered by this PR. Remove if not applicable. -->
- 

## How to verify
```bash
cd backend
./mvnw clean verify
```

## Checklist
- [ ] Builds and tests pass locally (`./mvnw clean verify`)
- [ ] Unit tests added/updated for service and controller layers
- [ ] Database changes included as Flyway migrations
- [ ] No secrets or local configuration committed

## Notes
<!-- Pending work, decisions, or anything the reviewer should know. Remove if empty. -->
