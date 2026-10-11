# Requirements

Requirements for the first version (MVP) of study-atelier, gathered with the owner.
Identifiers (`R-n`) are stable so that issues and pull requests can refer to them.

## Goal of the first version

The MVP is the simplest useful form of the [atelier](glossary.md): a personal store of artworks that is quick to fill in and easy to search.
Entering an artwork is itself part of learning, so the learner writes the data in their own words and adds to an entry as their knowledge grows.

## Main scenario

1. While reading a book or watching a lecture, the learner meets an artwork and wants to add it.
2. They enter what they know at that moment: at least the title and the author. Adding an artwork takes no more than 2-3 minutes.
3. Over the following weeks they return to the entry and add periods, styles, materials and notes as they learn more.
4. Later they find artworks again in the collection by searching and filtering.

## Artworks

| ID | Requirement |
| --- | --- |
| R-1 | The learner can add, view, edit and delete an artwork. |
| R-23 | Deleting an artwork moves it to the trash. From the trash the learner can restore it or delete it permanently. Artworks in the trash are hidden from the collection and from suggestions. |
| R-2 | Every artwork gets a record number shown as `#0001`, `#0002`, ... in order of creation. A number is never reused: a permanently deleted artwork leaves a gap, and a restored one keeps its number. |
| R-3 | An artwork has the fields listed in [Artwork fields](#artwork-fields). |
| R-4 | Only the title and the author are required. Instead of an author, the learner can mark the author as unknown. |
| R-5 | The set of fields and categories is fixed in code for the MVP, and the data model makes adding a new field or category a small code change. |
| R-6 | The learner writes every value in their own words. The app never forces a particular spelling and never overwrites what the learner entered. |

### Artwork fields

| Field | Kind | Notes |
| --- | --- | --- |
| Image | one image | See [Images](#images). |
| Title | text | Required. |
| Authors | one or more values | Required unless marked unknown. More than one author is possible, for example in architecture. |
| Date of creation | year with an "approximate" flag | Years before the common era must be possible. |
| Type | single choice from a fixed list | Architecture, painting, sculpture, applied arts, ... |
| Period | one or more values | |
| Style | one or more values | |
| Material | one or more values | |
| Location | text | Where the artwork is now. |
| Notes | long text | The learner's own notes. |

## Category values

| ID | Requirement |
| --- | --- |
| R-7 | Authors, period, style, material and location are [category values](glossary.md): when filling them in, the app suggests values the learner has already used in other artworks. |
| R-8 | The same value used in several artworks is one value, so artworks can be grouped and filtered by it (for example all works by one author). |
| R-9 | A new value is created by typing it, but never by accident: while typing, a value that does not exist yet is clearly marked as new (for example "(new)"), and it is created only when the learner explicitly picks that option. There is no separate place to manage values in the MVP. |

## Images

| ID | Requirement |
| --- | --- |
| R-10 | Each artwork has at most one image in the MVP. |
| R-11 | The image search is started from the image field: its "Find image" button becomes available once the title and the author (or "author unknown") are filled in. Only then does the app search the [image source](glossary.md) and show a short list of candidate artworks, each with a thumbnail, title, author and date. Nothing is searched while the learner is typing. |
| R-12 | The learner picks the matching candidate, or "none of these". Picking a candidate links the artwork to that item in the image source and uses its image. |
| R-13 | After a candidate is picked, the app shows the title and author from the image source next to the learner's own values for comparison, without changing them. |
| R-14 | When no candidate matches or the source has no free image, the artwork shows an empty image placeholder with an easy way to add the learner's own image. |
| R-15 | The learner can replace the image at any time with their own image ([image override](glossary.md)), uploaded as a file or given as a URL. |
| R-16 | Images from the image source are shown with their licence and attribution ([ADR-0007](../decisions/0007-images-from-open-sources.md)). |

## Browsing and search

| ID | Requirement |
| --- | --- |
| R-17 | The collection is shown as a list of cards, each with the image, title, authors, date and record number. |
| R-18 | The learner can search the collection by text. |
| R-19 | The learner can filter the collection by several fields at once: type, authors, period, style, material, location. |

## General

| ID | Requirement |
| --- | --- |
| R-20 | The app has a responsive layout that works well on a phone as well as on a larger screen. |
| R-21 | The interface is in Polish. Texts are kept in a simple i18n setup so that more languages can be added later. |
| R-22 | Each learner sees and changes only their own atelier. |

## Not in the MVP

Ideas for later versions are collected in Linear as issues with the `idea` label and no milestone, not in this file. The main ones so far:

- Learning modes such as flashcards or quizzes.
- Pages for people, places, periods or styles with their own content.
- More than one image per artwork.
- Taking a photo directly in the app.
- Categories defined by the learner in the app.
