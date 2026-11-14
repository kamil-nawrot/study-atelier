# 0294. Count the kinds of block of the editor for Kircher's ark

- Status: accepted
- Date: 2026-11-14

## Context and problem statement

The hidden exhibit "Arka Kirchera" (`kircher_ark`) is found by one exhibition with a block of every kind the editor offers, and the list grows with every new kind ([ADR-0292](0292-show-an-exhibition-with-every-kind-of-block-as-kircher-s-ark.md)). An exhibition is one JSON document: blocks stand at the top or in the columns of a row, and a set holds two to five close-ups or palettes ([ADR-0199](0199-tell-stories-in-exhibitions-of-the-learners-artworks.md)). The table `exhibition_artworks` lists the artworks of an exhibition but not the kind of their blocks. How does a set count, what of blocks whose artwork, term or symbol is gone, do exhibitions saved before the release count, and where does the list of kinds come from?

## Decision drivers

- A new kind of block must not be forgotten by the exhibit.
- Exhibits are counted from the learner's data and unlocked retroactively; a found hidden exhibit stays found ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)).
- "Kaplica Lenoira" already leaves out exhibitions and artworks in the trash ([ADR-0233](0233-count-the-current-eras-of-one-exhibition-for-lenoir-s-chapel.md)).

## Considered options

For a set: it counts as the kind of its items; it counts as a kind of its own.

For the list of kinds: a list of its own in the counting, with a test against the editor; the node types the database validator allows in a document (`private.exhibition_children()`), without the set and the row and with the palette added.

## Decision outcome

Chosen by the owner in ATL-753:

- A set counts as the kind of its items: a set of close-ups brings "Szczegół", a set of palettes "Paleta". The counting reads each item of a set, so an item whose artwork is in the trash does not count.
- A block of an artwork, a palette or a close-up counts only when its artwork is outside the trash. "Hasło" and "Symbol" count only while their term or symbol exists. "Tekst", "Nagłówek" and "Cytat" count only with text that is not blank; a heading inside a text is part of the text.
- Exhibitions saved before the release count.

The build takes the kinds from the validator, which meets the owner's rule that the exhibit cannot miss a new kind: every node type a document may hold at the top, without `set` and `columns`, plus the palette. A new kind of block needs the validator first, so it joins the condition at once. A database test lists today's types and fails when one is added, so whoever adds it decides whether it counts only with content.

The exhibit stands third in "Pawilon", after "Kaplica Lenoira", and gives the 50 points of a single-tier easter egg.

### Consequences

- Good: no kind of block can be added without the exhibit noticing.
- Good: the counting reads the document itself, so it sees blocks in rows and sets.
- Bad: every count of the career reads the documents of the learner's exhibitions; at up to 512 KB each, this stays small for one learner.
- Bad: a learner who found the exhibit keeps it when a new kind arrives, while a new learner needs the new kind too.

## More information

Built in ATL-753 in `20261114190000_kircher_ark_exhibit.sql`, with the test in `supabase/tests/exhibits.sql`.
