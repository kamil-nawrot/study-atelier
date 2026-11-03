# 0174. Forget after a details save only what reads that kind

- Status: accepted
- Date: 2026-11-03

## Context and problem statement

[ADR-0166](0166-forget-only-the-cache-keys-a-write-changes.md) has every save of the details of a value or an era forget `atelier` and `card-index`. The 0.16 review (ATL-433) found that neither loader reads the details of an era, a period, a style or a material. The collection reads only the sort name of an author, and the card index reads only the details of authors and locations. A save of a period's notes therefore loads the whole collection and the card index again for nothing. Which keys does a details save forget?

## Decision drivers

- A write forgets every key whose answer it changes; a missed key shows stale data.
- A write that changes nothing a loader reads does not make it load again.

## Considered options

- Forget by the kind of the value
- Keep forgetting `atelier` and `card-index` for every kind

## Decision outcome

Chosen by the owner in ATL-433: forget by the kind of the value. This replaces the row "Save the details of a value or an era" of the ADR-0166 table:

| Save the details of             | Forgets                 |
| ------------------------------- | ----------------------- |
| an author                       | `atelier`, `card-index` |
| a location                      | `card-index`            |
| an era                          | `era-summaries`         |
| a period, a style or a material | nothing                 |

- Every save still notes a write and tells the other tabs, so what listens for writes (the artwork preload of [ADR-0173](0173-preload-only-the-core-of-the-next-artwork.md)) still reacts.

### Consequences

- Good: saving the notes of an era, a period, a style or a material no longer loads the collection or the card index again.
- Bad: a loader that starts reading another details table must add its key to this table, or it shows stale details.

## More information

- Issue ATL-433, finding of the 0.16 review (data loading); amends ADR-0166.
