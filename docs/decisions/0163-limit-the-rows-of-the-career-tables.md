# 0163. Limit the rows of the career tables

- Status: accepted
- Date: 2026-10-30

## Context and problem statement

[ADR-0133](0133-limit-the-storage-and-the-rows-of-one-account.md) caps the rows of one account in every table a learner writes, and [ADR-0160](0160-gamify-learning-as-a-museum-career.md) promised the points ledger the same. The 0.15 code review found `point_events`, `exhibit_tiers` and `free_review_days` without a limit: the REST API and `import_atelier` could fill the database. How many rows may one account hold in them?

## Decision drivers

- An honest learner never meets a limit.
- The automatic paths (the point triggers and `unlock_exhibits`) must never raise; they already stop recording at a soft cap of 50000 point events.
- The same mechanism as the other tables: `private.limit_rows`, once per insert statement, SQLSTATE `53400`.

## Considered options

- Limits well above honest use, enforced by `private.limit_rows`
- No limit, relying on the soft cap of the triggers

## Decision outcome

Chosen by the owner: limits well above honest use.

| Rows             | Limit |
| ---------------- | ----- |
| Point events     | 60000 |
| Exhibit tiers    | 200   |
| Free review days | 10000 |

- Point events stay above the soft cap of 50000 that the triggers keep, so adding an artwork or a definition never fails on the ledger; plan days add one row a day.
- All exhibits have 67 tiers together, so 200 leaves room for new exhibits.
- Free review days hold one row a day, about 27 years.

### Consequences

- Good: a script or a crafted import can no longer fill the database through the career tables.
- Bad: three more numbers to keep in step with the content, for example when exhibits grow past 200 tiers in total.

## More information

Migration `20261030100000_fix_the_0_15_review_findings.sql`; tests in `supabase/tests/account-limits.sql` (ATL-392).
