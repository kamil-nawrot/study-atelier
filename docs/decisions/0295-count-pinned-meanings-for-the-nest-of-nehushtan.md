# 0295. Count pinned meanings for the nest of Nehushtan

- Status: accepted
- Date: 2026-11-14

## Context and problem statement

The hidden exhibit "Gniazdo Nechusztana" (`pelican_serpent`) is found by two different symbols with the same meaning, each shown with it on a detail of its own artwork outside the trash ([ADR-0293](0293-show-two-symbols-with-the-same-meaning-as-the-nest-of-nehushtan.md)). A meaning is a free text of up to 200 characters, trimmed at its ends, and a pin points at a symbol and optionally at one of its meanings ([ADR-0257](0257-keep-symbols-with-meanings-in-context-as-a-tab-of-the-glossary.md)). How are spaces inside a meaning compared, which meaning does a pin without a chosen one show, and do pairs saved before the release count?

## Decision drivers

- A meaning only copied to a new symbol while a mistake is fixed must not find the exhibit.
- Exhibits are counted from the learner's data and unlocked retroactively; a found hidden exhibit stays found ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)).

## Considered options

For spaces: only the ends, which the database already trims; the ends and runs of spaces inside the text, counted as one.

For a pin without a chosen meaning of a symbol with several: it shows none of them; it shows every one of them.

For data before the release: it counts; only pins added after the release count.

## Decision outcome

Chosen by the owner in ATL-755:

- Two meanings are the same when their texts are equal after lowering the case and counting every run of spaces as one. Polish letters and punctuation stay as written, so "czystość." and "czystość" differ.
- A pin shows the meaning chosen for it, or, when none is chosen, the only meaning of its symbol. A pin of a symbol with two or more meanings and none chosen shows none.
- Pairs saved before the release count.

The exhibit stands last in "Skryptorium", after "Alfabet Mistrza E.S.", and gives the 50 points of a single-tier easter egg.

### Consequences

- Good: a pin that does not say which meaning it shows cannot find the exhibit by chance.
- Bad: a learner who later chooses a meaning on an old pin may find the exhibit long after pinning the details.
- Bad: removing a meaning or merging symbols may break a pair; the found exhibit stays.

## More information

Built in ATL-755 in `20261114200000_pelican_serpent_exhibit.sql`, with the test in `supabase/tests/exhibits.sql`.
