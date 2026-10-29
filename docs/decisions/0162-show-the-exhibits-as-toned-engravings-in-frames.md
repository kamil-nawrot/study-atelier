# 0162. Show the exhibits as toned engravings in frames

- Status: accepted
- Date: 2026-10-29

## Context and problem statement

[ADR-0160](0160-gamify-learning-as-a-museum-career.md) drew each exhibit as the lines of an engraving painted by a CSS filter in a metal (iron, bronze, silver, gold, gold with glow) on a growing setting. In the app the lines looked thin and dense plates turned into flat patches, and the owner prepared toned engravings for every metal instead. How does the display case show them, and what changes with them?

## Decision drivers

- The images come ready: one per metal, 400 × 520 px (10:13), cropped and toned by the owner.
- Each tier should look richer than the one before, and nothing on the page should move when the learner opens something.
- A locked exhibit should not give away what it shows.

## Considered options

- Keep painting the lines with a CSS filter
- Show the toned engravings in a frame that changes with the metal

## Decision outcome

Chosen by the owner: the toned engravings in a frame.

- Metals: none (no tier), bronze, silver, gold and platinum at the top tier; the tiers below the top spread over bronze, silver and gold. Images are served as WebP from `static/exhibits/<exhibit>/<metal>.webp`, one per exhibit loaded at a time.
- The frame grows with the metal (a thin dark rim, bronze, silver, a gilded and a platinum frame), and a CSS light from above inside the frame gets stronger with it. An exhibit without a tier shows its image strongly blurred.
- The description holds only the extra story and the curiosities, behind a quiet `StageButton` in the corner (the style of the loupe and pins buttons, now a library component); what an exhibit counts is in its counter under the bar ("191 z 250 dzieł w atelier", "… · najwyższy poziom" at the top), and a found hidden exhibit says what it was awarded for.
- "Mona Lisa po powrocie" becomes a third hidden single-tier exhibit worth 50 points once; stored higher tiers are removed.
- The objects follow the images: Świątynia della Tosse, Święty Hieronim w pracowni, Globus podróżnika, Teleskop Mathieu Laensbergha, Biblioteka w Lejdzie, Camera obscura z Encyklopedii and Puchar Nemezis.

### Consequences

- Good: the images look like toned prints and every exhibit reads the same way.
- Good: no SVG filters and no line threshold to tune.
- Bad: about 2 MB of WebP images in the app; a new object needs five prepared images.
- Bad: "Przewodnik Baedekera" has no image yet and shows an empty frame.

## More information

ATL-389. Supersedes the look of the exhibits in ADR-0160; the rest of ADR-0160 stands. Source images and their licences: `design/exhibits/sources.json`.
