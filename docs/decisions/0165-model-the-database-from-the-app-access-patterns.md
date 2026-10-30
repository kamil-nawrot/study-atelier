# 0165. Model the database from the app's access patterns

- Status: accepted
- Date: 2026-10-30

## Context and problem statement

The review of the API communication and the database model ([ATL-403](https://linear.app/kamil-nawrot/issue/ATL-403)) found that many detail views read whole tables to show one thing: the whole glossary for one tooltip, the whole collection and card index for the labels of a few note links, and the notes of every table for "Wspomniane w". The schema grew one feature at a time, and there was no place where the reads of the app and the shape of the database were compared. Before any change to the model, how is the model worked out and recorded?

## Decision drivers

- A change of the model is judged by what it serves, what it costs and what it gives up, before anything is built.
- The model is text a pull request can review, next to the migrations it describes.
- The model can be compared with the schema the migrations actually build.

## Considered options

1. A long design document describing the target model
2. A query-driven model in structured files under `docs/data-model/`: access patterns, conceptual model, current and target schema in DBML, coverage with cost and loss
3. The same four steps as an interactive page outside the repository

## Decision outcome

Chosen by the owner: option 2, because the model lives with the code, each step is reviewable as data, and the target schema is a diff against the current one.

- [`docs/data-model/`](../data-model/README.md) holds the four steps. `current.dbml` is generated from the migrations; `target.dbml` is the current schema with the proposed changes, each marked with its id from `coverage.yaml`.
- The first proposal is in the same folder: store note links and term mentions as rows (M1, M2), with the alternatives that keep today's tables. Which of them is built is decision D1 of `coverage.yaml`, taken separately.

### Consequences

- Good: a model change starts from the patterns it serves and states its losses, so it can be compared with the alternatives before an ADR for the change itself.
- Good: the reads of every view are listed in one place, which shows where a view reads more than it shows.
- Bad: `access-patterns.yaml` and `current.dbml` go stale unless pull requests keep them up to date; a check in CI is decision D2.

## More information

- Report of the review (Polish): attached to ATL-403 in Linear.
