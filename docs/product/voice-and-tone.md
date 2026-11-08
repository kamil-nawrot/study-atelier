# Voice and tone

How the app speaks to the learner in every text and message.

## Voice

The app talks to the learner the way a museum curator talks to a visitor: it knows the subject, it is helpful and it is relaxed, but it never lectures and never shows off.

- Matter-of-fact first: say what happened and what to do next.
- Relaxed, not formal: address the learner directly and informally (in Polish with "Ty"), use everyday words. The forms of "Ty" and "Twój" that address the learner start with a capital letter also mid-sentence ("w Twoim atelier", "Zastąpić Twoją definicję?").
- Sentences read the way a person would write them, never clipped into slogans ("Od 20 dzieł…"). Texts that explain the app, such as the welcome, the empty states and "Jak to działa?", may run to a few full sentences. What they say about the app is true to how it works, for example what the learner types and what the app fills in.
- Texts read as written in Polish from the start, never as a translation: no phrasings carried over from English ("na koniec dnia", "zrób różnicę"), and the plain Polish word over a borrowed one.
- No purple prose: no exclamation marks, no flowery metaphors, no jokes at the learner's expense. A light touch from the world of museums is fine when it stays clear ("Wkrótce zawisną tu dzieła z Twojego atelier").
- Use the terms from the [glossary](glossary.md), for example "atelier" for the learner's collection.
- A text about an artwork calls it "dzieło", never "obraz", because the collection also holds buildings, sculptures and ceramics ("W jakim stylu powstało to dzieło?"). "Obraz" means only the image of an artwork ("Dodaj kolejny obraz"), and a hint names what any kind of work shows ("formę, materiał i kompozycję"), not only what a painting does.

## Messages

- Errors say what went wrong in plain words and what the learner can do about it. They never blame the learner.
- Confirmations are brief and name what was done.
- A status line while the app works names the activity ("Wyszukiwanie w Wikidata…", "Zapisywanie…"), and a failure says "Nie udało się…"; the app never speaks of itself in the first person ([ADR-0131](../decisions/0131-call-the-trash-archiwum-and-describe-work-in-progress-impersonally.md)).
- An artwork is named in a message by its record number written as everywhere else in the app, with `#` and four digits ("Zapisano dzieło #0012."), see the [glossary](glossary.md).
- Buttons name the action ("Wyślij link"), not a generic "OK".
- A hint may talk to the learner like a person ("Masz obraz w schowku? Po prostu naciśnij Ctrl+V.", "Jeśli wolisz, podaj po prostu adres obrazka"), as long as it stays short and says what to do.

## Curiosities

Each tier of an exhibit in "Ekspozycja" reveals one curiosity on the exhibit's theme.

- At most three sentences and about 350 characters, in the plain voice above; titles of works in „…”, numbers as digits, no "Czy wiesz, że".
- Each curiosity has one source: a single page of a museum or another institution, Britannica, Smarthistory, a university or major press, never Wikipedia, Wikimedia, Wikidata or Wiktionary. The page is opened and states every fact of the text; the text claims no more than the source and hedges only when the source does.
- A curiosity first says what its subject is (a Viking ship burial, a forger, a map bought as medieval) and only then gives the fact, so it reads without knowing the subject; a person, place or term the learner may not know gets a few words of who or what it is, and a bare number or name gets what makes it worth telling.
- The owner approves every text before it ships.
- Every exhibit is named as an object or a place, then whose or where it is, after what its engraving shows ("Pracownia Świętego Hieronima", "Globus podróżnika", "Strzała putta"), never as a scene or an event, nor after the engraver or the title of a work ([ADR-0185](../decisions/0185-name-each-exhibit-after-what-its-engraving-shows.md)). "Turniej w Chauvency" is the one exception, a real tournament named for an allegorical engraving ([ADR-0194](../decisions/0194-show-the-six-eras-as-scenes-from-19th-century-book-illustration.md)). The credit under an engraving keeps the real title of the work. The object is a thing or a place, never a person shown in the engraving ("Soczewka znawcy", not "Zapatrzony znawca"), and the name never uses a word the app already gives a feature of its own, so it does not suggest that feature ("Lupa znawcy" became "Soczewka znawcy", [ADR-0214](../decisions/0214-record-the-first-hour-on-one-artwork-and-rename-its-exhibit.md)).
- The hint of a hidden exhibit is a riddle, not an instruction: it points the way through an image or the motif of its engraving and keeps the secret ("Lew nie gryzie tych, którzy mają coś do powiedzenia.", "Bogowie przyglądają się tym, którzy nie wiedzą, kiedy przestać."), never by naming the action or the place in the app. A new hint neither opens with the same words nor follows the same pattern as another hint of the case, since the hidden exhibits stand side by side ([ADR-0213](../decisions/0213-change-the-hint-of-the-alphabet-of-master-es.md)).
- A new exhibit is designed with the owner through the [`study-atelier-exhibit-design`](../../.claude/skills/study-atelier-exhibit-design/SKILL.md) skill.

