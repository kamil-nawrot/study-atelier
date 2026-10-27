# 0143. Welcome a new learner on the empty wall

- Status: accepted
- Date: 2026-10-27

## Context and problem statement

A new learner lands on an empty wall and has to find out alone what the atelier, Kartoteka, Słowniczek, Kalendarium, Kronika and the reviews are for. The owner knows the app; other learners do not. What does the first run show, does the app offer sample artworks, and are the hints remembered once dismissed?

## Decision drivers

- The atelier is the learner's own: building it is part of learning.
- The first view says what to do first and how the app helps learning, in natural sentences rather than slogans.
- Nothing to maintain beyond the texts.

## Considered options

- Sample artworks: "Wczytaj kilka przykładowych dzieł" (a small set from Wikidata and Commons, removable at once), or none
- The welcome: a fuller description only, or the description with "Jak to działa?" in three steps
- Hints shown once and dismissed (stored in `profiles`), or shown while the atelier is empty

## Decision outcome

Chosen by the owner:

- No sample artworks: the atelier holds only what the learner adds.
- The empty wall shows `WallWelcome`: the title "Twoje atelier jest jeszcze puste", a paragraph on what the atelier is, "Dodaj pierwsze dzieło", and "Jak to działa?" with three numbered steps (adding an artwork, describing and linking it, reviewing), each a few sentences in body text. The texts were written and corrected with the owner, true to what the app does, without examples of particular terms or events.
- The welcome disappears with the first artwork, so nothing is dismissed or stored.
- The empty states of Słowniczek, Kalendarium and Kronika keep their layout and get fuller texts on what the module is for and how it fills up; Kartoteka keeps its short line per tab, as its values come from the artworks.

### Consequences

- Good: a new learner sees the first step and the path of learning without a tour or stored state.
- Good: no starter set to keep up to date.
- Bad: a learner who wants to see a full wall before adding anything has nothing to look at.
- Bad: the welcome is long on a phone (about one and a half screens).

## More information

- Issue ATL-335; the mockups are attached to the issue.
