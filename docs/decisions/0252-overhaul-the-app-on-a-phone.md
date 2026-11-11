# 0252. Overhaul the app on a phone

- Status: accepted
- Date: 2026-11-11

## Context and problem statement

On a phone (below 768 px) the app worked but was uncomfortable. The menu sat behind a burger in the top left corner, every wall tile filled the screen, the lead of each view took about a fifth of the first screen, the top bar carried heavy bordered buttons with a red "Usuń" in reach, a quiz hid its fourth answer under the bar, the order question was taller than the screen, the boxed tabs cut their names and the timeline wrote event names sideways. The app had no web manifest, so it opened in a browser tab.

The owner asked for a comprehensive overhaul in 0.22 without removing any function. The focus is browsing what the learner already has, adding artworks (in a museum) and reviews (on the way); the card index and the settings only have to work well. How should each part look and behave on a phone?

## Decision drivers

- The thumb reaches the bottom of the screen; the top left corner is the farthest place.
- One bar at the bottom at a time: the keyboard and a task leave no room for two.
- Every task can be left, and the navigation cannot be used to leave a task by accident.
- A control in a fixed place means one thing.
- The first screen of a view shows its content, not its explanation.
- Nothing is cut that the learner needs to recognise an artwork.
- The computer keeps what works there.

## Considered options

- Navigation: a bottom bar with five places; the drawer kept with a floating menu button; only a lighter top bar.
- Adding: an add button that always adds an artwork; one that adds what the current module holds; a sheet with every kind; a floating action button over a bar of four places.
- The wall: two columns by default with a switch; two columns only; three densities with a contact sheet without captions.
- The tile caption in two columns: the authors, the date and the heart on one line; the authors on their own line; the heart moved onto the image; no date.
- The order question: shorter rows; a 2×2 grid tapped from the oldest; one row of four like the computer.
- The gap in a note: a smaller stage with the quote scrolling inside; one card turned between the note and the artwork.
- Leads: dropped while a view has content; cut to one line with "więcej"; behind an information icon.
- Tabs: unboxed tabs that scroll; a list of sections as the first screen.
- The timeline: compact controls and event names beside the reading line; a horizontal timeline that scrolls sideways.
- Installing: a web manifest only; a manifest with a service worker for working offline.

## Decision outcome

The owner's choices in the spike [ATL-639](https://linear.app/kamil-nawrot/issue/ATL-639/spike-overhaul-the-app-on-a-phone), tried on mockups of the real app. "Phone" is below 768 px; what is not named here stays as it is, and the computer keeps its layout unless a point says otherwise.

### Navigation and tasks

- A bottom bar with five places: Atelier, Słowniczek, Dodaj, Powtórki, Menu. Powtórki shows the number due today. The labels under the icons are settled when it is built.
- Menu opens a sheet with Kartoteka, Kalendarium, Kronika, Wystawy, Ekspozycja, Archiwum, the avatar with the rank (the settings), "Zgłoś uwagę", the theme and signing out. It does not repeat the bar. The career mark of the burger moves to the Menu icon. The burger and the drawer go away on a phone.
- Dodaj opens a sheet with four tiles in a fixed order: Dzieło, Pojęcie, Wizyta, Wydarzenie. The tile of the current module is highlighted and a tap opens its form at once. There is no exhibition tile, because a phone cannot add an exhibition ([ADR-0238](0238-hide-adding-an-exhibition-on-a-phone.md)). The add buttons leave the top bars of the wall, Słowniczek, Kronika and Kalendarium; the card index keeps its own.
- There is one bar at the bottom. In a task (a form, a running review, the exhibition editor and the whole settings view) its actions replace the navigation, and every task has a visible way out ("Anuluj", "Przerwij" or the back arrow). An action of a browsing view, such as "Zacznij powtórkę", may stand above the navigation.
- Toasts and other elements at the bottom stand above the bar, and the bars respect the safe areas of the screen.

### Top bar

- On a phone its actions are icons without a border in a 48 px touch area. A switched-on state, such as filters in use, is a small square in `--color-highlight` in the corner of the icon; the heart stays filled or outlined.
- A detail view (artwork, glossary entry, exhibition, value, visit, event) keeps its frequent actions as icons and puts the rare ones ("Porównaj", "Usuń") in a "⋯" menu, which stands above the controls of the stage.
- The computer keeps the bordered buttons.

### Wall

