# 0349. Pick the values to keep in the comparison with an album version

- Status: accepted
- Date: 2026-11-27

## Context and problem statement

[ADR-0347](0347-offer-curated-albums-of-artworks-to-take-into-the-atelier.md) lets the learner take values from an album version into their own artwork in the comparison: every row whose values differ has a small text action under the album value ("← Przenieś", "← Uzupełnij", "← Zamień"), and a taken value shows on the learner's side with the old one struck through and "Wycofaj" under it. After the first use the owner found it hard to follow: the actions are small, they jump to the other column once clicked, and the learner cannot tell what the artwork will look like after saving ([ATL-872](https://linear.app/kamil-nawrot/issue/ATL-872)). [ADR-0348](0348-open-a-similar-album-artwork-as-a-comparison-while-adding.md) puts the same comparison into the walk of adding from an album, so it is used more often.

## Decision drivers

- The learner sees the result of the comparison at a glance, before saving.
- Large targets that stay where they are, also on a phone.
- One rule for the whole view.
- The learner's values change only where the learner chooses, except where the learner has nothing yet.

## Considered options

For the layout:

1. A third column "Po zapisaniu" with the result, and a switch "Moja / Z albumu / Oba" under the album value.
2. Both values of a row as large cells; a click picks the value to keep, which is highlighted with a check mark while the other is dimmed. Lists have a checkbox at every item.
3. One column with the artwork as it will be saved, and under each field "W albumie: …" with "Użyj z albumu" or "Cofnij".

For the state when the view opens: the learner's version everywhere; the learner's version, with the album's values in the learner's empty fields; the album version everywhere.

For the lists (authors, styles, materials, images): checkboxes at the album's items only, the learner's items always kept; or checkboxes at the items of both sides.

## Decision outcome

The owner chose each part on 2026-11-27 from mockups on the real view.

### Layout: pick a value by clicking it

- Option 2. A row of a single field (title, date, era, type, period, place) whose values differ shows both values as large cells, "Twoja wersja" on the left and "Wersja z albumu" on the right. The kept value has a `--color-highlight` border, a tint of it and a check mark in its corner; the other one is muted with an empty mark. A click on a cell picks it; nothing moves. A cell is a `button` with `aria-pressed`, named "Zachowaj: <value>".
- A list row has the library `Checkbox` at every item of both sides, inside a framed item that takes the `--color-highlight` border while ticked. An album item the learner already has stands without a checkbox. The artwork keeps exactly the ticked items, so the learner can untick an own author and tick the album's one in its place; unticking every author leaves the artwork with "Autor nieznany".
- The images work like a list: every own image and every album image the artwork does not have yet has a checkbox, within the limit of five images, the first ticked image becoming the main one. The album's description is one checkbox, "Dopisz na końcu notatki".
- A row whose values are the same shows the value once with "takie samo w obu wersjach". A row where only the learner has a value, and the own fields and the Wikidata row, show both values without a choice; an empty value reads "brak". Fields empty in both versions are left out.
- Above the rows, "Zaznacz, co ma trafić do Twojego dzieła." and a header line naming the two columns. In the save bar, in place of "Zmiany: 3", one or two lines say the result: "Z albumu weźmiesz: rok powstania, autora, 1 obraz" and "Usuniesz: Leonardo da Vinci", or "Nic się nie zmieni".
- The third column was rejected as heavy on a phone, and the single result column because it hides the album version the learner compares with.

### Starting state

- The learner's values are picked, except in the learner's empty fields and lists, where the album's value and items are picked from the start, and the album images are ticked for an artwork without images. Filling an empty field overwrites nothing and saves clicks; replacing a value stays the learner's choice.

### Consequences

- Good: the result is what is highlighted and ticked, and the bar says it in words.
- Good: the controls are large and stay in place, the same on a phone.
- Good: a wrong own author or style can be replaced in the same view.
- Bad: an own item or image can be removed by unticking it by mistake; the bar names it before saving.
- Bad: the view opens with changes when the learner has empty fields, so leaving it asks first.

This replaces the actions and the struck-through values of the comparison with an album version in [ADR-0347](0347-offer-curated-albums-of-artworks-to-take-into-the-atelier.md); the rest of it stands.

## More information

Requirement R-358 in [requirements](../product/requirements.md), issue [ATL-872](https://linear.app/kamil-nawrot/issue/ATL-872). The mockups and the texts table are in the project files under `porownanie/`.
