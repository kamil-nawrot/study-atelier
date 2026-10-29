# 0123. Switch the automatic fetching from external sources

- Status: accepted
- Date: 2026-10-23

## Context and problem statement

Four forms fetch from Wikimedia projects without being asked: the image of a new artwork from Wikidata and Commons ([ADR-0088](0088-up-to-five-images-and-an-automatic-best-match.md)), the definition of a glossary term from Wikipedia ([ADR-0074](0074-keep-a-glossary-of-terms-with-definitions-from-wikipedia.md)), its forms from Wiktionary ([ADR-0079](0079-connect-the-lexicon-and-suggest-forms-from-wiktionary.md), [ADR-0086](0086-fetch-the-forms-of-synonyms-from-wiktionary.md)) and the description and dates of a timeline event from Wikipedia. The owner wants to switch each of them off.

## Considered options

- One switch for all sources, or one per source
- Stored per device, or on the account with the other preferences ([ADR-0118](0118-preferences-for-the-reviews-and-the-artwork-view.md))

## Decision outcome

Chosen by the owner: one switch per source, stored in `profiles` (`fetch_image`, `fetch_definition`, `fetch_forms`, `fetch_event`, all on by default) and set in a settings tab "Źródła".

- A switch off stops only the fetch that starts by itself while the learner types. The same fetch stays available on request: "Szukaj w Wikipedii" under the definition and under the description of an event, "Pobierz z Wikisłownika" over the forms, and the image search dialog.
- The app reads the switches from a small store filled by the layout load, so a save applies at once on the next form.
- The Commons thumbnails on the wall and the small copies of own images are not switchable: they are part of showing the atelier, not a suggestion.

### Consequences

- Good: a learner who wants no request to Wikimedia while typing gets it, on every device.
- Bad: the forms have a second path to the same fetch and each needs a test for both states.

## More information

- Issue ATL-295.
