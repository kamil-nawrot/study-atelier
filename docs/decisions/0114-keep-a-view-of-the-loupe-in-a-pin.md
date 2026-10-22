# 0114. Keep a view of the loupe in a pin

- Status: accepted
- Date: 2026-10-22

## Context and problem statement

The loupe ([ADR-0110](0110-look-at-details-through-a-loupe.md), [ADR-0113](0113-switch-the-loupe-on-from-the-corner-of-the-stage.md)) shows a detail up close but keeps nothing: the reflection in the mirror of the Arnolfini Portrait has to be found again on every visit. Pins ([ADR-0109](0109-pin-details-on-the-artwork-image.md), [ADR-0112](0112-edit-pins-in-the-artwork-form.md)) keep a place with a glossary entry or a text, but only as a marker on the whole image. The owner asked for a pin that keeps the enlarged view of the loupe (ATL-280).

## Decision drivers

- One list of pins per image, with the same limit, numbering, Słowniczek and review.
- The learner saves the view where they found the detail, without searching for it again elsewhere.
- A view shows the same part of the image on every screen.

## Considered options

What such a pin is:

1. An ordinary pin with an optional saved enlargement
2. A separate kind of marker, a snapshot of the loupe, without an entry or a text

Where it is made:

1. In the artwork view, by a click while the loupe is on
2. In the artwork form, with a loupe added to the pin editor

The review question "Co to jest?":

1. Unchanged: the whole image with the pin marked
2. The saved view lying on the image where the pin is
3. The saved view alone

## Decision outcome

Chosen by the owner: an ordinary pin with an optional view, made in the artwork view, and the review unchanged.

### Data

- A pin gets an optional view: the part of the image's width that the circle of the loupe covered (`view_width`, more than 0 and at most 1), centred on the pin. It does not store the level, so the same view shows the same part of the image at any size; the level shown is worked out for the size on screen.
- A pin needs a glossary entry, a text or a view. Deleting a glossary entry keeps a pin that still has a text or a view.
- The limit of 10 pins per image, the numbering, "Na dziełach" and "Co to jest?" count pins with a view as any other.

### Making a pin with a view

- In the artwork view a click on the image while the loupe is on opens the dialog "Nowa pinezka" at that point. Above the fields it shows the view in a circle with the caption "Widok lupy (4×)"; the glossary entry and the text stay optional, and "Zapisz" saves the pin at once.
- The artwork view has no other way to change pins: moving, changing and deleting stay in the artwork form (ADR-0112). On a phone, which has no loupe, a pin with a view can be seen but not made.

### Showing it

- The marker is the usual numbered square, filled for a pin with a glossary entry and light otherwise, with a small dot in its corner for a pin with a view.
- Its card in the artwork view shows the view in a circle at the top, 220 px or the width of a phone's screen when that is smaller, with its level, and then the entry and the text as before. Until the large version has loaded the circle shows the image of the page.

### In the artwork form

- The dialog "Pinezka" of a pin with a view shows the view with "Usuń widok". Moving the pin moves the centre of its view. A pin left without an entry, a text and a view cannot be saved ("Wybierz pojęcie albo wpisz opis.").

### Consequences

- Good: the loupe's discoveries are kept, named and found again on any screen, including a phone.
- Good: no new list or marker system next to the pins.
- Bad: a pin with a view cannot be made on a phone.
- Bad: the review does not use the views yet.

## More information

- Issue ATL-280; the card of a pin as a popover is ATL-282.
