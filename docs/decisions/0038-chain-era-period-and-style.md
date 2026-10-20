# 0038. Chain era, period and style, with the era from a fixed list

- Status: accepted; the wall order by era is superseded by [0085](0085-group-the-wall-by-era-period-and-style.md)
- Date: 2026-10-13

## Context and problem statement

Period, style and material are free [category values](../product/glossary.md) with a starting list each ([ADR-0014](0014-artwork-collection-data-model.md), R-24). Period takes any number of values, and nothing ties a style to a period. The owner wants the style field to suggest only the styles of the period chosen before it, and to stay locked until a period is chosen.

Working through the consequences showed a mixed level in the existing data: artworks carry two "periods", such as "prehistoria" and "paleolit", where the second is a subdivision of the first. Ordering the wall by period ([ADR-0033](0033-order-the-wall-by-period-with-a-period-rail.md)) already used only the first value, and the owner had always read that order as the six main eras.

## Decision drivers

- Entering an artwork is part of learning: the learner builds their own map of periods and styles.
- The top level of the timeline is the same for everyone and has a fixed order.
- Fewer rules in the form: one value where one value is enough.
- No data the learner entered is lost.

## Considered options

The top level:

1. Period stays free text; styles are linked to period values
2. A fixed list of eras on top; the current period field becomes a free "Okres" under it; style under the period

How far the dependency goes (with option 2):

1. Full chain: era unlocks period, period unlocks style
2. Only period depends on the era
3. No dependency; the era is only a fixed list

Number of periods per artwork: one, or several with the styles of all of them suggested together.

Era control: a vertical list of radio buttons, a 3×2 grid of tiles, or one row of tiles read as a timeline.

Where the hint for a locked field goes: inside the field, or under it.

## Decision outcome

Chosen: a fixed list of eras on top, a single period under it, and styles under the period, with the full chain.

- **Era** is a new field, a single choice from six fixed eras in this order, each with approximate years: prehistoria (do 3000 p.n.e.), starożytność (do 476), średniowiecze (476–1492), nowożytność (1492–1789), nowoczesność (1789–1945), współczesność (od 1945). The eras live in code and the database as a lookup list with codes and a position, like the artwork type; their names and years are app texts.
- **Okres** is the current period field, renamed and limited to one value. It stays the learner's own text.
- **Styl** stays a multi-value field of the learner's own text.
- **Chain.** Okres is locked until an era is chosen; Styl is locked until an Okres is chosen. A locked field says what to do inside the field: "Najpierw wybierz epokę." and "Najpierw wybierz okres.". Okres suggests only the periods already linked to the chosen era, and Styl only the styles already linked to the chosen period. Typing still allows a new value (R-9) and still matches existing values by name (R-25). Clearing or changing a level clears the levels below it.
- **One value, several parents.** A period or style with the same name is one value (R-8). When an artwork is saved, its Okres is linked to its era and each of its styles to its Okres, so the same style can belong to several periods and the suggestions for one period never show duplicates.
- **No starting lists.** The starting lists for period, style and material are removed (R-24 dropped); the learner builds every list. Managing these values in a separate view is a later idea (ATL-95).
- **Wall order.** "Według epok" groups the wall by era, in the fixed order of the list, instead of by the first period value. The period rail and strip keep their look; the bounds they show still come from the years of the artworks in each era. Artworks without an era are not shown in this order.
- **Era control.** One row of tiles read as a timeline, three by two on a phone; each tile has a Lucide icon centred above the name and the years under it, which never wrap: flame, landmark, church, compass, train-front, smartphone. The selected tile is filled like a primary button. It behaves as a radio group, keyboard included.

### Migration of existing data

| Current period value | Era | Okres |
| --- | --- | --- |
| prehistoria, with a second value such as paleolit or neolit | prehistoria | the second value |
| starożytność | starożytność | empty |
| średniowiecze | średniowiecze | empty |
| renesans, barok, oświecenie | nowożytność | the value |
| XIX wiek | nowoczesność | empty |
| modernizm | nowoczesność | the value |
| sztuka współczesna | współczesność | empty |
| any other value | from the artwork's year, by the years above; none without a year | the value |

Matching is case-insensitive. A value equal to an era name only sets the era. When an artwork has more than one period value, the first sets the era and the next one that is not an era name becomes the Okres. Every style of an artwork is linked to its Okres when it has one. An artwork with a style but no Okres keeps its style; in the edit form the locked Styl field shows it and lets the learner remove it.

### Consequences

- Good: the top of the timeline is fixed and ordered, so the wall order and future filtering (R-19) work on six known eras, and era names can be translated later.
- Good: suggestions shrink to what fits the chosen era and period, which supports learning instead of offering every value.
- Good: no duplicates in suggestions and no badges, because a value is one object with several parents.
- Bad: a schema change: a new lookup list, an era column on artworks, links between values, and a data migration on the shared databases.
- Bad: two different styles that share a name become one value; they can only be separated later in the management view.
- Bad: the eras follow European periodisation; art from elsewhere falls into them by date.
- Bad: the first artworks start with empty suggestions, since there are no starting lists.

## More information

- Design issue ATL-92; build issues ATL-93 (data, form, migration) and ATL-94 (wall order). Requirements R-44 to R-47.
- Mockups of the chosen options are kept with the project files under `epoka-okres-styl/`.
- The exact table layout for the links is left to ATL-93.
