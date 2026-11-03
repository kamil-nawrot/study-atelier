# 0170. Keep the reference reads in the data cache

- Status: accepted
- Date: 2026-11-03

## Context and problem statement

[ADR-0166](0166-forget-only-the-cache-keys-a-write-changes.md) keeps the collection, the card index, the form suggestions and the glossary in the memory of the tab and forgets only the keys a write changes. Three small reads stayed outside it and run again on every opening: the definitions of the own fields (the wall, the artwork view, the artwork forms), the era summaries (the artwork view) and the museum catalogue (the artwork form and the visit form). They change rarely, and the catalogue changes only with a migration. Should they live in the cache too?

## Decision drivers

- Flipping through artworks and opening forms does not ask again for what has not changed.
- A write that changes one of them is shown at once, also in other tabs.

## Considered options

- Keep reading them on every opening
- Keep them in the data cache under their own keys, forgotten by the writes that change them

## Decision outcome

Chosen by the owner as step T3′ of the data model plan of ATL-403: keep them in the data cache.

- `cacheKeys` gains `own-fields`, `era-summaries` and `museums`.
- The table of [ADR-0166](0166-forget-only-the-cache-keys-a-write-changes.md) gains these rows:

| Write                       | Also forgets    |
| --------------------------- | --------------- |
| Own fields and their values | `own-fields`    |
| Save the details of an era  | `era-summaries` |

- The museum catalogue is shared by every account and changes only with a migration, which comes with a release and the reload of [ADR-0139](0139-ask-the-learner-to-reload-after-a-new-release.md), so no write forgets it. The countries of the learner's own places, read with it, are not kept.
- The era summaries are kept for the whole set; the summaries of an artwork's values are still read per artwork.

### Consequences

- Good: two flips through artworks take 6 requests instead of 8, and the cold artwork view 17 instead of 19, measured with `pnpm screenshot --log-requests`.
- Bad: three more keys for the writes to name; a missed key shows stale data until a reload or a 10-minute break.

## More information

- Amends [ADR-0166](0166-forget-only-the-cache-keys-a-write-changes.md): its table of keys; the rest stands.
