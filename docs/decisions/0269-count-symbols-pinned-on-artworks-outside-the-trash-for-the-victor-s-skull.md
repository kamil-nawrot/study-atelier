# 0269. Count symbols pinned on artworks outside the trash for the victor's skull

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

The tiered exhibit "Czaszka zwycięzcy" (`laurel_skull`) counts the symbols of the glossary shown on artworks, with tiers at 1, 5, 10, 25, 50 and 100 ([ADR-0262](0262-show-symbols-as-the-victor-s-skull.md)). A symbol is shown on an artwork by a pin of one of its images (`artwork_pins.symbol_id`, [ADR-0257](0257-keep-symbols-with-meanings-in-context-as-a-tab-of-the-glossary.md)). Does a pin on an artwork in the trash count, and does a symbol pinned many times count more than once?

## Decision drivers

- Exhibits are counted from the learner's data and unlocked retroactively; an unlocked tier stays unlocked ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)).
- Every other exhibit leaves out artworks in the trash ([ADR-0235](0235-count-artwork-types-outside-the-trash-for-the-boncompagni-academy.md)).

## Considered options

For the trash: only pins on artworks outside the trash count; every pin counts.

For a symbol pinned many times: once; once per pin.

## Decision outcome

Chosen by the owner in ATL-692.

- A symbol counts once when at least one pin of an artwork outside the trash carries it, as in every other exhibit. A pin on an image without a loupe view counts too.
- The exhibit stands second in "Skryptorium", after "Biblioteka w Lejdzie"; "Praski orloj", "Ogród Clifforta" and "Alfabet Mistrza E.S." move one place down ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md)).

### Consequences

- Good: the counter says how many symbols the learner has found on artworks, which is the work the atlas of symbols asks for.
- Bad: moving the only artwork with a symbol to the trash, or removing its pin, lowers the counter; a reached tier stays.

## More information

Built in ATL-692 in `20261112210000_laurel_skull_exhibit.sql`. Symbols exist only since 0.23, so there is no data from before the release; the pin field for a symbol comes with ATL-678.
