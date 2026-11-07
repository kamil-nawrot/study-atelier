# 0213. Change the hint of the alphabet of Master E.S.

- Status: accepted
- Date: 2026-11-07

## Context and problem statement

The hints of two hidden exhibits built in 0.21 open the same way: "Prawdziwy wielbiciel zawsze wraca do źródła." for "Fontanna di Trevi" ([ADR-0196](0196-show-an-artwork-seen-twice-as-the-trevi-fountain.md)) and "Prawdziwy znawca zgłębił sztukę od A do Z." for "Alfabet Mistrza E.S." ([ADR-0201](0201-show-a-glossary-from-a-to-z-as-the-alphabet-of-master-es.md)). Side by side in the display case they sound too alike. Which one changes, and to what?

## Decision drivers

- Each hint points the way in its own voice (`voice-and-tone.md`).
- The hint of the Trevi fountain plays on the source of the aqueduct, which its curiosity answers; the hint of the alphabet was the owner's least favourite from the start.
- The owner found new riddles on the engraving, the punches of the goldsmith or the 23 surviving prints either too obvious or not fitting.

## Considered options

Keeping the meaning "od A do Z" without "Prawdziwy": "Sztukę zgłębia się od A do Z."; "Znawca zgłębia sztukę od A do Z."; "Od A do Z – tak zgłębia się sztukę."; "Sztukę warto zgłębiać od A do Z.".

New riddles: "Mistrz ułożył litery z ludzi i zwierząt, Ty ułóż je ze słów."; "Nawet Y znajdzie swoje miejsce w dobrym słowniku."; "Mistrz podpisywał się dwiema literami, Ty potrzebujesz ich wszystkich."; "Niektóre znaki trzeba długo tropić, zanim dadzą się oswoić."; "Przetrwały dwadzieścia trzy, ale żadna nie może zginąć."; "Ostatni znak bywa najtrudniejszy do schwytania.", among others.

## Decision outcome

Chosen by the owner in ATL-552: the hint of "Alfabet Mistrza E.S." becomes "Sztukę warto zgłębiać od A do Z.", the owner's own text. It replaces the hint of ADR-0201; everything else of that ADR stands. The hint of the Trevi fountain stays.

### Consequences

- Good: the two hints no longer open with the same word, and the alphabet keeps the "od A do Z" the owner accepted.
- Bad: the hint stays rather direct.

## More information

Changed together with the build of "Nocny lichtarz" (ATL-552), whose pull request was open when the owner raised it.
