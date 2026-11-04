# 0178. Ask for the year and the chronological order in the review

- Status: accepted
- Date: 2026-11-03

## Context and problem statement

The review asks about the image, the title, the author, the style, pins with glossary terms and glossary definitions ([ADR-0061](0061-review-the-collection-in-one-mixed-session.md), [ADR-0152](0152-ask-who-made-the-artwork-in-the-review.md), [ADR-0153](0153-add-glossary-definitions-to-the-review-as-extra-questions.md)). None of them asks when an artwork was made, so the learner never trains a feel for the time of a work or for the proportions of time between works. The owner settled the rules of two new question kinds in ATL-446 (guess the year on a slider) and ATL-445 (put four artworks in chronological order); this record settles how they look, read and behave.

## Decision drivers

- The questions sit in the existing review card (image stage and panel) and keep its keyboard and phone conventions.
- The answer shows where the artwork lies in its era, not only a number.
- Both questions work with a mouse, a finger, the keyboard and a screen reader.
- Nothing on the screen gives the answer away before it is given ([R-81](../product/requirements.md#review)).

## Considered options

For the year question:

- the slider in the panel, under the question;
- the slider under the image on the stage;
- a band across the whole screen at the bottom.

For the answer to the year question: bands of the tolerance on the whole era axis; the real years and the guess without bands; an axis zoomed around the real years.

For the order question: dragging the images in a row; a list with "up" and "down" buttons in the panel; pointing at the images one by one from the oldest.

For the answer to the order question: the images stay where the learner put them, each marked; the images move into the right order; the images move onto an axis at their real distances.

## Decision outcome

Chosen by the owner, one question at a time, on mockups in ATL-475: the slider in the panel, bands on the whole era axis, dragging in a row, and the images staying where the learner put them.

### Guess the year

- The card is the quiz card: the image on the stage, the panel with the label "Odgadnij datę powstania", the question "Kiedy powstało to dzieło?" and the hint "Dzieło pochodzi z nowożytności (1492–1789). Gdzie je umieścisz?" with the era's name and years.
- Under the hint, the guessed year stands large in Newsreader italic over a native range input (`input type="range"`, step 1) named "Rok powstania dzieła", with the era's first and last year at its ends and ticks between them. On a phone the year and the slider stand in the bar at the bottom, over the button, within reach of the thumb. The slider starts in the middle of the era.
- The keyboard moves the slider by a year with the arrows and by a tenth of the era with Page Up and Page Down, Home and End go to its ends, and Enter checks, like the other quizzes. The year is read as text, with "p.n.e." for years before the common era.
- "Sprawdź rok" checks the guess. The slider then turns into the answer axis: the real year, or the span of years as a bar, the guess as a mark labelled with its year, and two bands around the real years, "Wiem" within 5% of the era's length and "Prawie" within 15%, without a legend. The button becomes "Następne".
- The result text under the axis, announced by a live region, names the rating and the real years: "Świetne wyczucie: dzieło powstało w latach 1503–1519." ("Wiem"), "Blisko. Dzieło powstało w latach 1503–1519." ("Prawie"), "Tym razem daleko. Dzieło powstało w latach 1503–1519." ("Nie wiem"), then the distance, "Strzał w rok 1540 to o 21 lat za późno." (or "za wcześnie"), or "Twój rok 1510 mieści się w latach powstania." inside a span, then the title and the authors as in the other quizzes. On a phone the result text takes the place of the question.
- The bounds of the slider are those of the era in [ADR-0176](0176-ask-before-saving-a-year-outside-its-era.md); prehistory, which has no lower bound, starts at 40 000 BCE, where the timeline starts, and the contemporary era ends at the current year. An artwork without an era, or with a year outside its era, gets no year question.

### Put in chronological order

- The card has four images on the stage in one row, under a line "Najstarsze" to "Najnowsze", each in a mat with its position number; on a phone they stand in a column with a grip at the right, the oldest at the top. The panel has the label "Ułóż chronologicznie", the question "W jakiej kolejności powstały te dzieła?" and the hint "Przeciągaj obrazy tak, aby ułożyć je w kolejności od najstarszego do najnowszego", plus from 768 px "Z klawiatury: wybierz obraz Tabem, chwyć Spacją, przesuń strzałkami i puść Spacją."
- An image is dragged with the mouse or a finger; the lifted image is outlined and the others make room. On a phone the drag starts on the grip, so the page still scrolls. From the keyboard each image is a focusable item "Dzieło na miejscu 2 z 4"; Space lifts it ("Chwycone. Strzałki przesuwają, Spacja puszcza, Escape przerywa."), the arrows move it ("Miejsce 3 z 4.") and Space puts it down ("Odłożone na miejscu 3."), announced by a live region; Escape puts it back.
- Until the answer, nothing names the artworks: no titles, years or credits, and the images have neutral alternative texts.
- "Sprawdź kolejność" checks the whole order. The images stay where the learner put them, each marked right or wrong with its real year under it, and a wrong one with "powinno być 4". The panel says "Świetnie, kolejność się zgadza.", "Prawie: 2 z 4 dzieł trafiły na swoje miejsce." when some are in place, or "Tym razem żadne dzieło nie trafiło na swoje miejsce." when none is, shows an axis with the four artworks as numbered points at their real distances, and lists them under "Prawdziwa kolejność" from the oldest with the title, the authors and the year. The button becomes "Następne".

### In the session

- The rules of ATL-445 and ATL-446 stand: 2–4 of these questions in a session, on top of its limit of artworks; the year question with its own schedule (facet `date`) only for artworks with a year that were reviewed once, the order question without a schedule; both count towards the points of the museum career.
- The summary of a round adds one line: "Pytania o czas: rok trafiony 2 z 3 razy, kolejność 1 z 2.", or only the part that was asked ("Pytania o czas: rok trafiony 2 z 3 razy."). A year counts as hit with "Wiem" or "Prawie".

### Consequences

- Good: the review trains the time of a work and the distances between works, which closed questions miss.
- Good: both questions fit the review card and its conventions, so the session needs no new layout.
- Bad: dragging needs its own keyboard and screen reader handling, which the other quizzes do not have.
- Bad: an era as long as prehistory gives a coarse slider and wide bands; the rule is the same for every era on purpose.

## More information

- Issues ATL-475 (design), ATL-446 and ATL-445 (build). Mockups and the texts table live in the project files under `atl-475/`.