| Exhibit                       | Theme                                                                                                                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gabinet Olego Worma           | records and firsts of art history and museums                                                                                                                                           |
| Świątynia della Tosse         | rediscoveries of the past                                                                                                                                                               |
| Pracownia Świętego Hieronima  | memory in art history                                                                                                                                                                   |
| Klepsydra melancholii         | works that took years or centuries to make                                                                                                                                              |
| Salon w Luwrze                | stories of museum visiting and exhibitions as the visitors lived them: queues, crowds, empty walls                                                                                      |
| Globus podróżnika             | little-known or unusual museums around the world                                                                                                                                        |
| Teleskop Mathieu Laensbergha  | what surprises when a famous work is seen in person                                                                                                                                     |
| Praski orloj                  | how artworks are dated                                                                                                                                                                  |
| Strzała putta                 | dates to the year: works dated exactly and dates that exposed forgeries                                                                                                                 |
| Biblioteka w Lejdzie          | where the names of styles and techniques come from                                                                                                                                      |
| Camera obscura z Encyklopedii | optics, devices and the image                                                                                                                                                           |
| The six era exhibits          | how the artworks of the era were made: materials, techniques, workshops                                                                                                                 |
| Księga Vasariego              | how the whole work of one artist is known: biographies, catalogues of works, versatility and records ([ADR-0198](../decisions/0198-show-authors-with-many-artworks-as-vasaris-book.md)) |
| Ogród Clifforta               | how collections are described and ordered: names, labels, catalogues and classification systems ([ADR-0202](../decisions/0202-show-described-values-as-cliffords-garden.md))            |
| Kryształowy Pałac             | how exhibitions are made: world's fairs, selection, hanging and curators                                                                                                                |
| Akademia Boncompagniego       | how the arts were told apart and ranked: the contest of painting and sculpture, academies, fine and applied arts, printmaking and photography admitted among the arts                   |
| Hidden exhibits               | one story about the work itself                                                                                                                                                         |

## Examples

| Instead of                                | Write                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| Nieprawidłowy e-mail lub hasło.           | E-mail albo hasło się nie zgadzają. Sprawdź oba pola albo ustaw nowe hasło. |
| Za dużo prób w krótkim czasie.            | Sporo prób w krótkim czasie. Odczekaj chwilę i spróbuj jeszcze raz.         |
| Wpisz nowe hasło do swojego konta.        | Wybierz nowe hasło do swojego konta.                                        |
| Alternatywnie wprowadź adres URL obrazka. | Jeśli wolisz, podaj po prostu adres obrazka.                                |
| Wklej obraz ze schowka skrótem Ctrl+V.    | Masz obraz w schowku? Po prostu naciśnij Ctrl+V.                            |