- Two columns by default; "Widok" switches between one and two columns, kept on the device.
- In two columns the caption holds the title at 16 px in up to two lines, the authors in one line, and the date with the heart under them. A cut title is read in full in the artwork view.
- Wide artworks do not span two columns on a phone, and captions keep their natural height. Spanning from three columns ([ADR-0035](0035-wide-artworks-span-two-wall-columns.md)) is still not built ([ATL-84](https://linear.app/kamil-nawrot/issue/ATL-84/build-wide-artworks-spanning-two-wall-columns)).
- The artwork count stays: it opens Statystyki and says how many artworks a filter shows.

### Artwork view and images

- The stage keeps its fixed height ([ADR-0111](0111-fixed-height-first-screen-of-an-artwork-on-a-phone.md)) minus the bottom bar, so the record number, the title and the authors with the date stay on the first screen and the arrows to the neighbouring artworks stay in place.
- The full-screen view of an image gets pinch zoom and pan, and a double tap zooms in or out, for touch (`pointer: coarse`) at any width; the loupe stays for a mouse. A swipe moves to the next image only while the image is not zoomed. It is tried in a prototype on a phone first.
- The artwork view, the review flashcard and the artwork blocks of an exhibition open this view; in an exhibition a tap on the image opens it.

### Artwork form

- On a phone the form starts with "Tytuł" and "Autorzy", then the images: the title and the authors are what a museum label gives, and they start the automatic image match. The empty image frame is low and grows when an image is found or added.
- The type and era tiles are tighter.
- The three buttons stay, "Zapisz" the widest.
- Not taken: the era suggested from the year, and the later fields folded under "Więcej szczegółów".

### Reviews

- A quiz shows its four answers in a 2×2 grid without the key numbers, titles up to three lines; "Gdzie jest…?" also drops its numbers. "Następne" stays disabled until the answer.
- "Odkryj kartę" and the ratings are pinned to the bottom of the screen in one place.
- The order question is a 2×2 grid in which the learner taps the artworks from the oldest. A tapped artwork gets its number; a tap on a numbered artwork removes its number and the later numbers move down. "Sprawdź kolejność" is enabled when all four have numbers. The question and its hint stand above the artworks, and the tiles shrink with the screen height so a 667 px phone fits. Dragging stays on a computer.
- The year question gets "−" and "+" beside the large year, one year per tap and faster while held, on a phone and on a computer, so an exact year needs neither a keyboard nor a steady finger.
- A typed title: while the field is focused, the stage collapses to a low strip with a thumbnail, and the suggestions use the room above the keyboard. Tried on a phone.
- A gap in a note is one card on a phone: the note by default, with a button in the corner that turns it to the artwork, as in exhibitions. It returns to the note after the answer and grows with the text, so nothing scrolls inside it. The computer keeps the stage and the panel.

### Słowniczek

- The search and the order in one row, the order as an icon that opens the native list; the categories in one row that scrolls sideways.
- A denser list with a smaller letter that sticks under the top bar.
- The letter index follows a finger that slides along it, with a large letter beside the finger; a tap still works.

### View headers

- On a phone a view with content shows no lead and no counts, and its header with the hairline goes away. An empty module still explains itself with its empty state ([ADR-0130](0130-show-empty-views-in-one-centred-pattern.md)).
- Exceptions: the wall count (above) and the lead of Ekspozycja, which has no empty state.
- The filter button of Kalendarium moves to the top bar.

### Kartoteka and Ustawienia

- Tabs without the box, in a row from edge to edge that scrolls sideways, the selected tab marked by a thick line; the panel without a frame. The computer keeps the boxed tabs.
- The card index tools in one row: the search, the order as an icon and one add button, which offers Okres or Styl on "Okresy i style".
- The avatar of the profile stays as it is.

### Kalendarium

- The era strip shows the name of the chosen era in a wider tile; the large era name and the row of arrows to the neighbouring eras go away.
- The event band shows only the shapes of the events, without the names written sideways, and is narrower.
- The events running in the year of the reading line stand beside it, horizontally: at most two names, then "+n". The label never blocks a tap on an artwork dot.

### Wystawy

- The list stays in one column; there are not many exhibitions.
- An artwork image of an exhibition is at most the screen height under the top bar.

### Installing

- A web manifest with the name, icons of 192 and 512 px (also maskable), `display: standalone`, background and theme colours and `/atelier` as the start; `viewport-fit=cover` with safe-area insets; a `theme-color` that follows the theme switch of the app.
- Working offline is left for a spike of its own.

### Consequences

- Good: the modules a learner uses on the way are one tap away at the bottom, and adding an artwork is two taps from anywhere.
- Good: the first screens show content: about four wall tiles instead of one, four glossary entries instead of one and a half, and about 200 px more for the timeline.
- Good: every quiz and the order question fit one screen, and an exact year can be set with a finger or a mouse.
- Good: installed on the home screen, the app runs without the address bar.
- Bad: a phone and a computer differ more: the add sheet, the order by tapping, the turned note card and the quiet top bar exist only on a phone, and each needs its own tests.
- Bad: a learner who has added a first entry on a phone no longer sees the lead that explains the module.
- Bad: a title longer than two lines is cut on a two-column wall, and a panorama is low there.
- Bad: in standalone mode there is no browser back, so every view that is not a module must keep its back arrow.

## More information

- Spike with the mockups: [ATL-639](https://linear.app/kamil-nawrot/issue/ATL-639/spike-overhaul-the-app-on-a-phone). Builds: ATL-640 to ATL-646 and ATL-650 to ATL-657; the check on a real phone is ATL-658.
- The UI texts (the bar labels, the add sheet, the "⋯" items, the hint of the order question) are agreed with the owner before each build.
- Supersedes for a phone: the menu icon in the top bar of [ADR-0021](0021-collection-view-as-a-wall-of-framed-artworks.md); the full caption of [ADR-0035](0035-wide-artworks-span-two-wall-columns.md); the event names written vertically of [ADR-0093](0093-show-the-collection-and-historical-events-on-a-timeline.md) and the era name under the strip of [ADR-0242](0242-polish-the-era-strip-axis-and-event-names-of-kalendarium.md); the stage height of [ADR-0111](0111-fixed-height-first-screen-of-an-artwork-on-a-phone.md), now minus the bottom bar; the column with grips of the order question in [ADR-0178](0178-ask-for-the-year-and-the-chronological-order-in-the-review.md); the stage and panel of the gap in a note in [ADR-0182](0182-ask-for-a-term-from-the-own-note-and-a-title-typed-from-memory.md); the glossary tools and letter spacing of [ADR-0192](0192-refresh-the-glossary-list-and-show-the-fragments-of-a-term.md); "Porównaj" as an icon in the top bar of [ADR-0203](0203-show-the-palette-on-the-stage-and-compare-two-artworks-side-by-side.md); and the lead under the name of the view in [ADR-0243](0243-name-the-view-in-the-top-bar.md). It adds the year buttons to [ADR-0178](0178-ask-for-the-year-and-the-chronological-order-in-the-review.md) on every screen.
