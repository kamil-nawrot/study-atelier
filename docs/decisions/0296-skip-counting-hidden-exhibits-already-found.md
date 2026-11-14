# 0296. Skip counting hidden exhibits already found

- Status: accepted
- Date: 2026-11-14

## Context and problem statement

`unlock_exhibits` runs `private.exhibit_values` on every start of the app and after writes, and it counts every exhibit each time, also hidden exhibits the learner found long ago. Some counts read a lot: "Arka Kirchera" reads every exhibition document of the learner ([ADR-0294](0294-count-the-kinds-of-block-of-the-editor-for-kircher-s-ark.md)), "Pinakoteka motyli" every pin on an artwork outside the trash. A found hidden exhibit shows only its "awarded" text, never a counter, and the app keeps it found from `exhibit_tiers` (`reachedTier()` takes the higher of the stored and the counted tier). Must its value still be counted?

## Decision drivers

- The count runs for every learner on every start, so its cost grows with the learner's data.
- The display case and the bonus of 50 points must not change.

## Considered options

- Count every exhibit every time, as before.
- Return the threshold of a hidden exhibit the learner has already found, without counting it.
- Keep the kinds of block of each exhibition in a table filled on save, so the count of "Arka Kirchera" no longer reads documents.

## Decision outcome

Chosen by the owner in ATL-756: `private.exhibit_values` returns the first threshold of a hidden exhibit with a row in `exhibit_tiers` for the learner, and counts it only while it is not found. Each hidden value is a `coalesce` of the found threshold and its count; Postgres runs the count, with the common table expressions only it uses, only when the threshold is missing. Exhibits with tiers keep being counted, since their counter is shown. The table of block kinds is left for later, should the count of a learner who has not found the ark yet become slow.

### Consequences

- Good: a found hidden exhibit costs one lookup, so a learner who found "Arka Kirchera" no longer reads exhibition documents on every count.
- Good: nothing the learner sees changes.
- Bad: `unlock_exhibits` returns the threshold, not the real value, of a found hidden exhibit; a reader of that value must not take it for a count.
- Bad: a new hidden exhibit must wrap its value the same way to get the saving.

## More information

Built in ATL-756 in `20261114210000_skip_found_hidden_exhibits.sql`.
