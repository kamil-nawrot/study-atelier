# 0308. Show Moses with the tablets of the law as the covenant tablets

- Status: accepted
- Date: 2026-11-15

## Context and problem statement

The owner wants another hidden exhibit for the room "Krypta", which holds the exhibits for actions outside collecting and learning ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md)), after "Paszcza prawdy", "Nocny lichtarz" and "Mucha Giotta" ([ADR-0297](0297-show-a-swatted-painted-fly-as-giotto-s-fly.md)). The easter egg is something nobody does: reading the terms or the privacy policy to the end. The owner chose how it is checked: the last paragraph of the document comes into view after the page has been open and visible for about 3 minutes, so scrolling straight to the end does not count. The time is counted as for "Soczewka znawcy" ([ADR-0214](0214-record-the-first-hour-on-one-artwork-and-rename-its-exhibit.md)) and the find is recorded once on the profile, as for "Nocny lichtarz" ([ADR-0237](0237-record-a-switch-to-the-light-theme-only-in-the-learner-s-night.md)). The legal texts do not change, since a change raises `LEGAL_VERSION` and asks every learner to accept again. The look and the texts are designed first; the counting is built later in its own issue. Which object and engraving does the exhibit show, and how does it read?

## Decision drivers

- The engraving comes from a public-domain or CC0 source and is named after what it shows ([ADR-0185](0185-name-each-exhibit-after-what-its-engraving-shows.md)).
- The name never uses a word the app uses for a feature, so neither "Regulamin" nor "Polityka", which would give the secret away.
- A curiosity of a hidden exhibit tells one story about the work itself, from one source that states every fact.
- The hint of a hidden exhibit works without the engraving and neither opens nor follows the pattern of another hint ([ADR-0231](0231-show-an-exhibition-through-all-six-eras-as-lenoir-s-chapel.md)).

## Considered options

For the engraving: Johann Sadeler (I) after Crispijn van den Broeck, _Moses with the tablets of the law_ (1575, Rijksmuseum RP-P-OB-5451, CC0), chosen by the owner; John Pine's engraved facsimile of Magna Carta (1733, Commons `Magna Carta - John Pine engraving 1733.jpg`), a page of dense hand-coloured text with the arms of the barons and the seal. The Code of Hammurabi was left out: the stele was found in 1901, so only photographs exist, and none on Commons is large enough.

For the crop: the whole print with its border (`sadeler-moses-whole`), where the margin takes room and the dancers at the calf are small; the inside of the border (`sadeler-moses-inner`), with Moses, the legible tablets, Sinai and the dance round the golden calf; the tablets alone (`sadeler-moses-tablets`), graphically strong but without the calf and without Moses holding them.

For the name: "Tablice przymierza"; "Tablice z Synaju"; "Tablice Mojżesza"; "Tablice spod Synaju"; "Cielec spod Synaju", which turns the meaning of a reward for reading to the end around.

For the hint: "Najczęściej akceptowany tekst świata jest zarazem najrzadziej czytanym."; "Drobnym drukiem pisze się rzeczy najważniejsze."; "Diabeł tkwi w szczegółach, a nagroda w ostatnim akapicie."; "Prawo nie zna wyjątków, ale zna cierpliwych czytelników."; "Wszyscy się zgadzają, nikt nie wie na co."; then "Najdłuższa lektura w kolekcji nie ma ani jednej ilustracji."; "Nawet paragrafy mają swój szczęśliwy koniec."; "Drobny druk też ma ostatnią stronę."; "Zgodę wyraża się jednym kliknięciem, lekturę kończy się po kwadransie."; "Prawnicy też piszą dla kogoś. Podobno."; "Ostatnie zdanie czytają tylko ci, którzy nie przewijają.". The owner then asked for a twist on "Nieznajomość prawa szkodzi": "Nieznajomość prawa szkodzi. Znajomość – popłaca."; "Nieznajomość prawa szkodzi. Znajomość do ostatniego paragrafu – popłaca."; "Nieznajomość prawa nie zwalnia z jego przestrzegania. Za to znajomość bywa nagradzana."; "Znajomość prawa jeszcze nikomu nie zaszkodziła."; "Ignorantia iuris nocet. Lectio prodest."; and the chosen one, which quotes Seneca whole. A play on the app's own consent "Akceptuję i oświadczam, że zapoznałem(-am) się z…" was left out, since a hint does not quote the app.

