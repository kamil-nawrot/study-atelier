# 0348. Open a similar album artwork as a comparison while adding from an album

- Status: accepted
- Date: 2026-11-27

## Context and problem statement

[ADR-0347](0347-offer-curated-albums-of-artworks-to-take-into-the-atelier.md) marks an album artwork whose title matches an artwork of the atelier as similar, and says the mark "decides nothing": the tile stays ticked. After the first use of the albums the owner found the gap this leaves. Unless the learner opens the comparison from the tile first, going through the add forms adds the artwork again as a new one, most likely a duplicate ([ATL-871](https://linear.app/kamil-nawrot/issue/ATL-871)).

## Decision drivers

- An artwork the learner already has should not come in twice by accident.
- A title alone is a weak match ("Autoportret", "Madonna z Dzieciątkiem"), so the learner must be able to add the album artwork as a new one.
- No extra step for the artworks that are not similar.

## Considered options

1. In the walk, a similar artwork opens as the comparison with the learner's artwork, with a way out to the add form.
2. A similar artwork starts unticked in the gallery; the walk does not change.
3. Before each similar artwork the walk asks first: complete the learner's artwork, add as new, or skip.

## Decision outcome

Chosen by the owner: option 1, because it prevents the duplicate without a question before every similar artwork, and the way out covers a match by title only.

- The walk loads the atelier's matches once. For an artwork marked similar it opens the comparison of [ADR-0347](0347-offer-curated-albums-of-artworks-to-take-into-the-atelier.md) in place of the add form, under the same strip of thumbnails, with a note under the images that names the learner's artwork.
- The save bar of the comparison has "Zakończ", "Pomiń", "To inne dzieło, dodaj jako nowe" and the save button of the walk ("Zapisz i przejdź dalej", "Zapisz i zakończ"). Saving takes the chosen changes, links the learner's artwork to the album entry, even without other changes, and goes to the next artwork.
- "To inne dzieło, dodaj jako nowe" switches to the usual add form for that artwork.
- A completed artwork counts apart from the added ones: the strip says "uzupełnione" and the last message says how many were completed; it counts as taken for the closing step, so its related items start ticked.
- The gallery does not change: a similar artwork still starts ticked, with its badge and the comparison link.

This replaces the part of [ADR-0347](0347-offer-curated-albums-of-artworks-to-take-into-the-atelier.md) where a similar title "decides nothing"; the rest of it stands.

### Consequences

- Good: a similar artwork no longer comes in twice by accident, and completing the learner's artwork happens in the same walk.
- Good: the comparison standing alone does not change; only inside the walk can it save a link without other changes.
- Bad: the walk loads the learner's artwork for each similar entry, one more request per such artwork.
