# 0061. Review the collection in one mixed session of flashcards and quizzes

- Status: accepted
- Date: 2026-10-16

## Context and problem statement

The learner builds the atelier to learn, but the app only stores and shows artworks; nothing helps them remember what they entered. The spike ATL-157 compared ways to review an own collection: flashcards, quizzes that pick one of four, chronology, and a choice of separate exercises. What form does reviewing take in the app, what does the learner see, and where do they start it?

## Decision drivers

- Learning, not a game: retrieval practice, spacing and interleaving are the strategies research rates highest (Roediger and Karpicke 2006; Cepeda et al. 2006; Dunlosky et al. 2013; Kornell and Bjork 2008).
- Only the learner's own content: every question and every answer comes from their artworks, values and notes. Nothing is generated.
- Little to decide before each session: people tend to pick the easier, less useful exercise when they are given a menu.
- The same look as the rest of the app: the stage and the panel of the artwork view, the wall's passe-partout, tokens only.
- Images load quickly enough for four at once on a phone.

## Considered options

1. One mixed session: the app picks what is due and chooses a flashcard or a quiz for each artwork
2. Separate exercises in a menu (flashcards, each quiz, chronology), each with its own session
3. Flashcards only
4. Questions written by a language model from the learner's notes

## Decision outcome

Chosen option: 1, because it makes reviewing one daily step, mixes eras and styles on its own, and lets a new artwork start with an easier quiz before it is asked from memory. Option 4 breaks the rule that the content is the learner's own.

- Entry: "Powtórki" in the menu, between "Kartoteka" and "Kosz", with a counter of the artworks due today; the counter is left out when nothing is due. The view lives at `/atelier/review`, and its start, the session and the summary are states of one page.
- Start screen (mockup 01): "Na dziś czeka n dzieł" with how many are reviews and how many are new and about how long it takes, then two rows of choices: "Co powtarzamy?" (the whole collection, favourites, a style or a period, or the filters of the wall) and "W jakiej formie?" ("Mieszane", "Fiszki", "Quizy"), and "Zacznij powtórkę". A side panel shows, per era, how many artworks the learner remembers for longer than a week, and the artworks that were hard lately.
- Session: the artworks due today, the most overdue first, then new artworks up to 10 a day; at most 20 artworks per session. Neighbours differ in era where possible. A forgotten artwork comes back after three to five others. Each artwork is either a flashcard or a quiz:
  - mixed: a new, learning or forgotten artwork gets a quiz, one remembered for less than a week a flashcard or, every third time, a style quiz, and one remembered for longer a flashcard;
  - "Fiszki" and "Quizy" use only that form.
- Flashcard (layout A, mockups 03 and 04): the image on the stage, the question in the panel ("Poznajesz?" and "Spróbuj przypomnieć sobie tytuł, autora, czas i styl, zanim odkryjesz kartę."), no fields to fill in. "Odkryj kartę" (Space) shows the title, authors, year, period, style, place and the learner's note ("Twoja notatka"), then "Jak dobrze to pamiętasz?" with three ratings: "Nie wiem", "Prawie", "Wiem" (keys 1 to 3), each with when the artwork comes back.
- Quizzes, all on one engine of distractors:
  - "Gdzie jest {tytuł}?": four images, pick the one with that title (mockups 07 and 08);
  - "Jaki to tytuł?": one image, four titles (mockup 09);
  - "W jakim stylu powstał ten obraz?": one image, four styles from the learner's card index (mockup 10).
  The answer is shown at once: the right one marked, a wrong pick named with why it was close ("ten sam autor", "styl", "okres"), and "Wrócimy do niego za chwilę." when it was wrong. "Następne" (Enter) goes on. Chronology is left for after 0.5.
- Distractors: other artworks from the same scope, scored by what they share with the answer (style 4, author 3, period 2, type 2, era 1, a year at most 50 years apart 1, place 1); three are drawn at random from the eight best. Artworks without an image, in the trash or with the same title as the answer are never distractors.
- Hiding the answer: until it is revealed, nothing on the screen names the artwork, neither the image credit, the record number, the title as alternative text nor the address.
- Minimum: a session starts only when the chosen scope has at least 20 artworks with an image; otherwise the start says "Dodaj jeszcze n dzieł ze zdjęciem, żeby zacząć powtórki z tego zakresu." A quiz of a kind is asked only when four sensible answers exist (for the style quiz, four styles); otherwise the artwork gets a flashcard.
- Leaving: "Przerwij" in the top bar asks "Przerwać teraz? Twoje odpowiedzi do tej pory są zapisane."; every answer is saved as it is given.
- Summary (mockup 12): "Gotowe", "Powtórzone n dzieł, czas m min. Jutro k.", the artworks grouped as "Do poprawki", "Prawie" and "Opanowane", "Następna runda (n)" when more is due and "Do atelier".
- Nothing due: "Na dziś wszystko powtórzone. Następne dzieła czekają {kiedy}."
- Keyboard: Space reveals, 1 to 3 rate, 1 to 4 answer, Enter goes on. On a phone the actions sit at the bottom of the screen. There is no time limit.

### Consequences

- Good: one step a day, with interleaving and a gentle start for new artworks built in.
- Good: one engine of distractors serves three quizzes, and adding chronology later reuses the session.
- Good: the scope row lets the learner review one style or the favourites without a separate mode.
- Bad: the learner does not choose the order or the form of each question in the mixed session, which some may miss.
- Bad: a small collection or a narrow scope cannot start a session until it has 20 artworks with an image.
- Bad: a quiz shows four images at once, so own images need smaller copies (ATL-113) to stay quick.

## More information

Spike and analysis: ATL-157, `nauka/analiza.md` in the project files, also attached to the issue in Linear. Mockups 01 to 13 and the texts (`nauka/teksty.md`) are in the same folder. Scheduling and storage: [ADR-0062](0062-schedule-reviews-with-fsrs.md). Requirements R-76 to R-82 and R-84. The scope choice is narrowed by [ADR-0064](0064-narrow-the-review-scopes.md).
