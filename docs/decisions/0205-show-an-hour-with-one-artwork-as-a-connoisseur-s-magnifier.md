# 0205. Show an hour with one artwork as a connoisseur's magnifier

- Status: accepted
- Date: 2026-11-06

## Context and problem statement

The owner wants a hidden single-tier exhibit of the display case for staying on the details of one artwork for at least an hour without a break, after the Stendhal syndrome (idea ATL-517), like "Paszcza prawdy" and "Nocny lichtarz" ([ADR-0187](0187-reward-a-sent-idea-with-a-hidden-exhibit.md), [ADR-0204](0204-show-the-light-theme-at-night-as-a-night-candlestick.md)). The app does not measure time spent on a view today, so the build needs a new mechanism. The look and the texts are designed first; the counting is built later in its own issue. Which object and engraving does it show, and how does it read?

## Decision drivers

- The engraving comes from a public-domain or CC0 source and is named after what it shows ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md)).
- A hidden exhibit keeps its secret until found, but its hint still points the way through the motif of its engraving (`voice-and-tone.md`).
- A curiosity of a hidden exhibit tells one story about the work itself, from one source that states every fact.
- The engraving shows one viewer absorbed in one work, which reads at 400 × 520.

## Considered options

For the object: Honoré Daumier's _Un véritable amateur_ (Les Bons Bourgeois no. 66, _Le Charivari_, 1847, Rijksmuseum RP-P-2015-26-183, Public Domain Mark), a man studying a painting through a magnifying glass; Johannes de Mare's steel engravings after Charles Rochussen of art viewing at Arti et Amicitiae (1851, Rijksmuseum), a crowded gallery.

For the crop of the Daumier: the whole vignette with both men; the amateur at full length with the second man on the left; a half-figure with the magnifier.

For the name: "Lupa znawcy"; "Lupa miłośnika sztuki"; "Szkło powiększające".

For the hint: "Kto patrzy z bliska, nie patrzy na zegarek."; "Prawdziwy znawca nie śpieszy się do następnej sali."; "Pod lupą jeden obraz starcza na długo.".

## Decision outcome

Chosen by the owner in ATL-526.

### Counting

- The exhibit is unlocked by staying on the details of one artwork for at least an hour without a break and without navigating anywhere. What counts as a break, where the time is measured and a deleted artwork are settled in the build's issue.

### Display case

- Object: a connoisseur's magnifying glass held close to a painting. The gallery of Arti et Amicitiae stays as a candidate; it reads as a room full of people rather than one viewer with one work.
- Engraving: Honoré Daumier, _Un véritable amateur_, a lithograph of the series _Les Bons Bourgeois_ (no. 66), published in _Le Charivari_ on 16 May 1847, Rijksmuseum RP-P-2015-26-183, marked with the Public Domain Mark on its [object page](https://www.rijksmuseum.nl/en/collection/RP-P-2015-26-183). It is not on Commons: `exhibit-art` takes the museum's image through `source_url`. The amateur at full length, moved left so the second man looking around the room stays in the frame, variant `daumier-amateur-figure` in `tools/exhibit-art/manifest.json`; the whole vignette and the half-figure stay as alternatives. The newspaper text shows through the paper, as on every print of _Le Charivari_.
- The title is given in Polish as „Prawdziwy znawca”: "amator" reads in Polish as a dabbler, not as a lover of art.
- Credit: Honoré Daumier, „Prawdziwy znawca”, 1847.
- Exhibit code: `amateur_magnifier`.
- Name "Lupa znawcy", an object and whose it is.
- The story of the object: "Honoré Daumier narysował w 1847 roku dla „Le Charivari” znawcę, który ogląda obraz przez lupę, podczas gdy jego towarzysz rozgląda się po sali."
- The hint while hidden: "Kto patrzy z bliska, nie patrzy na zegarek."
- What it was awarded for: "Za godzinę spędzoną z jednym dziełem."
- The curiosity of its tier:

| Tier | Curiosity                                                                                                                                                                                                                                                                                    | Source                                                               |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1    | Daumier wracał do paryskich znawców sztuki i kilkanaście lat później: w serii akwarel pokazał kolekcjonerów, którzy z bliska studiują dzieła. Akwarele robił głównie dla kolekcjonerów swoich prac, więc te obrazki trafiały, nieco ironicznie, do tych samych ludzi, których przedstawiały. | [Cleveland Museum of Art](https://www.clevelandart.org/art/1927.208) |

### Consequences

- Good: the magnifier and the man bent over the canvas read at once as looking long and closely, the idea of the exhibit.
- Good: the second man looking around the room gives the contrast the hint and the award lean on.
- Bad: the exhibit needs a new measure of time spent on the details of an artwork before it can be counted.
- Bad: the newspaper text showing through the paper stays visible in the engraving.

## More information

Designed in ATL-526 from the idea ATL-517; the build, with the counting, is ATL-553. The WebP images go to `apps/web/static/exhibits/amateur_magnifier/` with `exhibit-art publish --only amateur_magnifier` once the exhibit exists in the app and the database. While designing it, `exhibit-art` started naming a museum's source file after its object page, since the Rijksmuseum's image addresses all end in `default.jpg`.
