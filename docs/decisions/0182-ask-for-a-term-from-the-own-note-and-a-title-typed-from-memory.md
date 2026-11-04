# 0182. Ask for a term from the own note and a title typed from memory

- Status: accepted
- Date: 2026-11-04

## Context and problem statement

The second half of the 0.19 theme "Powtórki z całego atelier" proposed three more review questions: a gap in the learner's own note (ATL-447), a typed answer for well-known artworks (ATL-448) and a round on pairs the learner confuses (ATL-449). This record settles which of them are built and how they look, read and behave, after the year and order questions of [ADR-0178](0178-ask-for-the-year-and-the-chronological-order-in-the-review.md) and [ADR-0179](0179-draw-the-questions-about-time-and-give-a-point-for-a-right-answer.md).

## Decision drivers

- Each question works with the owner's real data (production, 2026-11-04): 266 artworks, 245 with a note (median 252 characters, 90% up to 669, the longest 2239), 161 glossary terms, 140 notes holding a term in 260 artwork–term pairs; 196 artworks without an author; 117 recognition cards with a stability of at least 7 days.
- A question never judges right knowledge as wrong because of spelling, transliteration or inflection.
- The questions keep the review card and the conventions of the other quizzes.
- A learner whose notes or way of learning do not suit a question can turn it off.

## Considered options

For the gap in a note: glossary terms only, or any word the learner marks; the sentence with the term, the whole note, the paragraph or list item with the term; the note on the stage like a glossary definition, or the artwork's image on the stage and the note in the panel; for long paragraphs the whole paragraph with scrolling, a window of about 150 characters around the gap, or no question; one question a session, 1–2 at random, or a count shared with the glossary questions.

For the typed answer: free typing with tolerance, typing with suggestions from the own atelier, or no typed answer; the author, the title, or the author where there is one; every settled artwork, every second or every third.

For the confused pairs: pairs from every quiz, pairs of artworks from the title and image quizzes, or no round for now.

## Decision outcome

Chosen by the owner in ATL-479, one decision at a time on mockups: the gap in a note with glossary terms, the paragraph, the image on the stage and the whole paragraph, once a session; the title typed with suggestions for every third settled artwork; no round on confused pairs for now.

### The gap in the own note

- It joins a session once, on top of its artworks, when the learner turns it on in the review settings with a switch under the glossary questions, "Dołączaj do sesji pytania z luką w moich notatkach", off by default like the questions about time ([ADR-0181](0181-turn-the-questions-about-time-on-in-the-review-settings.md)).
- It asks about an artwork of the session's scope whose note holds a glossary term, recognised by its name, synonyms and forms as in the notes, and never about an artwork the session shows, since revealing a flashcard shows the whole note. Without such an artwork the session has no gap question.
- The card is the quiz card: the artwork's image on the stage, with its title as the alternative text; in the panel the caption "Pytanie dodatkowe z notatek", the question "Jakiego pojęcia brakuje w Twojej notatce?", the paragraph or list item of the note holding the term (the first one when the term appears in several, headings do not count) with every occurrence of the term in it as a gap ("ukryte pojęcie" for a screen reader) and other terms as plain text, the line "Z notatki do dzieła {tytuł}", and four terms: the right one and three other glossary names, the same category first, as in "Co to jest?". A long paragraph is shown whole and the panel, or the page on a phone, scrolls.
- After the answer the gap shows the term, marked as in the glossary definitions; the panel says "Tak, to …" or "Nie, to …", and after a wrong answer "Wrócimy do niej za chwilę.", and the question comes back later in the session with the terms shuffled.
- A right answer the first time gives 1 point of the museum career in the day's right answers, with the year, order and glossary questions (at most 50 a day); nothing else is saved, there is no schedule and the summary of the round has no line for it.

### The title typed from memory

- It is a sixth box on the list of quiz kinds, "Wpisywanie tytułu dzieła z pamięci". The rule "Zostaw zaznaczony przynajmniej jeden rodzaj" counts only the other five, as the typed title covers only settled artworks.
- It asks about artworks settled in recognition (a card in the review state with a stability of at least 7 days, the threshold the app already uses), every third of them in the forms "Mieszane" and "Quizy", in place of the flashcard or the quiz; the others keep theirs. The form "Fiszki" never asks it. It uses the recognition schedule: a right answer is "Wiem", a wrong one "Nie wiem".
- The card is the quiz card with the image on the stage; the panel has the question "Jak nazywa się to dzieło?", the hint "Zacznij wpisywać tytuł, a następnie wybierz pasującą podpowiedź z listy." and a field "Tytuł dzieła" in place of the four answers.
- After three letters, or earlier once the text typed is a whole word of a title (so "Ur" finds "Ur"), the field lists up to 6 artworks of the atelier with a word of the title starting with the letters typed, ignoring case and diacritics, with the match in bold, the title on the first line and the authors, read-only and muted, under it. Rows that cannot be told apart, the same title with the same authors or with none, are one row.
- The answer is an artwork, not a text: a pick fills the field and "Sprawdź tytuł" or Enter checks it; a merged row is right when any of its artworks is the one asked. The field then gets a success or danger border and the panel says "Tak, to …" or "Nie, to …" with the title and the authors, as in the other quizzes; a wrong answer comes back later in the session.
- On a phone the field scrolls to the top when the keyboard opens, so the suggestions stay in view.

### The confused pairs

- No round on confused pairs for now; ATL-449 goes back to the ideas. The app does not save which wrong answer was chosen, few artworks have an author, and a wrong quiz answer already comes back later in the session.

### Consequences

- Good: what the learner wrote comes back in learning, next to the artwork it was written about.
- Good: the typed title tests recall of well-known artworks without any spelling rules, and the authors in the suggestions tell artworks of the same title apart.
- Bad: a long paragraph pushes the answers below the fold, mostly on a phone.
- Bad: the authors in the suggestions are a partial hint for a learner who recognises the author.
- Bad: the gap question needs the notes of the artworks in scope, which the review does not load today.

## More information

- Issues ATL-479 (design), ATL-447 (the gap in a note), ATL-448 (the typed title), ATL-449 (the confused pairs, deferred). Mockups `tmp/mockups/atl-479/` on the owner's machine.
