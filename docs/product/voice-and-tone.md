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

Each tier of an exhibit in "Gablota" reveals one curiosity on the exhibit's theme.

- One or two sentences, at most about 250 characters, in the plain voice above; titles of works in „…”, numbers as digits, no "Czy wiesz, że".
- Each curiosity has one source: a single page of a museum or another institution, Britannica, Smarthistory, a university or major press, never Wikipedia, Wikimedia, Wikidata or Wiktionary. The page is opened and states every fact of the text; the text claims no more than the source and hedges only when the source does.
- The owner approves every text before it ships.

| Exhibit                       | Theme                                               |
| ----------------------------- | --------------------------------------------------- |
| Gabinet Olego Worma           | records and firsts of art history and museums       |
| Świątynia della Tosse         | rediscoveries of the past                           |
| Święty Hieronim w pracowni    | memory in art history                               |
| Klepsydra z „Melancholii I”   | works that took years or centuries to make          |
| Salon w Luwrze                | stories of museum visiting and exhibitions          |
| Globus podróżnika             | little-known or unusual museums around the world    |
| Teleskop Mathieu Laensbergha  | what surprises when a famous work is seen in person |
| Praski orloj                  | how artworks are dated                              |
| Biblioteka w Lejdzie          | where the names of styles and techniques come from  |
| Camera obscura z Encyklopedii | optics, devices and the image                       |
| Hidden exhibits               | one story about the work itself                     |

## Examples

| Instead of                                | Write                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| Nieprawidłowy e-mail lub hasło.           | E-mail albo hasło się nie zgadzają. Sprawdź oba pola albo ustaw nowe hasło. |
| Za dużo prób w krótkim czasie.            | Sporo prób w krótkim czasie. Odczekaj chwilę i spróbuj jeszcze raz.         |
| Wpisz nowe hasło do swojego konta.        | Wybierz nowe hasło do swojego konta.                                        |
| Alternatywnie wprowadź adres URL obrazka. | Jeśli wolisz, podaj po prostu adres obrazka.                                |
| Wklej obraz ze schowka skrótem Ctrl+V.    | Masz obraz w schowku? Po prostu naciśnij Ctrl+V.                            |
