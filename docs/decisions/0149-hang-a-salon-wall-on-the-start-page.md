# 0149. Hang a salon wall on the start page

- Status: accepted
- Date: 2026-10-28

## Context and problem statement

The start page of [ADR-0144](0144-describe-the-app-on-a-public-start-page.md) showed one artwork beside a block of text and a grid of six module descriptions with icons. The owner found it sad and dull. What should the page look like to be livelier while keeping the owner's texts?

## Decision drivers

- The first screen shows at once that the app is about art and collecting it.
- The owner's title, description and module texts stay as they are.
- Only images that need no credit, so the page carries no list of authors and licences.
- One breakpoint and semantic tokens, as everywhere else.

## Considered options

- A: a salon wall of framed artworks behind the title, module cards with an artwork each, and a closing band
- B: a preview of the app beside the title and a row per module with a small illustration of it
- C: a large title over a strip of artworks along the eras, and a numbered list of modules

The options were compared on mockups with real images from Wikimedia Commons.

## Decision outcome

Chosen by the owner: A.

- The first screen is a wall of 28 framed public domain paintings from the sign-in artworks, shuffled on every visit (20 on a phone), behind a dark ellipse with the title "Atelier do nauki _historii sztuki_", the description and "Załóż konto". The wall is decoration, hidden from screen readers.
- "Co znajdziesz w atelier" shows six cards: a public domain artwork chosen for the module, a top border in a lane colour, the title and the owner's text.
- The page ends with a band in the highlight colour: "Chcesz zbudować własną kolekcję sztuki?", "Otwórz atelier już teraz i daj swojej wiedzy o sztuce miejsce, w którym będzie mogła rosnąć." (written with the owner) and "Załóż konto".

### Consequences

- Good: the page shows dozens of artworks instead of one and says more at a glance.
- Bad: a visit loads 34 Commons thumbnails, cached by the browser and by Commons; the module images load lazily.

## More information

- Issue ATL-361. Replaces the layout of the start page described in ADR-0144; its content and share tags stay.