For what it was awarded for: "Za przeczytanie tego, co wszyscy tylko akceptują."; "Za doczytanie drobnego druku do ostatniej kropki."; "Za lekturę, której nikt się nie podejmuje."; "Za cierpliwość większą niż u ludu spod Synaju.".

## Decision outcome

Chosen by the owner in ATL-776.

### Display case

- Object: the tablets of the law Moses brings down from Sinai; the name calls them the tablets of the covenant, an agreement with terms, which ties them to the terms the learner accepts.
- Engraving: Johann Sadeler (I) after Crispijn van den Broeck, _Moses with the tablets of the law_, print 13 of 39 of the series _Personen uit het Oude Testament_ (Antwerp, 1575), Rijksmuseum RP-P-OB-5451, CC0, Commons `Mozes met de tafelen der wet, RP-P-OB-5451.jpg` (3834 × 5040 px), the inside of the border, variant `sadeler-moses-inner` in `tools/exhibit-art/manifest.json`; the other crops stay as alternatives. In the background are Moses on Sinai and the Israelites worshipping the golden calf.
- Credit: Johann Sadeler według Crispijna van den Broecka, „Mojżesz z tablicami prawa”, 1575.
- Exhibit code: `covenant_tablets`.
- Name "Tablice przymierza".
- The story of the object: "Johann Sadeler wyrył w 1575 roku według Crispijna van den Broecka Mojżesza z tablicami prawa, a w tle Izraelitów tańczących wokół złotego cielca."
- The hint while hidden: "Ignorantia iuris nocet, lectio certa prodest." The legal maxim "ignorance of the law harms" is followed by the words of Seneca, _Epistulae morales_ 45.1: "lectio certa prodest, varia delectat", "a fixed course of reading does good, a varied one entertains" ([text of the letter](https://romanletters.org/letters/seneca/45/)). It is the only hint in Latin.
- What it was awarded for: "Za przeczytanie tego, co wszyscy tylko akceptują."
- The room of the display case: Krypta, fourth, after "Mucha Giotta" ([ADR-0228](0228-group-the-exhibits-of-the-display-case-into-rooms.md)).
- The curiosity of its tier:

| Tier | Curiosity                                                                                                                                                                                                                                                                                         | Source                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1    | Mojżesz w dawnej sztuce europejskiej często ma na głowie rogi. Zwyczaj ten zaczął się w XII wieku od złego odczytania Księgi Wyjścia (34,30): hebrajskie słowo oznaczające promienie światła, bijące od twarzy Mojżesza schodzącego z Synaju, przetłumaczono tak, jakby jego twarz była „rogata”. | [V&A, "Moses", stained glass panel](https://collections.vam.ac.uk/item/O179050/moses-panel-unknown/) |

Sadeler's Moses has the horns too, so the curiosity is about the work itself, and a story of a text read wrongly suits a reward for reading to the end. Sources disagree on whether Jerome mistranslated the word or chose it, so the curiosity names neither Jerome nor the Vulgate and keeps to what the V&A page states.

### Consequences

- Good: the exhibit rewards patience with a text nobody reads, and the name, the hint and the curiosity all play on reading carefully.
- Good: the legal texts stay as they are, so no learner has to accept them again.
- Bad: the hint is in Latin, which not every learner reads; the owner accepted it for the tone of a museum.
- Bad: a find that depends on time and on the page being visible is harder to test than a click.

## More information

Designed in ATL-776; the build, with the minimum time and which documents count, is ATL-783. The WebP images go to `apps/web/static/exhibits/covenant_tablets/` with `exhibit-art publish --only covenant_tablets` once the exhibit exists in the app and the database.
