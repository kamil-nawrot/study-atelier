# 0092. Run the unused images clean-up by hand for one environment

- Status: accepted
- Date: 2026-10-20

## Context and problem statement

The unused images clean-up of [ADR-0090](0090-clean-up-unused-images-daily-from-github-actions.md) cleans both environments on every run, also when the owner starts it by hand. The first manual run, from `develop`, passed for the develop project and failed for production with a bare "404": `unused_images()` reaches the production database only with the next release, and the log did not show Supabase's answer. Should a manual run follow the branch it is started from?

A scheduled workflow always runs from the default branch, `develop`, so the daily run has to reach both projects from there.

## Decision drivers

- A manual run checks the workflow and the database function that belong together.
- A failed run says why.

## Considered options

- Keep both environments on every run.
- A manual run cleans only the environment of its branch; the schedule cleans both.

## Decision outcome

Chosen by the owner: a manual run cleans only the environment of its branch.

- Started by hand from `main`, the workflow cleans `production`; from `develop`, it cleans `develop`. The daily schedule cleans both, as before.
- When a request to Supabase fails, the log shows Supabase's answer as well as the HTTP status.

### Consequences

- Good: a manual run from `main` uses the workflow and the function of the release that is in production.
- Bad: until a release brings `unused_images()` to production, the scheduled run still fails for production.

## More information

- Supersedes the point of [ADR-0090](0090-clean-up-unused-images-daily-from-github-actions.md) that every run cleans both environments. Issue: ATL-218.
