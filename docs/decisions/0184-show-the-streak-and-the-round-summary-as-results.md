# 0184. Show the streak and the round summary as results

- Status: accepted
- Date: 2026-11-04

## Context and problem statement

The streak on the review start was a grey `Tag` ("Seria: 5 dni z powtórkami z rzędu", [ADR-0078](0078-show-a-streak-of-days-with-reviews-on-the-review-start.md)) and the summary of a round a heading "Gotowe" over a few sentences of plain text, with the plan points and the lit tiers of the museum career as captions ([ADR-0160](0160-gamify-learning-as-a-museum-career.md)). Both got lost on the screen and stood out in nothing. The owner wants them to read as results worth noticing.

## Decision drivers

- One strong accent per screen, in the patterns the reviews already use: the title font for a result and the bar of "Jak dobrze znasz swoje atelier?".
- Every number on its own line, readable at a glance.
- No new data for the streak; one more column, not a new request, for the colour of a new exhibit.

## Considered options

For the summary: tiles of numbers as in the statistics; one heading with a bar of the ratings and lines with icons.

For the career in the summary: framed cards, with the tier's engraving; lines with coloured names.

For the streak: a line with an icon; a large number; a large number with a strip of the last seven days.

## Decision outcome

Chosen by the owner in ATL-486, on mockups: the heading with the bar and lines with icons, the career as lines in a second column, and the large number with the strip of seven days.

### The summary of a round

- The heading is the result in the title font, italic, large: "19 dzieł powtórzonych w 12 minut" ("Gotowe" when no artwork was answered). Under it a bar splits the artworks into "Opanowane", "Prawie" and "Do poprawki", in the colours of the knowledge bar, with a legend "Opanowane 5 · Prawie 7 · Do poprawki 7".
- Then one line each, with an icon, only when it applies, the value in bold: "Trafiony rok powstania: 1/1" (target), "Poprawnie chronologicznie ułożone dzieła: 0/1" (list-ordered), "Poprawnie odgadnięte pojęcia: 1/3" (book-a, the glossary's icon), "Poprawnie uzupełnione luki w notatkach: 1/1" (notebook-pen) and "Jutro będzie czekać na Ciebie 12 dzieł do powtórki" (calendar-clock), or "Plan powtórek się nie zmienił." after a free round. The glossary questions and the gaps in notes count the first answer to each question, like their point.
- From 768 px the career stands in a second column next to these lines: "Nowy eksponat na Ekspozycji: Strzała putta · I" (trophy, the menu's icon of the display case), the name in the colour of the tier's metal (silver for platinum), and "Nowy stopień: Kustoszka" (award), the name in the amber accent. The plan points and the streak bonus leave the summary. On a phone the career follows the lines.
- A rule separates this head from the groups of artworks.
- `exhibit_tiers` keeps how many tiers its exhibit has (`tiers`), written when a tier lights up, so the summary colours a new exhibit from the row it already reads.

### The streak on the review start

- Under the plan, whose parts stand apart with icons ("12 powracających" with rotate-ccw, "7 nowych" with sprout), the caption "Twoja seria powtórek", then the number of days in the title font, italic, large, in amber, and "dni z rzędu" next to it, centred.
- Under them a strip of the last seven days labelled with the weekday, the last one "dziś": the days of the streak filled in the foreground colour, earlier days in the tag colour, today a dashed outline until a review today fills it. The strip follows from the number of days and whether a card was reviewed today; a day on which nothing waited is drawn inside the streak. A screen reader hears one sentence instead: "Ostatni tydzień: powtórki przez 5 dni z rzędu, dziś jeszcze bez powtórki."

### Consequences

- Good: the result of a round and of the streak are the first things on both screens.
- Good: the summary names the glossary questions and the gaps in notes, which it did not count before.
- Bad: a streak with a day on which nothing waited is drawn one day off.
- Bad: the summary no longer says how many points the plan gave; the display case still does.

## More information

- Issue ATL-486. Mockups in `tmp/mockups/atl-486/` on the owner's machine.
