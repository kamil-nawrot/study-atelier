# 0089. One search button and the word "obraz" in the image field

- Status: accepted
- Date: 2026-10-20

## Context and problem statement

[ADR-0088](0088-up-to-five-images-and-an-automatic-best-match.md) fills the main image of a new artwork with the Wikidata candidate that matches an author, and gave the field "Wybierz inne" to step to the next matching candidate, with "Nie ma więcej pasujących zdjęć." after the last, next to "Pokaż wszystkie" for the dialog with every candidate. Built in ATL-137, stepping one by one repeats the dialog. Going through the texts of the image field also showed that they mixed "zdjęcie" and "obraz" for the same thing, spoke as "we" in some places and "I" in others, and said "Najwyżej 5 zdjęć." where the "+" slot already disappears.

## Decision drivers

- One way to pick another candidate.
- A short image field.
- One word for the artwork's image and one voice in its messages.

## Considered options

- Keep "Wybierz inne" next to the "Z Wikidata" line, or drop it and leave the dialog.
- Keep "zdjęcie" or switch to "obraz" for the image the learner adds, own or from Wikidata.

## Decision outcome

Chosen by the owner: drop the stepping, one search button, and "obraz".

- After a match the field shows "Z Wikidata: {tytuł} · {autor} · {data}" under the actions. "Wybierz inne", "Pokaż wszystkie" and "Nie ma więcej pasujących zdjęć." are gone: the search button reads "Wybierz inny" whenever the slot holds an image from Wikidata, matched or picked, and opens the dialog with every candidate. The rest of the automatic match in ADR-0088 stands.
- A failed search shows the search's own error message in the same line.
- The image the learner adds is "obraz", own or from Wikidata: "Znajdź obraz", "Dodaj kolejny obraz", "Usuń obraz", "Dodaj własny obraz", "Zastąpić obecny obraz?", "Twój obraz, widoczny tylko dla Ciebie.", "Brak obrazu", and the same word in the errors of an own image. The credit of a Commons photograph keeps "zdjęcie: {fotograf}", which names the photograph, not the artwork's image.
- "Najwyżej 5 zdjęć." is gone; the "+" slot disappearing at five says enough.
- Messages about a search speak in the first person singular: "Szukam w Wikidata…", "Szukam obrazu w Wikidata…", "Nie znalazłem w Wikidata dzieła o takim tytule…".

### Consequences

- Good: one control for another candidate, the dialog the learner already knows.
- Good: the field calls the image the same thing everywhere and speaks with one voice.
- Bad: when several versions of an artwork match (van Gogh's "Słoneczniki"), another one takes the dialog instead of one click.

## More information

- Supersedes the "Wybierz inne" and "Pokaż wszystkie" point and the "Najwyżej 5 zdjęć." text of [ADR-0088](0088-up-to-five-images-and-an-automatic-best-match.md). Issue: ATL-137.
