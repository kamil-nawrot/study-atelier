# 0342. Search Wikipedia for people for a figure without a category

- Status: accepted
- Date: 2026-11-23

## Context and problem statement

[ADR-0341](0341-let-a-glossary-entry-have-no-category.md) let a glossary entry have no category and searched Wikipedia by the name alone, without the filter for people, while no category is chosen. The code review of 0.26.1 found that a figure saved without a category could then get an article about a place or a work of the same name as its biographical note, for example the sculpture instead of the king for "Dawid".

## Decision drivers

- A figure is a person, a saint or a figure of myth, so an article about a building or an artwork is never the right note.
- Most figures without a category are people who fit none of the roles (a model, a philosopher).

## Considered options

- Keep the search without a filter until a category is chosen.
- Keep only articles about people for a figure without a category.

## Decision outcome

Chosen option: "Keep only articles about people for a figure without a category", chosen by the owner in the 0.26.1 review (ATL-849). The Wikipedia search takes the kind of the entry: a figure without a category keeps only articles about humans (Wikidata `Q5`), as Władca, Fundator i mecenas, Artysta and Uczony i badacz do; a term without a category still searches by the name alone without a filter. This supersedes the filter part of the Wikipedia search in ADR-0341.

### Consequences

- Good: a figure without a category no longer gets a note about a place or a work.
- Bad: a saint or a figure of myth left without a category finds nothing when its article is not about a human; choosing Postać biblijna i święty or Bóstwo i postać mitu searches without the filter again.
