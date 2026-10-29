# 0160. Gamify learning as a museum career

- Status: accepted
- Date: 2026-10-29

## Context and problem statement

The owner wants points, ranks and achievements for reviews and for the rest of the app, to support engagement. Rewards can harm learning: a point for a correct flashcard answer tips a doubtful "Umiem", points for the number of reviews push towards free rounds, and an outside reward can replace the wish to know. Which rewards, how they are counted, how they look and where they live, so that they stay a pleasant extra?

## Decision drivers

- Gamification never covers up learning: nothing interrupts a review, no dialogs.
- Rewards follow work and knowledge the learner cannot fake by habit: the schedule decides what is settled.
- Deleting or tidying the atelier is never punished.
- The gallery and museum mood of the app, immersive rather than game-like.
- Learners have no interest in cheating, since nothing but a badge is won, so no anti-abuse machinery.
- No leaderboards now, but nothing that closes the way to rankings, summaries and statistics later.
- Running costs stay at zero.

## Considered options

- Ranks: from review points only; from settled artworks only; from points of work and knowledge together.
- Metaphor: a painters' guild (apprentice, journeyman, master); a career in the museum world; a growing museum of one's own.
- Points of deleted items: counted from what exists now; kept forever in a ledger.
- Tiers of an exhibit: medals; a museum label with a Roman numeral; a frame that gets richer; a display case with an object from an engraving.
- Material of the tiers: metals; historical pigments (sepia, ochre, vermilion, malachite, ultramarine, gold leaf).

## Decision outcome

Chosen by the owner, in the spike ATL-381.

**Points.** A ledger stores the learner's events with their facts; points are computed from the events with weights when they are read, so the history can always be recomputed and a weight changed later applies to everyone. Events never change when the collection changes.

| Event                                                       | Points                                                                              |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| A day with the scheduled plan done                          | 10 × the share of the plan done, times the streak bonus; none on a day with no plan |
| Streak bonus                                                | +5% for each further day of the streak, at most +50% from the 11th day              |
| An artwork settled for the first time (FSRS stability ≥ 7)  | 20; forgetting it does not take them back                                           |
| Adding an artwork, a glossary definition, an event, a visit | 2                                                                                   |
| A single-tier easter egg                                    | 50                                                                                  |

The share of the plan, not its size, counts, so a plan of 5 and one of 50 give the same. A free round gives nothing. Deleting an item keeps its events; moving it to the trash and back is the same item. On release the ledger is filled from existing data, counting a day with reviews as a full plan and the artworks settled now. The export carries the ledger; the import restores it only into an account without points. Glossary definitions have no schedule of their own and give no settling points.

**Ranks.** A career in the museum world, from the amateur to the professional ladder of museum staff, from the sum of points; a rank never goes down unless a weight is lowered, so weights are only raised. Thresholds were checked on the owner's data (about 250 points a day while building the atelier): a very active learner reaches the top in about nine months, a calm one (about 7000 points a year) reaches Kustosz in about a year. Ranks above the top (honorary titles) are added when someone gets close.

| Rank              | From | Rank            | From  |
| ----------------- | ---- | --------------- | ----- |
| Zwiedzający       | 0    | Adiunkt         | 4000  |
| Bywalec           | 50   | Kustosz         | 7500  |
| Miłośnik sztuki   | 200  | Starszy kustosz | 13000 |
| Kolekcjoner       | 500  | Główny kurator  | 22000 |
| Znawca            | 1000 | Wicedyrektor    | 40000 |
| Asystent muzealny | 2000 | Dyrektor muzeum | 70000 |

The guild was dropped because the learner studies art rather than makes it.

**Exhibits.** One exhibit per achievement, with as many tiers as make sense, counted from the learner's data and unlocked retroactively: Kolekcja (artworks), Przekrój epok (eras), Pamięć (settled artworks), Stały bywalec (the longest streak), Powrót z magazynu (artworks forgotten and settled again), Kronika (places visited), Grand Tour (countries), Na żywo (artworks seen in person), Kalendarium (events), Słowniczek (definitions) and Własnym okiem (own photos), plus the single-tier easter eggs Nocny stróż and Maraton. An unlocked tier is stored with its dates and stays unlocked forever. A tier gives no points, since the work behind it already did; an easter egg does.

**Look.** A display case per exhibit holds an object from a public-domain or CC0 engraving (CC BY with collective credits marked as recoloured), drawn as a gold line, spot-lit. With each tier the object changes metal (iron, bronze, silver, gold, gold with glow; every few tiers on a long exhibit) and the case's setting gets richer (velvet, a brass plaque, a second light, a gilded frame and more); a row of lamps shows the tiers and an exhibit without a tier stands in the dark. Pigments were mocked up and rejected in favour of metals. A tier can reveal a curiosity on the exhibit's theme, each with a checked source and approved by the owner; the mechanism ships first and the content grows over later versions.

**Place.** The display case is a view of its own in the side menu; the rank sits under the avatar with a bar to the next rank. A new tier makes the case's menu icon flash and a new rank makes the avatar flash, with a lasting mark until the case is opened (stored in the database, so it is the same on every device); reduced motion shows only the mark. The summary of a review round adds a line about the day's plan and anything unlocked. Nothing is added to the save toasts. An option in the settings hides it all.

### Consequences

- Good: the rank follows knowledge first (settling is worth ten times adding), and regularity counts without pushing towards extra rounds.
- Good: the ledger and the stored tiers survive any tidying of the atelier and allow statistics and rankings later.
- Good: one engraving per exhibit and CSS for metals and settings, no image per tier.
- Bad: two new tables written on many saves, with a cheap check after a save; when it cannot be cheap, a flash waits for the next page.
- Bad: the backfill is approximate (past plan sizes and past settling are not stored).
- Bad: curated engravings and curiosities are hand work; rank names need a feminine and a masculine form.

## More information

- Spike ATL-381 with every decision in its comments; built in ATL-382 (points and ranks), ATL-383 (the streak on a day with nothing to review, a change to [ADR-0078](0078-show-a-streak-of-days-with-reviews-on-the-review-start.md)), ATL-384 (exhibits), ATL-385 (the display case), ATL-386 (the rank, the flashes and the switch) and ATL-387 (curiosities).
- The privacy policy gets the points and achievements, and the ledger gets an account limit like the other tables ([ADR-0133](0133-limit-the-storage-and-the-rows-of-one-account.md)).
