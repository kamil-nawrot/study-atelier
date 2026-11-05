# 0189. Scope own fields to artwork types and give them pages

- Status: accepted
- Date: 2026-11-05

## Context and problem statement

Own fields ([ADR-0104](0104-let-the-learner-define-own-artwork-fields.md)) apply to every artwork, so a field like "Porządek architektoniczny" is offered for a painting too. The tab "Własne pola" lists the fields as sections with their list values under a disclosure ([ADR-0108](0108-collapse-own-lists-and-show-their-values-as-tags.md)); once opened, it is hard to tell which values belong to which field, and fields are edited through a menu, unlike every other value. Can a field apply to chosen artwork types, and how should the tab work?

## Decision drivers

- An artwork has one type, and it can be empty.
- No value disappears without the learner confirming it.
- Own fields and their values behave like the other values of the card index.

## Considered options

For the scope: one type per field; any number of types per field.

When an artwork's type changes and a filled field no longer applies: keep the values hidden; delete them after a confirmation.

When a field's types are narrowed: block it while values exist; delete the values of the removed types after a confirmation.

For an artwork without a type: every field; only the fields for all types.

For the tab: sections with a strong top line; master and detail; each field in a framed card; a plain list with a page per field.

For the form: a checkbox that reveals type tiles; type tiles only, none meaning all; type tiles with an extra "Wszystkie" tile.

For the order: arrows in each row; drag and drop; a "Zmień kolejność" mode; order in the field's form.

## Decision outcome

Chosen by the owner in ATL-500.

### Scope

- A field applies to all artwork types (the default) or to one or more chosen types.
- An artwork without a type sees only the fields for all types.
- The artwork form, the artwork view and the "Filtry" panel offer only the fields that apply.
- When the type of an artwork changes and a filled field no longer applies, saving asks first and then deletes that field's values on the artwork.
- When a field's types are narrowed, saving asks first with the number of artworks affected and deletes the field's values only from artworks of the removed types.
- The field form has a checkbox "Tylko dla wybranych typów dzieł"; ticked, it shows the artwork type tiles for several choices.

### Pages

- The tab is a plain list like the other tabs, each field shown with the icons of its types after its name ([ADR-0188](0188-redesign-the-card-index-lists.md)).
- A field opens its own page: the kind line ("Własne pole · Lista, kilka wartości · 4 dzieła"), the name, the description, "Dotyczy dzieł typu" with outlined badges or "Wszystkie typy", and for a list a section "Wartości" with rows and a primary "Dodaj wartość". The field has an edit form like other values; the menu in the list is gone.
- A value of a list field gets a page and an edit form like other values ([ADR-0049](0049-give-every-category-value-a-page-of-its-own.md)), with rename and merge.
- "Zmień kolejność" on the list switches it into a mode with up and down arrows; the order is the order of the fields in the artwork form.

### Consequences

- Good: a field shows only where it makes sense, and values never vanish silently.
- Good: own fields and their values work like every other value, and the values of one field stand on its page.
- Bad: a type change can delete values; the confirmation names them.
- Bad: reordering needs one more click than the arrows in each row.

## More information

Design issue ATL-500, builds ATL-502 (scope) and ATL-503 (pages). The field-to-type links need a new table; the deletes happen in the database in the same transaction as the save.
