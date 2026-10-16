# Requirements

What study-atelier should do, gathered with the owner. This is a living document for the whole app: it grows with each version instead of being replaced.

- Every requirement has an identifier `R-n`. Identifiers are never renumbered or reused, so issues and pull requests can refer to them; a dropped requirement is struck through, not deleted.
- The Version column says in which version a requirement is delivered: `MVP` for the first version, later versions are named when they are planned.
- What is planned for each version is tracked as a milestone in Linear.

## Goal of the first version (MVP)

The MVP is the simplest useful form of the [atelier](glossary.md): a personal store of artworks that is quick to fill in and easy to search.
Entering an artwork is itself part of learning, so the learner writes the data in their own words and adds to an entry as their knowledge grows.

## Main scenario

1. While reading a book or watching a lecture, the learner meets an artwork and wants to add it.
2. They enter what they know at that moment: at least the title and the author. Adding an artwork takes no more than 2-3 minutes.
3. Over the following weeks they return to the entry and add periods, styles, materials and notes as they learn more.
4. Later they find artworks again in the collection by searching and filtering.

## Artworks

| ID | Requirement | Version |
| --- | --- | --- |
| R-1 | The learner can add, view, edit and delete an artwork. | MVP |
| R-30 | The learner adds and edits an artwork in the same form, which shows every field; they can fill in all of them or only the required ones ([ADR-0022](../decisions/0022-add-and-edit-an-artwork-in-one-full-form.md)). | MVP |
| R-31 | When adding, the learner can save the artwork and start the next one straight away. | MVP |
| R-32 | Leaving the form with unsaved changes asks the learner to confirm that the changes are discarded. | MVP |
| R-43 | When the learner saves an artwork whose title and authors match another artwork outside the trash, ignoring letter case, diacritics, whitespace and the order of authors, the app names the matching record and asks to confirm; saving stays possible. When editing, it asks only if the title or the authors changed. Restoring an artwork from the trash asks the same way ([ADR-0039](../decisions/0039-confirm-saving-a-duplicate-artwork.md)). | later |
| R-33 | The learner views an artwork on its own page with its image and every field; a field that is not filled in is shown as empty, so the learner sees what is still missing ([ADR-0026](../decisions/0026-artwork-view-as-a-stage-with-an-information-panel.md)). | MVP |
| R-34 | From the artwork page the learner can open the image full screen. | MVP |
| R-23 | Deleting an artwork moves it to the trash. From the trash the learner can restore it or delete it permanently. Artworks in the trash are hidden from the collection and from suggestions. | MVP |
| R-35 | Moving an artwork to the trash and deleting it permanently each ask the learner to confirm first ([ADR-0028](../decisions/0028-trash-as-a-list-with-confirmed-deletes.md)). | MVP |
| R-36 | The trash lists the deleted artworks, newest first, with the date each was deleted; the learner restores or permanently deletes them one at a time. | MVP |
| R-2 | Every artwork gets a record number shown as `#0001`, `#0002`, ... in order of creation. A number is never reused: a permanently deleted artwork leaves a gap, and a restored one keeps its number. | MVP |
| R-3 | An artwork has the fields listed in [Artwork fields](#artwork-fields). | MVP |
| R-4 | Only the title and the author are required. Instead of an author, the learner can mark the author as unknown. | MVP |
| R-5 | The set of fields and categories is fixed in code for the MVP, and the data model makes adding a new field or category a small code change. | MVP |
| R-6 | The learner writes every value in their own words. The app never forces a particular spelling and never overwrites what the learner entered. | MVP |
| R-37 | The learner formats notes while writing them: bold, italic, headings, bulleted and numbered lists, from a toolbar above the field, without typing Markdown; the artwork page shows the notes formatted ([ADR-0029](../decisions/0029-format-notes-with-a-visual-markdown-editor.md)). | MVP |

### Artwork fields

| Field | Kind | Notes |
| --- | --- | --- |
| Image | one image | See [Images](#images). |
| Title | text | Required. |
| Authors | one or more values | Required unless marked unknown. More than one author is possible, for example in architecture. |
| Date of creation | a year, or a year span from – to, with an "approximate" flag | Years before the common era must be possible, also across the turn of the eras. See R-62. |
| Type | single choice from a fixed list | Architecture, painting, sculpture, applied arts, ... |
| Era | single choice from a fixed list | Six eras with approximate years. See R-44. |
| Period | one value | Belongs to the era. Shown as "Okres". See R-45. |
| Style | one or more values | Belongs to the period. See R-45. |
| Material | one or more values | |
| Location | text | Where the artwork is now. |
| Notes | long text with basic formatting | The learner's own notes. See R-37. |
| Favourite | yes or no | Set with a heart, not in the form. See R-74. |

## Category values

| ID | Requirement | Version |
| --- | --- | --- |
| R-7 | Authors, period, style, material and location are [category values](glossary.md): when filling them in, the app suggests values the learner has already used in other artworks. | MVP |
| R-8 | The same value used in several artworks is one value, so artworks can be grouped and filtered by it (for example all works by one author). | MVP |
| R-9 | A new value is created by typing it, but never by accident: while typing, a value that does not exist yet is clearly marked as new (for example "(new)"), and it is created only when the learner explicitly picks that option. There is no separate place to manage values in the MVP. | MVP |
| R-24 | ~~Period, style and material come with a starting list of common values defined in code (for example main periods, styles and materials of Western art), offered as suggestions before the learner has used any. The learner can still add a value that is not on the list (R-9).~~ Dropped: the learner builds every list ([ADR-0038](../decisions/0038-chain-era-period-and-style.md)). | MVP |
| R-25 | A new value that differs from an existing one only in letter case or diacritics cannot be created; the app offers the existing value instead. When a new value looks like a small typo of an existing one, the app points to the existing value and suggests using it, and the learner can still create the new one. | MVP |
| R-44 | Every artwork can have one [era](glossary.md), chosen from six fixed eras shown with approximate years: prehistoria (do 3000 p.n.e.), starożytność (do 476), średniowiecze (476–1492), nowożytność (1492–1789), nowoczesność (1789–1945), współczesność (od 1945) ([ADR-0038](../decisions/0038-chain-era-period-and-style.md)). | later |
| R-45 | Era, period and style form a chain: the period can be filled in only after the era, and the style only after the period. The period suggests only periods already used with the chosen era, and the style only styles already used with the chosen period. Clearing or changing a level clears the levels below it. | later |
| R-46 | A period or style is one value even when it belongs to several eras or periods (R-8); saving an artwork links its period to its era and each of its styles to its period. | later |
| R-48 | The learner manages their category values in a card index view ("Kartoteka") opened from the menu: periods and styles as a timeline of the six eras, materials, authors and locations as alphabetical lists with a search field above each that filters the list by name and appears from 20 values, each value with the number of artworks that use it, artworks in the trash included ([ADR-0040](../decisions/0040-manage-category-values-in-a-card-index.md)). | later |
| R-49 | The learner renames a value. A new name that matches another value of the same kind (R-25) merges the two after the learner confirms: the artworks and links of the merged value pass to the remaining one, and the merged value is deleted. | later |
| R-50 | The learner adds and removes the eras of a period and the periods of a style. Adding a link changes no artwork. Removing an era from a period moves the artworks that have the period with that era to an era the period keeps, or leaves them without an era, after the learner confirms with the number of artworks. A period can be removed from a style only while no artwork has both. | later |
| R-51 | The learner can delete a value only when no artwork uses it, artworks in the trash included, after confirming. | later |
| R-52 | Every artwork tile on the wall shows the icon of the artwork's era, small and muted. While the wall is ordered by era, the period rail shows the icon only for the current era. | later |
| R-63 | Every category value has a page, opened by clicking it in the card index (era names on the timeline included): the kind and the number of artworks, the name, its parent (the era of a period, the periods of a style), the kind's own fields, the summary and the notes, then the artworks that use it as wall tiles. A page without a summary or notes, and a value no artwork uses, say so ([ADR-0049](../decisions/0049-give-every-category-value-a-page-of-its-own.md)). | 0.4 |
| R-64 | The learner edits a value in a form on its own page with the layout of the artwork form and "Zapisz" in the panel at the bottom: the name (not for an era), the links of R-50, the kind's own fields, a short plain-text summary ("Podsumowanie", at most 300 characters) and Markdown notes ("Notatki"). Renaming, merging and deleting follow R-49 to R-51. Eras, which are not the learner's own values, get a summary and notes too. | 0.4 |
| R-65 | An author has a portrait, found in Wikimedia Commons by the author's name or the learner's own image, and years of life: a year of birth and a year of death, both optional, each with "p.n.e.", and one "ok." for both ([ADR-0050](../decisions/0050-store-value-pages-in-details-tables.md)). | 0.4 |
| R-66 | An author can be given a sort name ("Sortuj jako") after ticking a checkbox; authors are put in A to Z order by it, or by their name when it is not set. | 0.4 |
| R-67 | A location has a country chosen from a fixed list and a type: museum, gallery, private collection or on site. Both are optional. | 0.4 |
| R-68 | In the artwork view a value with a summary shows a card with its kind, parent, name and summary (for an author also the years of life) when the pointer rests on it or it gets focus, and on a phone after a tap. The card has no link; a value without a summary shows nothing. | 0.4 |
| R-69 | Merging two values keeps only the remaining value's summary, fields and notes; the merged value's page content is deleted, and the merge confirmation says so when there is any. Deleting a value deletes its page content. | 0.4 |
| R-70 | In the notes of an artwork or a value, typing `@` (or the `@` toolbar button) and then at least two characters lists the learner's values of every kind, and typing `#` (or the `#` button) and then at least two characters lists their artworks by record number or title; picking one inserts a link that shows the current name and opens the value page or the artwork ([ADR-0053](../decisions/0053-link-values-and-artworks-from-notes.md)). Summaries have no links. | 0.4 |
| R-71 | A link in a note survives renaming the value, and merging two values turns links to the merged value into links to the remaining one. A link to a deleted value, to an artwork deleted for good or to an artwork in the trash shows as plain text, and comes back when the artwork is restored. | 0.4 |
| R-72 | A value page and the artwork view list the notes that link to them ("Wspominasz o tym w notatkach"); the list is left out when nothing links there. | 0.4 |

## Images

| ID | Requirement | Version |
| --- | --- | --- |
| R-10 | Each artwork has at most one image in the MVP. | MVP |
| R-11 | The image search is started from the image field: its "Find image" button becomes available once the title and the author (or "author unknown") are filled in. Only then does the app search the [image source](glossary.md) and show a short list of candidate artworks, each with a thumbnail, title, author and date. Nothing is searched while the learner is typing. | MVP |
| R-12 | The learner picks the matching candidate, or "none of these". Picking a candidate links the artwork to that item in the image source and uses its image. Only candidates that have an image are listed ([ADR-0055](../decisions/0055-list-only-image-candidates-that-have-an-image.md)). | MVP |
| R-13 | After a candidate is picked, the app shows the title and author from the image source next to the learner's own values for comparison, without changing them. | later |
| R-14 | When no candidate matches or the source has no free image, the artwork shows an empty image placeholder with an easy way to add the learner's own image. | MVP |
| R-15 | The learner can replace the image at any time with their own image ([image override](glossary.md)), uploaded as a file or given as a URL. | MVP |
| R-38 | The learner can paste an image straight from the system clipboard as their own image: with a button in the own image dialog, or with Ctrl+V anywhere in the add and edit form, which asks before replacing an image already there ([ADR-0032](../decisions/0032-paste-the-own-image-from-the-clipboard.md)). | MVP |
| R-16 | Images from the image source are shown with their licence and attribution ([ADR-0007](../decisions/0007-images-from-open-sources.md)). | MVP |

## Browsing and search

| ID | Requirement | Version |
| --- | --- | --- |
| R-17 | The collection is shown as a wall of artwork tiles, each with the image, title, authors, date and record number, ordered by default from the most recently added ([ADR-0021](../decisions/0021-collection-view-as-a-wall-of-framed-artworks.md)). | MVP |
| R-18 | ~~The learner can search the collection by title.~~ Replaced by R-59. | MVP |
| R-39 | ~~The learner can order the wall by period instead of from the most recently added. Each artwork belongs to its first period, periods follow each other by their earliest year and artworks follow by year within their period; artworks without a period are not shown in this order ([ADR-0033](../decisions/0033-order-the-wall-by-period-with-a-period-rail.md)).~~ Replaced by R-47. | MVP |
| R-40 | While the wall is ordered by period, the app shows which period the learner is looking at: a [period rail](glossary.md) at the right edge on a wide screen, a strip under the top bar on a narrower screen. | MVP |
| R-41 | The order the learner chose for the wall is remembered on the device. | MVP |
| R-42 | An artwork whose image is at least twice as wide as it is high takes two columns of the wall when the wall has three columns or more ([ADR-0035](../decisions/0035-wide-artworks-span-two-wall-columns.md)). | later |
| R-47 | The learner can order the wall by era instead of from the most recently added. Eras follow their fixed order and artworks follow by year within their era; artworks without an era are not shown in this order. The period rail shows the eras, with bounds taken from the years of their artworks ([ADR-0038](../decisions/0038-chain-era-period-and-style.md)). | later |
| R-19 | ~~The learner can filter the collection by several fields at once: type, authors, era, period, style, material, location.~~ Replaced by R-53. | later |
| R-53 | The learner can filter the wall by every field of an artwork except the notes: era (several at once), type, year (from and to, each with "p.n.e."; an approximate year counts as that year, a year span is kept when it overlaps the range ([ADR-0046](../decisions/0046-enter-the-date-of-creation-as-a-year-span.md)), and artworks without a year are left out while a range is set), authors, period, style, material and location, and by what is missing: no image, no year, no era, no period, no type ("Do uzupełnienia") ([ADR-0042](../decisions/0042-filter-the-collection-in-the-browser.md)). | 0.3 |
| R-54 | Within a field an artwork matches when it has any of the chosen values; it is shown when it matches every field that has a choice. Next to every value is the number of artworks the wall would show with it, counted with the other fields' filters but not its own field's; values with no artworks are hidden and chosen values stay. | 0.3 |
| R-55 | Filters live in a "Filtry" panel: on a larger screen a side panel that changes the wall as soon as a value is chosen, on a phone a full-screen "Widok" dialog with the order and the filters, closed with "Pokaż n dzieł". Fields with many values (authors, location) offer search and the 8 most frequent values with "Pokaż więcej". | 0.3 |
| R-56 | Active filters are shown above the wall as tags with a remove button, followed by "Wyczyść filtry", and the count reads "n z m dzieł". When no artwork matches, the wall says so and offers "Wyczyść filtry". | 0.3 |
| R-57 | The filter is kept in the URL, so it survives a reload, a bookmark and the way back from an artwork, and ends when the learner opens the atelier anew. A value that no longer exists in the URL is ignored. | 0.3 |
| R-58 | The learner can order the wall "Według autorów": blocks per first author, A to Z, by year inside a block, unknown author last; the period rail shows the authors. | 0.3 |
| R-59 | The search in the top bar finds artworks by title or author. | 0.3 |
| R-60 | ~~In the artwork view the era, period, styles, materials, location and authors are links to the wall filtered by that value, and in the card index every value has "Pokaż dzieła (n)" that does the same.~~ Dropped: the wall is filtered from the panel, and the card index is kept for later detail pages of its values ([ADR-0047](../decisions/0047-no-links-from-values-into-a-filtered-wall.md)). | 0.3 |
| R-61 | In the artwork view the learner goes to the previous and next artwork of the filtered and ordered wall with subtle arrows at the edges of the stage, the arrow keys on a larger screen and a horizontal swipe on a phone; the arrow is dimmed at either end of the list. | 0.3 |
| R-62 | The date of creation is either a single year or a [year span](glossary.md) with a start and an end year. A switch "Od – do" above the date inputs sets the mode; each year has its own "p.n.e.", so a year span can cross the turn of the eras, and "ok." marks the whole date as approximate. A start later than the end is rejected, and equal years are saved as a single year. A year span is written `1503–1519`, `450–420 p.n.e.` or `50 p.n.e. – 20 n.e.`, the wall orders it by its end year and the era bounds on the period rail take its whole extent ([ADR-0046](../decisions/0046-enter-the-date-of-creation-as-a-year-span.md)). | 0.3 |
| R-74 | The learner marks an artwork as a favourite with a heart: on its tile on the wall, at the right end of the caption, and in the top bar of the artwork view, before "Edytuj". The heart is an outline when the artwork is not a favourite and filled when it is; each change shows a toast, and a failed save puts the heart back and says so ([ADR-0058](../decisions/0058-mark-artworks-as-favourites-with-a-heart.md)). | 0.4 |
| R-75 | The "Filtry" panel starts with an "Ulubione" tag with the number of favourites; pressed, the wall shows only favourites, together with the other filters, and the tag is kept in the URL and shown among the active filters. The favourite marker is stored with the artwork, is not part of the form and stays through the trash and a restore. | 0.4 |

## Review

| ID | Requirement | Version |
| --- | --- | --- |
| R-76 | The learner reviews the atelier in sessions started from "Powtórki" in the menu, between "Kartoteka" and "Kosz". The menu item shows how many artworks are due today and shows no number when none are ([ADR-0061](../decisions/0061-review-the-collection-in-one-mixed-session.md)). | 0.5 |
| R-77 | The start of a review says how many artworks are due today, how many of them are new and about how long it takes. The learner chooses what to review ("Co powtarzamy?": the whole collection, favourites, a style, a period or the wall's filters) and in what form ("W jakiej formie?": "Mieszane", "Fiszki" or "Quizy"). A side panel shows per era how many artworks the learner remembers for longer than a week, and the artworks that were hard lately. | 0.5 |
| R-78 | A session takes the artworks due today, the most overdue first, then new artworks up to 10 a day, and has at most 20 artworks. Neighbours differ in era where possible, and an artwork the learner did not know comes back later in the same session. In a mixed session new and forgotten artworks get a quiz and known ones a flashcard. | 0.5 |
| R-79 | A flashcard shows the image and asks the learner to recall the title, author, time and style. Revealing it shows the title, authors, year, period, style, place and the learner's note, and the learner rates it "Nie wiem", "Prawie" or "Wiem", each with when the artwork comes back. | 0.5 |
| R-80 | A quiz asks one of: which of four images has a given title, which of four titles belongs to an image, or which of four styles an image is in. The other answers come from the same scope of the learner's collection and are as close to the right one as the collection allows (same style, author, period, type, era, time or place); the answer is shown at once, with why a wrong pick was close. | 0.5 |
| R-81 | Until the answer is revealed, nothing on the screen names the artwork: no image credit, record number, title as alternative text or address. Artworks without an image, in the trash or with the same title as the answer are never offered as wrong answers. | 0.5 |
| R-82 | A session starts only when the chosen scope has at least 20 artworks with an image; otherwise the start says how many more are needed. A quiz of a kind is asked only when four sensible answers exist; otherwise the artwork gets a flashcard. | 0.5 |
| R-83 | When the next review of an artwork is due follows from the learner's ratings and quiz answers with the FSRS algorithm: a right quiz answer counts as "Prawie" and a wrong one as "Nie wiem", in every form of session. Every answer is saved as it is given, so leaving a session loses nothing, and the state follows the learner to any device ([ADR-0062](../decisions/0062-schedule-reviews-with-fsrs.md)). | 0.5 |
| R-84 | A session ends with a summary: how many artworks were reviewed and in how long, how many are due tomorrow, the artworks grouped as "Do poprawki", "Prawie" and "Opanowane", and another round when more is due. The keyboard drives the whole session (Space, 1 to 4, Enter), and on a phone the actions sit at the bottom of the screen. | 0.5 |

## Account

| ID | Requirement | Version |
| --- | --- | --- |
| R-26 | A learner creates an account with an email address and a password. The account becomes active after the learner confirms the email address through a link sent by email. Signing up with an address that already has an account says so and leads to sign-in or to setting a new password. | MVP |
| R-27 | The learner signs in with their email address and password and stays signed in on that device until they sign out. | MVP |
| R-28 | A learner who forgot their password can set a new one through a link sent by email. | MVP |
| R-29 | A visitor who is not signed in first sees a short start page that says what the app is for and leads to sign-in and sign-up. A signed-in learner goes straight to their atelier. | MVP |

## General

| ID | Requirement | Version |
| --- | --- | --- |
| R-20 | The app has a responsive layout that works well on a phone as well as on a larger screen. | MVP |
| R-21 | The interface is in Polish. Texts are kept in a simple i18n setup so that more languages can be added later. | MVP |
| R-22 | Each learner sees and changes only their own atelier. | MVP |
| R-73 | The app is dark by default. The learner switches to the light theme and back from the menu, between the trash and signing out; the choice is remembered on the device. In the light theme the passe-partout of the wall is a card lighter than the wall, and the stage behind a featured artwork stays dark ([ADR-0054](../decisions/0054-switch-to-the-light-theme-from-the-menu.md)). | 0.4 |

## Not in the MVP

Ideas for later versions are collected in Linear as issues with the `idea` label and no milestone, not in this file. The main ones so far:

- Pages for people, places, periods or styles with their own content.
- More than one image per artwork.
- Taking a photo directly in the app.
- Categories defined by the learner in the app.
