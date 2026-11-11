# 0249. Give every ADR an area in a checked index

- Status: accepted
- Date: 2026-11-11

## Context and problem statement

The ADR index listed 246 decisions by number only, so the decisions on one topic had to be found by searching titles. Its status column was kept by hand: in 31 ADRs it said "accepted" while the ADR's own Status line recorded that part of the decision was superseded later, so a reader of the index missed the change. How can the decisions on a topic be found, with their current status?

## Decision drivers

- The decisions of one part of the app are found in one step.
- The index never says less about a decision's status than the ADR itself.
- Accepted ADRs stay unchanged, as [documentation.md](../guidelines/documentation.md#architecture-decision-records) requires.

## Considered options

- **A:** an Area column in the index, with the titles and statuses checked against the ADRs and rewritten from them by a command.
- **B:** an `Area` line in every ADR and an index generated in full.

## Decision outcome

Chosen option: "A", because it needs no change to the 246 accepted ADRs and still makes the ADRs the only source of titles and statuses.

- Every row of [the index](README.md) has one area from the list above the table: the modules of the web app (`artworks`, `images`, `pins`, `wall`, `card-index`, `values`, `notes`, `glossary`, `timeline`, `chronicle`, `review`, `career`, `exhibitions`, `statistics`, `compare`, `profile`, `auth`, `data-transfer`, `legal`, `feedback`, `shell`) and `process`, `architecture`, `database`, `design-system` and `texts`. An ADR gets the area it is mainly about.
- `pnpm adr:index` ([`tools/adr/adr.mjs`](../../tools/adr/adr.mjs)) rewrites the titles and statuses of the index from the ADRs and adds a new ADR with the area `?`; `pnpm adr <area>` lists the ADRs of an area with their status, fully superseded ones last.
- [`check-docs.mjs`](../../.github/scripts/check-docs.mjs) fails when a title or status in the index differs from the ADR or an area is not on the list.

### Consequences

- Good: the 31 partly superseded decisions show it in the index, and a status cannot drift again.
- Good: Claude reads the decisions of a topic with one command before changing it.
- Bad: one area per ADR hides a decision that touches two parts of the app from the second one; a title search still finds it.

## More information

Issue: [ATL-632](https://linear.app/kamil-nawrot/issue/ATL-632).
