# 0150. Lock the fields an external fetch fills

- Status: accepted
- Date: 2026-10-28

## Context and problem statement

Forms fetch data from Wikipedia, Wikidata, Wiktionary and Commons: a glossary definition and its inflected forms, an event's dates and description, the main image of a new artwork. Each showed it in its own way (a placeholder, a line in a frame, a caption, nothing at all for events, [ADR-0096](0096-suggest-an-events-dates-and-description-from-wikipedia.md)), the fields stayed editable, and two places could overwrite what the learner typed or attach an image found for a title the learner had already changed. A request could wait 30 seconds and a search chains several requests, and an image from an address never gave up. How does a form show a fetch, and what may the learner do meanwhile?

## Decision drivers

- One pattern for every form that fills fields from an external source.
- The learner's typing is never overwritten and never lost.
- A slow or failing source never holds the form for long.

## Considered options

- Saving stays possible during a fetch and drops its result
- Saving is disabled during a fetch
- Saving waits for the fetch to end

## Decision outcome

Chosen by the owner: the fields a fetch may fill are locked and primed, and saving is disabled until the fetch ends or the learner stops it.

- Only the fields the result may fill are locked: empty ones and ones still holding fetched values. A field the learner wrote stays open. The fields that drive the search (name, title, authors) stay open; changing them drops the running fetch and starts a new one after the pause.
- A locked field is disabled, `aria-busy` and primed with the `Primer` strokes after the loading delay (`filling` on `TextField`, `TextArea` and `ValueField`); the empty main image slot is primed and its buttons are disabled.
- Under the locked fields `FillingStatus` says what is fetched ("Wyszukiwanie w Wikipedii…") with "Przerwij". Stopping unlocks the fields; the automatic fetch does not start again until the name changes. The search dialogs prime their result area and show the same line without "Przerwij", since closing them stops the search.
- The event form shows the fetch like the others, and after a failure says so under "Opis" with "Szukaj jeszcze raz"; finding nothing stays quiet. This replaces the quiet search of ADR-0096; the rest of it stands.
- A request to Wikimedia gives up after 10 seconds (15 for the Wikidata query service), a whole search after 20 seconds, and an image from an address after 15 seconds.

### Consequences

- Good: the same look and the same rules in every form; nothing the learner types is lost.
- Good: a fetch holds the form for at most 20 seconds, and "Przerwij" ends it at once.
- Bad: saving waits for a fetch the learner does not care about until it ends or is stopped.

## More information

- Issue ATL-364.
