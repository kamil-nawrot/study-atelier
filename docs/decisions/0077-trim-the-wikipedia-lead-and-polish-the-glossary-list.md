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

Chosen by the owner in ATL-192: cut people's dates too, keep the lowercase, and write "twoich".

- Polish Wikipedia opens an article with "Term, other names (…) – definition". When it fetches a definition, the app cuts the first paragraph up to the first spaced dash (`–` or `—`) of the first sentence that is not in parentheses or brackets, and keeps the rest as Wikipedia writes it: "Woluta, ślimacznica – element architektoniczny…" gives "element architektoniczny…", "Sfumato (wł. sfumare – rozmywać) – technika malarska…" gives "technika malarska…". A first sentence without such a dash stays whole. The candidates of "Który to artykuł?" are cut the same way. Definitions saved before stay as they are.
- A popover card that does not fit to the right of its trigger opens to the left, its right edge under the trigger's right edge, and the room on the screen is measured without the scrollbar.
- From 768 px every letter of the glossary list after the first has a hairline (`--color-line`) above it, across the letter and its entries; a phone keeps the hairline under the letter.
- The lead under "Słowniczek" reads "Pojęcia i postaci, które chcesz zapamiętać. Ich definicje pojawią się w twoich notatkach."

### Consequences

- Good: the first sentence on the list and the card in notes say what the term is, without repeating it.
- Good: popovers in the artwork panel open towards the middle of the screen instead of under the scrollbar.
- Bad: a person's dates of life are not in the fetched definition; the learner adds them by hand when they want them.
- Bad: a lead that uses a spaced dash inside its first sentence for another purpose loses the part before it; the learner can edit the definition.

## More information

- Issue: ATL-192.
