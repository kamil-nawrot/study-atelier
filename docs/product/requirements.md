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
| R-43 | When the learner saves an artwork whose title and authors match another artwork outside the trash, ignoring letter case, diacritics, whitespace and the order of authors, the app names the matching record and asks to confirm; saving stays possible. When editing, it asks only if the title or the authors changed ([ADR-0039](../decisions/0039-confirm-saving-a-duplicate-artwork.md)). | later |
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
| Date of creation | year with an "approximate" flag | Years before the common era must be possible. |
| Type | single choice from a fixed list | Architecture, painting, sculpture, applied arts, ... |
| Era | single choice from a fixed list | Six eras with approximate years. See R-44. |
| Period | one value | Belongs to the era. Shown as "Okres". See R-45. |
| Style | one or more values | Belongs to the period. See R-45. |
| Material | one or more values | |
| Location | text | Where the artwork is now. |
| Notes | long text with basic formatting | The learner's own notes. See R-37. |

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

## Images

| ID | Requirement | Version |
| --- | --- | --- |
| R-10 | Each artwork has at most one image in the MVP. | MVP |
| R-11 | The image search is started from the image field: its "Find image" button becomes available once the title and the author (or "author unknown") are filled in. Only then does the app search the [image source](glossary.md) and show a short list of candidate artworks, each with a thumbnail, title, author and date. Nothing is searched while the learner is typing. | MVP |
| R-12 | The learner picks the matching candidate, or "none of these". Picking a candidate links the artwork to that item in the image source and uses its image. A candidate without a free image stays in the list, says so, and cannot be picked. | MVP |
| R-13 | After a candidate is picked, the app shows the title and author from the image source next to the learner's own values for comparison, without changing them. | later |
| R-14 | When no candidate matches or the source has no free image, the artwork shows an empty image placeholder with an easy way to add the learner's own image. | MVP |
| R-15 | The learner can replace the image at any time with their own image ([image override](glossary.md)), uploaded as a file or given as a URL. | MVP |
| R-38 | The learner can paste an image straight from the system clipboard as their own image: with a button in the own image dialog, or with Ctrl+V anywhere in the add and edit form, which asks before replacing an image already there ([ADR-0032](../decisions/0032-paste-the-own-image-from-the-clipboard.md)). | MVP |
| R-16 | Images from the image source are shown with their licence and attribution ([ADR-0007](../decisions/0007-images-from-open-sources.md)). | MVP |

## Browsing and search

| ID | Requirement | Version |
| --- | --- | --- |
| R-17 | The collection is shown as a wall of artwork tiles, each with the image, title, authors, date and record number, ordered by default from the most recently added ([ADR-0021](../decisions/0021-collection-view-as-a-wall-of-framed-artworks.md)). | MVP |
| R-18 | The learner can search the collection by title. | MVP |
| R-39 | ~~The learner can order the wall by period instead of from the most recently added. Each artwork belongs to its first period, periods follow each other by their earliest year and artworks follow by year within their period; artworks without a period are not shown in this order ([ADR-0033](../decisions/0033-order-the-wall-by-period-with-a-period-rail.md)).~~ Replaced by R-47. | MVP |
| R-40 | While the wall is ordered by period, the app shows which period the learner is looking at: a [period rail](glossary.md) at the right edge on a wide screen, a strip under the top bar on a narrower screen. | MVP |
| R-41 | The order the learner chose for the wall is remembered on the device. | MVP |
| R-42 | An artwork whose image is at least twice as wide as it is high takes two columns of the wall when the wall has three columns or more ([ADR-0035](../decisions/0035-wide-artworks-span-two-wall-columns.md)). | later |
| R-47 | The learner can order the wall by era instead of from the most recently added. Eras follow their fixed order and artworks follow by year within their era; artworks without an era are not shown in this order. The period rail shows the eras, with bounds taken from the years of their artworks ([ADR-0038](../decisions/0038-chain-era-period-and-style.md)). | later |
| R-19 | The learner can filter the collection by several fields at once: type, authors, era, period, style, material, location. | later |

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

## Not in the MVP

Ideas for later versions are collected in Linear as issues with the `idea` label and no milestone, not in this file. The main ones so far:

- Learning modes such as flashcards or quizzes.
- Pages for people, places, periods or styles with their own content.
- More than one image per artwork.
- Taking a photo directly in the app.
- Categories defined by the learner in the app.
