# 0153. Add glossary definitions to the review as extra questions

- Status: accepted
- Date: 2026-10-28

## Context and problem statement

The glossary ("Słowniczek") holds terms with definitions ([ADR-0074](0074-keep-a-glossary-of-terms-with-definitions-from-wikipedia.md)), but the review practises only artworks, and a term only when it is pinned to an artwork ([ADR-0109](0109-pin-details-on-the-artwork-image.md)). The owner wants to practise definitions too, without turning the review of artworks into a review of terms: a learner with more terms than artworks would otherwise spend most of a day's review on definitions. How should definitions join the review, and how is the answer kept out of a definition that names its own term?

## Decision drivers

- Artworks stay the base of the review; definitions are extra.
- A definition must not give its term away.
- No new schedule to keep and explain.

## Considered options

- Definitions with their own schedule, like artworks
- A few random definitions woven into every session, without a schedule

## Decision outcome

Chosen by the owner: a few random definitions woven into the session as extra questions ("pytania dodatkowe"), without a schedule.

- A definition question shows the definition where the image of an artwork is, with the label "Pytanie dodatkowe ze Słowniczka" and the question "Jakie pojęcie opisuje ta definicja?", and four terms to choose from: the right one and three others, from the same category first. After the answer the card says "Tak, to …" or "Nie, to …".
- Every match of the term, its synonyms and its word forms in the definition is replaced by a gap of a fixed width with the background of a glossary term in the notes, so its length does not hint at the word. The matcher is the one that marks glossary terms in notes (`maskedSegments` in `@study-atelier/ui`). After the answer the hidden words are shown. Related words that are not among the forms, and names of the wrong answers in the definition, are not hidden.
- The settings ask "Ile pytań dodatkowych ze Słowniczka dołączać do sesji?" with 1, 2 or 3 (default 1). The options of the review start have the switch "Dołącz definicje ze Słowniczka", on at every start, with the hint "Pytania dodatkowe: 2 losowe definicje. Nie zmieniają planu powtórek."
- The definitions are drawn from the whole glossary whatever the scope, in every form and in the free review, and are put at random places of the session but never first. They count in the progress of the session.
- Answers to definitions are not saved and change no schedule; a wrong one comes back later in the same session ("Wrócimy do niej za chwilę."), like an artwork. The summary counts only artworks.
- The switch and the questions appear only when at least four different terms have a definition.

### Consequences

- Good: definitions are practised every day without a second plan of reviews.
- Good: the session is built as before; definitions are added in the app from the glossary the review page already loads.
- Bad: nothing is remembered about how well a definition is known, so a well-known one comes back as often as a forgotten one.

## More information

- Issue ATL-363.
