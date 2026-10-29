# 0158. Add values straight from the card index

- Status: accepted
- Date: 2026-10-29

## Context and problem statement

A value (a material, an author, a place, a period, a style or a value of an own list) is created only by typing it into the artwork form, and places also in the visit form. R-9 says there is no separate place to manage values, and [ADR-0104](0104-let-the-learner-define-own-artwork-fields.md) says a value of an own list that no artwork uses drops out of the suggestions. A learner who wants to prepare an author, a place or a lecture list before adding artworks cannot. Can values be added in the card index, and what happens to a value no artwork uses yet?

## Decision drivers

- Preparing values belongs to the card index, where they are described and put in order.
- A value added there is useful at once: it is suggested in the artwork form.
- The rules against duplicates (R-25) and against suggesting what is only in the trash (R-23) stay.

## Considered options

- Keep creating values only in the artwork form
- Add values in the card index with the same form as editing them, and suggest unused values

## Decision outcome

Chosen by the owner, with the whole scope: add values in the card index.

- The tabs "Materiały", "Autorzy" and "Miejsca" have "Dodaj materiał", "Dodaj autora" and "Dodaj miejsce"; the tab "Okresy i style" has "Dodaj okres" and "Dodaj styl". Each opens `/atelier/values/<kind>/new`, the edit form of the kind with its details (an author's years of life, sort name and portrait; a place's country and type; a period's eras; a style's periods), titled "Nowy autor" and so on. A name that matches a value of the kind is refused with "Masz już …"; the saved value opens its page with "Dodano … „…”.".
- A list of an own field has "Dodaj wartość", a small dialog with "Nazwa" only.
- `used_category_values` also returns the values no artwork uses yet, so they are suggested in the artwork form; values used only by artworks in the trash are still left out.
- R-9 no longer says that there is no separate place to manage values; this replaces the point of ADR-0104 that a value no artwork uses drops out of the suggestions.

### Consequences

- Good: values can be prepared before the artworks, with all their details.
- Bad: a value added by mistake stays in the suggestions until it is deleted in the card index (an own list value cannot be deleted yet, only renamed or merged).

## More information

- Issue ATL-376.
