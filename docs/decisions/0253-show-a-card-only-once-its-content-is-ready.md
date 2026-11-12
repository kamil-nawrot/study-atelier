# 0253. Show a card only once its content is ready

- Status: accepted
- Date: 2026-11-11

## Context and problem statement

The card of a glossary term in notes, and the card of a pin with a glossary entry, load the definition of their term the first time they open. The card opened at once with "Wczytuję definicję…" in the space of about three lines and was placed again when the definition arrived, so it sometimes jumped for a moment, for example from below the term to above it, before it settled. A definition already in the data cache still showed the loading text for one frame. The owner asked that a card show only in its final form and place, with the loading state only when the data does not arrive quickly ([ATL-666](https://linear.app/kamil-nawrot/issue/ATL-666)).

## Decision drivers

- A card appears once, in its place, with its content.
- A slow network still gets a sign that something is happening.
- Any content of a card may need it, not only the glossary definition.

## Considered options

- Hold the card hidden while its content loads, up to half a second, then show the loading state.
- Keep the loading state and only reserve more room for the definition.
- Load the definition when the pointer enters the term, during the hover delay.

## Decision outcome

Chosen option: "hold the card hidden", because it removes the jump for any content and keeps the loading state for a slow answer.

- `PopoverState` counts holds. Content inside a `PopoverCard` asks for a hold through `popoverHold()` (a Svelte context the card provides) while it loads and releases it when its data arrives or it goes away. A held card stays hidden and is placed only once it is ready.
- A card waits at most 500 ms. After that it shows with its loading state and is placed again when the content arrives, as before. The 500 ms is arbitrary, the lower end of the half a second to a second the owner named.
- The glossary term card holds its card while it loads the definition. The hover delay of 320 ms comes first, so a definition that arrives quickly shows about 320 ms plus the time of the request after the pointer stops on the term.
- Content outside a `PopoverCard`, such as the glossary entry block of an exhibition, has no hold and shows the loading text as before.

### Consequences

- Good: a card with quickly loaded content no longer moves or changes its size after it appears.
- Good: other content of a card (an image, a list) can use the same hold later.
- Bad: on a slow answer the card appears up to 500 ms later than before, and then still moves once.

## More information

Loading the definition during the hover delay could shorten the wait further; it was left out for now, so a pointer passing over a note fetches no definition nobody reads.
