# 0209. Read the letter of a glossary entry as its index does

- Status: accepted
- Date: 2026-11-07

## Context and problem statement

The hidden exhibit "Alfabet Mistrza E.S." (`figure_alphabet`) is unlocked by glossary entries on all 23 letters of the Polish alphabet without diacritics, A–Z without Q, V and X ([ADR-0201](0201-show-a-glossary-from-a-to-z-as-the-alphabet-of-master-es.md)). The glossary index groups an entry under the first character of its sort name, or of its name when it has none. Names can start with quotation marks, digits or letters with diacritics. How is the letter read and where does the exhibit stand?

## Decision drivers

- Exhibits are counted from the learner's data and unlocked retroactively; an unlocked tier stays unlocked ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)).
- The rule should match what the learner sees elsewhere in the app, so that the exhibit is found where it is earned.

## Considered options

For the letter: the first character of the sort name or the name, as the index; the same, skipping leading characters that are neither letters nor digits; the first letter of the name only.

For the place: at the end of the display case, after "Siedmiomilowe buty"; next to "Biblioteka w Lejdzie".

## Decision outcome

Chosen by the owner in ATL-550.

- `figure_alphabet` counts the letters of A–Z without Q, V and X that begin a glossary entry. It has one tier, at 23, and gives 50 points once as an easter egg.
- The letter is the first one of the sort name, or of the name without one, as in the glossary index ("Kazimierz Michałowski" sorted as "Michałowski" gives M). Leading characters that are neither letters nor digits are skipped, so "„Ostatnia Wieczerza”" gives O, where the index shows it under „. An entry starting with a digit gives no letter.
- A letter with a diacritic counts as its base letter (Ś as S, Ł as L, É as E). Q, V and X count for no letter and do not hurt.
- Entries before the release count, and deleting an entry later takes nothing back.
- It stands at the end of the display case, after "Siedmiomilowe buty". The place only orders the case and is not stored.
- The career is refreshed on the next view change after the save, which already marks it as stale; no extra refresh is needed.

### Consequences

- Good: the exhibit agrees with the letters the learner sees in the glossary index.
- Bad: a name in another script, such as Greek, is read from its first Latin letter or digit, if any.

## More information

Built in ATL-550 together with the four other exhibits of 0.21 in one migration, `20261107090000_five_exhibits_of_0_21.sql`, since each exhibit migration replaces `private.exhibit_values` and `private.unlock_exhibits_for` as a whole.
