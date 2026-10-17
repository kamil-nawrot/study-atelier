# 0077. Trim the term from a Wikipedia definition and polish the glossary list

- Status: accepted
- Date: 2026-10-17

## Context and problem statement

After the first use of the glossary ([ADR-0074](0074-keep-a-glossary-of-terms-with-definitions-from-wikipedia.md)) the owner found a fetched definition repeating the term it defines, popovers running past the right edge of the artwork view, a list without a line between the letters on a computer, and a lead under the title that should read differently (ATL-192). This record changes those parts of ADR-0074; the rest of it stands.

## Decision drivers

- A definition reads as an answer to "what is it", without the name the learner already sees above it.
- The Wikipedia API has no option to leave the term out, so the app does it when it fetches the text.
- A popover card stays whole on the screen and close to the word that opened it.

## Considered options

- Trimming people: cut their names and dates of life together with the term, or keep the dates in parentheses.
- Letter case after the cut: lowercase as Wikipedia writes it, or a capital letter.
- The lead under the title: "Twoich" as written by the owner, or "twoich" like the other texts mid-sentence.

## Decision outcome

Chosen by the owner in ATL-192: cut people's dates too, start the definition with a capital letter (after first choosing the lowercase), and write "twoich".

- Polish Wikipedia opens an article with "Term, other names (…) – definition". When it fetches a definition, the app cuts the first paragraph up to the first spaced dash (`–`, `—`, a minus sign or a hyphen) outside parentheses and brackets, when no sentence ends before it outside them ("właśc." and the other abbreviations do not end one), and starts the rest with a capital letter: "Woluta, ślimacznica – element architektoniczny…" gives "Element architektoniczny…", "Sfumato (wł. sfumare – rozmywać) – technika malarska…" gives "Technika malarska…". A first sentence without such a dash stays whole. The candidates of "Który to artykuł?" are cut the same way. Definitions saved before stay as they are.
- When the first paragraph has three words or fewer after the cut, the first sentence of the next paragraph of the introduction follows it: "Tympanon (…) – detal architektoniczny." gives "Detal architektoniczny. W architekturze klasycznej terminem tym określano wewnętrzne trójkątne pole…". An introduction of one paragraph stays as it is ("Ołtarz" gives "Miejsce składania ofiar religijnych.").
- The list shows the first two sentences of a definition when the first has three words or fewer, for definitions from Wikipedia and the learner's own alike, still in at most two lines.
- A popover card that does not fit to the right of its trigger opens to the left, its right edge under the trigger's right edge, and the room on the screen is measured without the scrollbar.
- From 768 px every letter of the glossary list after the first has a hairline (`--color-line`) above it across the whole width of the page, like the line under the tabs of the card index, while the entries keep the width of `--size-content-default`; a phone keeps the hairline under the letter.
- The lead under "Słowniczek" reads "Pojęcia i postaci, które chcesz zapamiętać. Ich definicje pojawią się w twoich notatkach."

### Consequences

- Good: a fetched definition too short to explain the term borrows one sentence from the next paragraph, which is already in the response, so no request is added.
- Good: the first sentence on the list and the card in notes say what the term is, without repeating it.
- Good: popovers in the artwork panel open towards the middle of the screen instead of under the scrollbar.
- Bad: a person's dates of life are not in the fetched definition; the learner adds them by hand when they want them.
- Bad: a lead that uses a spaced dash inside its first sentence for another purpose loses the part before it; the learner can edit the definition.

## More information

- Issue: ATL-192.
