# 0313. Collect flagged weak items and missing data in Zaplecze

- Status: accepted
- Date: 2026-11-16

## Context and problem statement

During a review the learner meets questions that are weak because of the data they were built from: a blurry image, a pin on the wrong spot, a definition or a note gap that shows the answer, or two answers that both fit. Fixing it on the spot breaks the review, and nothing in the app remembers it for later. Missing data (artworks without a style, year or image, glossary terms without a definition, [ATL-762](https://linear.app/kamil-nawrot/issue/ATL-762)) is also not gathered anywhere where it can be fixed ([ATL-467](https://linear.app/kamil-nawrot/issue/ATL-467)). The owner designed the answer with Claude on 2026-11-16 in [ATL-675](https://linear.app/kamil-nawrot/issue/ATL-675), one question at a time on mockups of the live app.

Facts checked in the code before the decisions:

- The definition question and the note gap hide the term's name, synonyms and forms (`noteTermsOf`). When the answer shows, a form is missing in the term, so the fix is in the term, not in the definition or the note, and one added form fixes every note at once.
- The wrong answers of the quizzes are told apart only by identical text (`lower(btrim(...))` in `review_round`, `nameKey` in `definitions.ts`, `key` in `symbol-questions.ts`), so one thing written two ways gives two right answers.
- Definitions, symbols and note gaps are drawn in the browser and have no row in the database that a flag could point to.

## Decision drivers

- Flag in one tap during a review and carry on.
- The flag lands on what has to be fixed, and the list opens the right field.
- Few flags against possibly hundreds of missing data in a real collection.
- No history and no automatic detection in this version.

## Considered options

Each question had two or three options with a mockup; the chosen one is listed below.

- A flag points to three kinds of items (artwork, term, symbol) or to six (artwork, image, note, pin, term, symbol).
- The flag is closed by a save from the list, by a manual "done", or by any save of the item.
- The flagged item is kept in three foreign-key columns or as a kind plus an id.
- The flag button in the review stands in the session bar or under the question.
- The flag dialog saves on a tap of the reason or after "Oznacz".
- The menu item stands among the smaller items under Archiwum or among the main items.
- The view is called "Do poprawki", "Konserwacja", "Zaplecze", "Kwarantanna" or "Magazyn".
- The list has two tabs or one page with sections.
- The one-by-one mode shows the reason in a box at the top of the form or under the highlighted field.
- The artwork view has the flag in the top bar only or also on the stage.

## Decision outcome

Chosen by the owner on 2026-11-16:

1. **Three kinds of items.** A flag points to an artwork, a glossary term or a symbol. An artwork flag may also point to one image or one pin. A flag "the answer shows in the question" lands on the term and remembers the note or the definition where it showed.
2. **Nine reasons, each leading to a field.** Artwork: image, pin (wrong spot, wrong detail, wrong term or symbol), data (title, author, year, style, relations), note. Term: hidden badly (the answer shows or another word is hidden), definition. Symbol: meaning. Any item in a question with choices: more than one answer fits; the flag remembers both answers, and for an author or a style it stays on the artwork and leads to Kartoteka. Any item: something else, with a required comment. A comment is optional otherwise, up to 200 characters.
3. **Where flags are set.** In the review and in the views of an artwork, a term and a symbol, never in the edit forms. In the review the dialog offers only the reasons of the items the question was built from, grouped by item.
4. **Closing.** A save in an editor opened from the list deletes the flag; editing the item elsewhere keeps it. A closed flag is deleted, with no history. Missing data disappears when the field is filled in.
5. **"Poprawiaj po kolei".** The list opens its items one after another in their editors; "Pomiń" goes on without closing the flag, "Zakończ" returns to the list. The queue is the open tab.
6. **Menu count.** The menu item shows the number of the learner's own flags, not missing data; artworks in Archiwum are not counted.
7. **Data.** A table `learner_flags` with three foreign keys, exactly one of them set (`num_nonnulls(...) = 1`, like `note_links`), cascades with the item, `image_id` and `pin_id` set null when the image or pin goes, a reason code, a comment, and a snapshot of the review question as `jsonb`. One flag per item, image or pin and reason: a second flag updates the comment.
8. **Review button.** A flag button in the session bar, next to the progress, for every kind of question, before and after the answer.
9. **Flag dialog.** Reason tiles grouped by item (the `ChoiceTiles` of "Zgłoś uwagę"), the comment, "Anuluj" and the confirm button; after the save the learner is back on the same question.
10. **Menu and name.** The view is called "Zaplecze", the room behind a gallery where works wait to be dealt with: shallower than Archiwum and in the language of the museum. It stands among the smaller items under Archiwum, with the Lucide `flag` icon and the count (a dot on the icon when the menu is folded). The flag button keeps the plain "Do poprawki". With it, the icons of all the smaller menu items (Archiwum, Zaplecze, Zgłoś uwagę, the theme, Wyloguj się) shrink to 16 px on a computer and a phone, each centred where it stands today, with the layout unchanged.
11. **List.** Two tabs like Archiwum, the learner's flags and the missing data; a flag row shows the item, the reason (with the image number), where it came from, the comment and a fix button.
12. **One-by-one form.** The form scrolls to the field of the reason, highlights it and shows the reason and the comment under it; "Coś innego" shows them in a box at the top. The top bar shows the progress and "Pomiń", the bottom "Zakończ" and a save that goes on to the next item.
13. **Views.** The artwork view has the flag in the top bar next to the favourite and the binoculars, and in "Więcej działań" on a phone. The image reason takes the image on the stage, and the pin reason asks for the pin number in the dialog. The term and symbol views put it in the top bar the same way.

### Texts

Chosen by the owner on 2026-11-16 (the "a" set of the proposal; the owner may still rewrite single lines before the build):

| Place                                                     | Text                                                                                                                                          |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Menu item and view title                                  | Zaplecze                                                                                                                                      |
| Flag button (review session bar, views, "Więcej działań") | Do poprawki                                                                                                                                   |
| Menu count for a screen reader                            | {n} do poprawki                                                                                                                               |
| Flag dialog title                                         | Co poprawić?                                                                                                                                  |
| Flag dialog description                                   | Wybierz, co jest nie tak. Wrócisz do tego na Zapleczu.                                                                                        |
| Group headings                                            | Dzieło „{title}” / Pojęcie „{name}” / Symbol „{name}”                                                                                         |
| Reason: image                                             | Obraz jest nieostry albo zły                                                                                                                  |
| Reason: pin                                               | Pinezka wskazuje złe miejsce albo zły detal                                                                                                   |
| Reason: artwork data                                      | Coś się nie zgadza w danych                                                                                                                   |
| Reason: note                                              | Notatka jest niejasna albo błędna                                                                                                             |
| Reason: term hidden badly                                 | Odpowiedź widać w pytaniu                                                                                                                     |
| Reason: definition                                        | Definicja jest niejasna albo błędna                                                                                                           |
| Reason: symbol meaning                                    | Znaczenie jest źle opisane                                                                                                                    |
| Reason: two right answers                                 | Pasuje więcej niż jedna odpowiedź                                                                                                             |
| Reason: other                                             | Coś innego                                                                                                                                    |
| Pin choice (pin reason from the artwork view)             | Która pinezka?                                                                                                                                |
| Comment label                                             | Komentarz                                                                                                                                     |
| Comment hint                                              | Kilka słów, które pomogą Ci to poprawić. Nieobowiązkowe.                                                                                      |
| Empty comment with "Coś innego"                           | Napisz w komentarzu, co jest nie tak.                                                                                                         |
| Confirm button                                            | Oznacz                                                                                                                                        |
| Toast after a new flag                                    | Odłożono na Zaplecze.                                                                                                                         |
| Toast after a changed flag                                | Zmieniono flagę na Zapleczu.                                                                                                                  |
| Save error                                                | Nie udało się odłożyć na Zaplecze                                                                                                             |
| List lead                                                 | Tu czeka to, co oznaczysz flagą w powtórce albo w widokach, i dane, których brakuje w atelier. Popraw je po kolei albo wybierz jedną pozycję. |
| Tabs                                                      | Twoje flagi / Braki danych                                                                                                                    |
| One-by-one button                                         | Poprawiaj po kolei                                                                                                                            |
| Row button                                                | Popraw                                                                                                                                        |
| Origin: a review question                                 | z pytania „{question}”                                                                                                                        |
| Origin: a note gap                                        | w notatce do #0012                                                                                                                            |
| Origin: a view                                            | z widoku dzieła / pojęcia / symbolu                                                                                                           |
| Missing data in a row                                     | brak stylu / brak roku / brak obrazu / brak definicji                                                                                         |
| Empty flags tab                                           | Nic do poprawki · Gdy coś w pytaniu albo w dziele się nie zgadza, oznacz to flagą. Trafi tutaj.                                               |
| Empty missing data tab                                    | Niczego nie brakuje · Wszystkie dzieła mają styl, rok i obraz, a pojęcia definicje.                                                           |
| Load error                                                | Nie udało się wczytać Zaplecza                                                                                                                |
| One-by-one progress                                       | {n} z {m}                                                                                                                                     |
| One-by-one buttons                                        | Pomiń / Zakończ / Zapisz i dalej                                                                                                              |
| Under the highlighted field                               | {reason} · „{comment}”                                                                                                                        |
| End of the queue (toast)                                  | To już wszystko. Poprawione pozycje: {n}.                                                                                                     |

### Consequences

- Good: a weak question is flagged in a moment, and the fix opens the right field; one form fixes the answer in every note.
- Good: missing data and flags are gathered in one place with a short session to clear them.
- Bad: a new table with export and import, and a flag dialog that has to know what every question was built from.
- Bad: no flags on Kartoteka values; a duplicate author goes through the artwork.

## More information

- Mockups, the inventory of questions and the data model: `/mnt/project-files/atl-675/` (outside the repository).
- Builds: [ATL-791](https://linear.app/kamil-nawrot/issue/ATL-791) (flags) and [ATL-467](https://linear.app/kamil-nawrot/issue/ATL-467) with [ATL-762](https://linear.app/kamil-nawrot/issue/ATL-762) (the list and missing data).
- Later: automatic flags for images that stopped loading.
