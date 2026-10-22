# 0109. Pin details on the artwork image

- Status: accepted
- Date: 2026-10-22

## Context and problem statement

Notes can say that the angel holds a lily, but not where the detail is on the image. The owner chose pins on the artwork image as the theme of 0.9 (idea ATL-110, spike ATL-272): the learner marks a detail on an image and describes it, with a glossary entry ("Słowniczek", [ADR-0074](0074-keep-a-glossary-of-terms-with-definitions-from-wikipedia.md)) or own words. The spike began with an adversarial discussion of whether the idea is worth it and settled the details on an interactive prototype.

Images have no stable identity today ([ADR-0088](0088-up-to-five-images-and-an-automatic-best-match.md)): the main image lives in the columns of `artworks`, the others are rows of `artwork_images` numbered 1 to 4, every save deletes and inserts them again, and "Ustaw jako główne" reorders them. A pin placed on "the second image" would land on another photo after a reorder.

## Decision drivers

- A pin with a glossary entry ties a term to a place on a real artwork ("where is the tympanum?") and can become a review question; a pin with own words is a note tied to a detail.
- A pin stays on its image whatever happens to the order of the images.
- Approximate placement is enough: a pin draws attention to a region.
- Pins never cover the artwork for a learner who only wants to look at it.

## Considered options

Kinds of pins:

1. A glossary entry required, own words optional
2. A glossary entry or own words, or both

Identity of an image:

1. A1: one images table; the main image becomes the row at position 0, every image has an id
2. A2: the main image stays in the columns of `artworks` with a `main_image_id`, and rows of `artwork_images` get ids
3. B: a pin refers to the image's source (Commons file, upload path or link)
4. C: as B, and replacing an image drops its pins

## Decision outcome

Chosen by the owner: a glossary entry or own words, or both, and A1.

- A pin without a glossary entry is fine; it only never appears in the review.
- A1 gives a pin an ordinary foreign key to its image. A2 needs a trigger because a pin would point either at an artwork or at a row; B and C break when an image is replaced or reordered.

### Pins

- A pin belongs to one image of an artwork, at a point given as fractions of the image's width and height (0 to 1), so it keeps its place at any size.
- It has a glossary entry, a text of at most 300 characters, or both. An empty pin cannot be saved ("Wybierz pojęcie albo wpisz opis.").
- An image holds at most 10 pins ("Na jednym obrazie zmieści się 10 pinezek.").
- Removing an image removes its pins. Replacing an image (a new photo in the same slot) keeps its pins where they are; the learner moves them. "Ustaw jako główne" keeps every pin on its image.
- Deleting a glossary entry removes it from its pins, and a pin left without a text is deleted with it. This was proposed with the record and is to be confirmed by the owner.

### Artwork view

- Under the image a switch "Pinezki (n)" shows or hides the pins of the image on the stage; it is missing when the image has no pins. Next to it "Edytuj pinezki".
- A pin is a numbered circle (1 to 10), filled for a pin with a glossary entry and light for a pin with only a text. A tap or a click opens its card: the entry's category, name and definition with "Otwórz w Słowniczku", then the learner's text; a pin without an entry shows its text only.
- Outside the edit mode a tap on the image away from the pins opens the full-screen viewer, as today.
- "Edytuj pinezki" shows the pins and a bar above the image: "Dotknij obrazu, żeby dodać pinezkę. Przeciągnij pinezkę, żeby ją przesunąć." with "Gotowe". A tap on the image places a pin and opens the dialog "Nowa pinezka"; dragging a pin moves it; a tap on a pin opens the dialog "Pinezka".
- The dialog has "Pojęcie ze Słowniczka (opcjonalnie)" (a search over the learner's entries; the chosen one as a tag with a remove button) and "Opis (opcjonalnie)" with a counter of 300, and "Usuń" (only for a saved pin), "Anuluj" and "Zapisz". "Anuluj" on a new pin removes it.
- The exact look of the controls is settled in the app, not in the prototype.

### Słowniczek

- An entry's page has a section "Na dziełach" with the tiles of the artworks whose pins carry the entry, each leading to the artwork with the pins shown. Without such artworks the section is missing.

### Review

- "Co to jest?" is one more quiz mode of an artwork's review card ([ADR-0061](0061-review-the-collection-in-one-mixed-session.md)), next to the title, image and style quizzes, for an artwork with at least one pin that has a glossary entry. It shows the pin's image with that one pin marked and four glossary terms: the right one and three distractors from the same glossary category, then from the other categories when the category has too few. Its answer rates the artwork's card as the other quizzes do.

### Data

- `artwork_images` holds every image of an artwork: it gets an `id`, and its position runs from 0 (the main image) to 4. A migration moves the main image of every artwork from the columns of `artworks` to a row at position 0 and then drops those columns. On production that is 159 main images of 161 artworks, all with their size; the 2 artworks without an image get no row, and the 4 further images keep their positions.
- `save_artwork` takes the ordered images with their ids: an image that has an id is updated and keeps it, a new one is inserted, a missing one is deleted with its pins. Everything that read the main image from `artworks` reads the row at position 0: the wall, the artwork page, the review session and counts, the "no image" filter, the trash, the duplicate check and the clean-up of unused files.
- `artwork_pins`: `id`, `owner_id`, `image_id` (a foreign key with `owner_id` to `artwork_images`, deleted with it), `x` and `y` between 0 and 1, an optional `glossary_entry_id` (a foreign key with `owner_id`), an optional `text` of at most 300 characters, a check that one of them is set, and at most 10 pins per image. Row level security and grants as for the other tables of the learner.
- This replaces the storage of the main image in ADR-0088 ("The main image stays in the image columns of `artworks`"); the rest of that record stands.

### Consequences

- Good: a glossary term gets real examples on the learner's own artworks, and the review gains a question about details.
- Good: images have a stable identity, which later features (captions, the magnifier of ATL-273) can rely on.
- Bad: every place that read the main image from `artworks` changes, and a migration moves existing data.
- Bad: a replaced image keeps pins that may not fit the new photo until the learner moves them.

## More information

- Spike ATL-272 with the discussion and the prototype; idea ATL-110; magnifier spike ATL-273.
