# 0089. No stepping through the matches in the image field

- Status: accepted
- Date: 2026-10-20

## Context and problem statement

[ADR-0088](0088-up-to-five-images-and-an-automatic-best-match.md) fills the main image of a new artwork with the Wikidata candidate that matches an author, and gave the field "Wybierz inne" to step to the next matching candidate, with "Nie ma więcej pasujących zdjęć." after the last. Built in ATL-137, the search button already offers every candidate in a dialog ("Pokaż wszystkie"), so stepping one by one repeats it. Should the field keep "Wybierz inne"?

## Decision drivers

- One way to pick another candidate.
- A short image field.

## Considered options

- Keep "Wybierz inne" next to the "Z Wikidata" line.
- Drop it: when the match is not the right one, "Pokaż wszystkie" opens the dialog with every candidate.

## Decision outcome

Chosen by the owner: drop it.

- After a match the field shows only "Z Wikidata: {tytuł} · {autor} · {data}" under the actions, and the search button reads "Pokaż wszystkie" while the matched image is shown.
- "Wybierz inne" and "Nie ma więcej pasujących zdjęć." are gone; the rest of the automatic match in ADR-0088 stands.
- A failed search shows the search's own error message in the same line.

### Consequences

- Good: one control for another candidate, the dialog the learner already knows.
- Bad: when several versions of an artwork match (van Gogh's "Słoneczniki"), another one takes the dialog instead of one click.

## More information

- Supersedes the "Wybierz inne" point of [ADR-0088](0088-up-to-five-images-and-an-automatic-best-match.md). Issue: ATL-137.
