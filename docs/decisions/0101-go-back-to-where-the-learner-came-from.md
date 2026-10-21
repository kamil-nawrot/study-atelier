# 0101. Go back to where the learner came from

- Status: accepted
- Date: 2026-10-21

## Context and problem statement

The app grew from a collection wall with views around it into several equal modules, all in the menu: Atelier (the wall), Kartoteka, Słowniczek, Kalendarium, Powtórki and Kosz. Every module still starts its top bar with "← Atelier", which always leads to the wall. Detail pages go back in different ways:

- an artwork goes back through history only when it was opened from the wall;
- a value always links to Kartoteka;
- a glossary entry goes back through history when it was opened from the list (ATL-243).

So the arrow often leads somewhere the learner did not come from, and lists open at the top without their filters. The spike ATL-244 walked through these scenarios on a phone and a larger screen:

- glossary → entry → note → artwork → back;
- timeline → event card → artwork → back;
- card index → value → artwork → back.

## Decision drivers

- The arrow in the top bar leads to where the learner came from.
- A list comes back as the learner left it.
- The menu moves between modules, so the top bar does not repeat it.

## Considered options

- An arrow that names the previous place and goes back through history.
- A breadcrumb trail ("Słowniczek › Tympanon › Straż nocna"): it grows with every step and does not fit on a phone.
- Only the browser's own back button: it is missing in an app added to a phone's home screen.

## Decision outcome

Chosen by the owner (ATL-244):

- **Modules.** Kartoteka, Słowniczek, Kalendarium, Powtórki and Kosz have no "← Atelier"; their top bar starts with their own tools. The menu, a rail on a larger screen and the drawer on a phone, moves between modules.
- **Detail pages** (an artwork, a value, a glossary entry):
  - The top bar starts with an arrow named after the place the learner came from: a module or list by its name ("← Słowniczek", "← Kalendarium", "← Atelier"), or another detail page by the thing's name ("← Tympanon").
  - The arrow goes back through the browser's history.
  - A detail page opened directly, from a link or after a reload, links to its own list instead: an artwork to "Atelier", a value to "Kartoteka", an entry to "Słowniczek".
- **Lists come back as they were.** Going back restores the scroll position and the list's state through a page snapshot:
  - the wall, as today;
  - Słowniczek: the search and the categories (ATL-243);
  - Kartoteka: its tab and its search;
  - Kalendarium: the era, the scale and the position, the chosen event or artwork, and the filters.

  Opening a module from the menu still starts it fresh, so the timeline's filters stay per visit ([ADR-0095](0095-filter-the-timeline-with-period-and-style-lanes.md)).

- **Unchanged:** the wall stays the start page; forms keep their "Anuluj" and the unsaved-changes guard; the review session is left as it is.

### Consequences

- Good: the arrow always leads back one step, with the list as the learner left it.
- Good: the top bar of a module has more room, which matters on a phone.
- Bad: the arrow's name depends on the history of the tab, so the app keeps the name of each previous page for the session.

## More information

- Build: ATL-248.
- Issue: ATL-244.
