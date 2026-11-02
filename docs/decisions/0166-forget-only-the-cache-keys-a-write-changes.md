# 0166. Forget only the cache keys a write changes

- Status: accepted
- Date: 2026-11-02

## Context and problem statement

[ADR-0157](0157-keep-the-collection-and-card-index-in-memory-between-views.md) keeps the collection, the card index, the form suggestions and the glossary in the memory of the tab, and every write calls `forgetCached()`, which forgets all of them. Marking a favourite loads the card index again, and a glossary save loads the whole collection again. The data model plan of ATL-403 also keeps a light glossary index and one definition per term in the cache, which a write to an artwork must not throw away. Can a write forget only what it changes?

## Decision drivers

- A write forgets every key whose answer it changes; a missed key shows stale data.
- A write does not forget answers it cannot change.
- Other tabs forget the same keys.

## Considered options

- Keep forgetting everything on every write
- Each write names the keys it changes
- Each loader names the tables it reads, and each write the tables it writes

## Decision outcome

Chosen by the owner as step T8 of the data model plan of ATL-403: each write names the keys it changes.

- `data-cache.ts` lists the keys in `cacheKeys`: `atelier`, `card-index`, `category-values`, `value-links` and `glossary`. `cached()` takes one of them, or one of them followed by `:` and an id, such as `glossary:<id>`.
- `forgetCached(keys)` forgets each named key and every key under it (`glossary` also forgets `glossary:<id>`); `forgetCached()` without keys still forgets everything, which the import does.
- The broadcast to other tabs carries the keys, and a tab that gets a message without keys forgets everything, so a tab still on the older version is never left with stale data.
- What each write forgets, from what each loader reads:

| Write                                                   | Forgets                                                   |
| ------------------------------------------------------- | --------------------------------------------------------- |
| Save an artwork; save or delete a visit; change values  | `atelier`, `card-index`, `category-values`, `value-links` |
| Move to the trash, restore, delete for good; own fields | `atelier`, `card-index`, `category-values`                |
| Save the details of a value or an era                   | `atelier`, `card-index`                                   |
| Mark a favourite                                        | `atelier`                                                 |
| Save or delete a glossary entry                         | `glossary`                                                |
| Import an atelier                                       | everything                                                |

- Tracking tables per loader was set aside: the loaders read nested selects (the collection holds value names, author sort names, own field entries and visits), so a table map would be as long as this one and harder to read.

### Consequences

- Good: a favourite no longer loads the card index again, and a glossary save no longer loads the collection again.
- Good: the glossary index and the definitions of the next step can live in the cache next to the collection.
- Bad: a new write, or a loader that starts reading another table, must update this table; a missed key shows stale data until the next write of that key, a reload or a 10-minute break.

## More information

- Amends [ADR-0157](0157-keep-the-collection-and-card-index-in-memory-between-views.md): its point that every write forgets everything; the rest stands.
- Step T8 of the data model plan, issue ATL-403.
