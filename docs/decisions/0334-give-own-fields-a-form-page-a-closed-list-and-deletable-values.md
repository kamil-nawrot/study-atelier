# 0334. Give own fields a form page, a closed list and deletable values

- Status: accepted
- Date: 2026-11-20

## Context and problem statement

Every record of Kartoteka is added and edited on a page of its own, except an own field, which still opens a dialog ([ADR-0104](0104-let-the-learner-define-own-artwork-fields.md), [ADR-0189](0189-scope-own-fields-to-artwork-types-and-give-them-pages.md)). The values of an own list are created by typing in the artwork form, so a typo or a variant name adds a new value that the learner did not intend; the owner asked for a way to close the list to the values set in Kartoteka. A value of an own list cannot be deleted at all, while a built-in value can when no artwork uses it. The owner asked for all three in [ATL-828](https://linear.app/kamil-nawrot/issue/ATL-828).

## Decision drivers

- An own field is edited like the other records of Kartoteka.
- A closed list never loses or changes values already on artworks.
- Deleting a value never removes it from artworks silently ([ADR-0028](0028-trash-as-a-list-with-confirmed-deletes.md) prefers a confirmation and the narrower scope).
- The artwork form explains why a typed value cannot be added, only when it matters.

## Considered options

Layout of the form:

- One column like the forms of eras, periods and authors.
- Two columns on a larger screen, the artwork types on the right.
- One column with a preview of the field as the artwork form shows it.

Where the list is closed:

- A checkbox in the form of the field, saved with the form.
- A switch in the header "Wartości" of the field page that saves at once.

Deleting a value that artworks use:

- As a built-in value: only a value without artworks; otherwise the action is disabled with a hint to merge.
- Always, with a confirmation that names the number of artworks it is removed from.

The artwork form for a closed list when the typed text matches nothing:

- A muted row in the suggestion list.
- A permanent hint under the field.

## Decision outcome

Chosen by the owner on 2026-11-19 and 2026-11-20:

- **Form page.** The form of an own field is a page in one column, with the fields and their order of the former dialog and "Anuluj" with "Dodaj" or "Zapisz" in `FormActions`, at `/atelier/fields/new` ("Nowe pole") and `/atelier/fields/[id]/edit` ("Edytuj pole „Motywy”"). It asks before leaving with unsaved changes like the other forms. "Dodaj pole" in the tab "Własne pola" and "Edytuj" on the field page navigate to it; after saving, the learner lands on the field page with the toast of today's dialog. The confirmation of narrowing the artwork types stays as it is.
- **Closed list.** A list field has the checkbox "Tylko wartości z Kartoteki" with the hint "W formularzu dzieła wybierzesz tylko spośród wartości, które już są na liście. Nowe dodasz na stronie pola w Kartotece.", under "Dzieło może mieć kilka wartości" in a new field and under the description when editing. It is stored in `artwork_fields.closed` (boolean, default false, only for a list). Closing or opening a list changes no value and no artwork. The overline of the field page reads "Lista, kilka wartości, zamknięta" for a closed list.
- **Artwork form.** A closed list offers no "Dodaj „…”"; the existing values, the similar value and the full list on an empty query stay as today. When the typed text matches no value, the suggestion list shows one muted row "Nie ma „akt” na liście. Nowe wartości dodasz w Kartotece." (`ValueField` takes `emptyText`). Values are still added in Kartoteka with "Dodaj wartość" on the field page. The rule is kept in the form only: the learner's own client is the only writer of their values, and `save_artwork` creates values for every category in one statement.
- **Deleting a value.** The page of an own value has "Usuń" like a built-in value. It works only for a value no artwork uses, after the confirmation "Usunąć wartość „pejzaż”?" with "Żadne dzieło jej nie używa, więc zniknie z listy pola „Motywy”."; the toast is "Usunięto „pejzaż”.". For a used value "Usuń" is disabled with the hint "Ta wartość ma jeszcze 3 dzieła, więc nie da się jej usunąć. Możesz ją połączyć z inną: w edycji zmień jej nazwę na nazwę tamtej." (renaming to an existing name already merges own values).

### Consequences

- Good: all records of Kartoteka are edited the same way, and a closed list keeps the names of the learner's own classification consistent.
- Good: export and import carry the new column without changes, since both copy every column of `artwork_fields`.
- Bad: a closed list is enforced by the app, not by the database; a request made by hand can still add a value.
- Bad: a used value can be removed only through merging, which takes a rename.

## More information

- Linear: ATL-828 (design), ATL-838 (build). Requirement R-324. Changes R-124, R-126 and the dialog of [ADR-0189](0189-scope-own-fields-to-artwork-types-and-give-them-pages.md).
- Mockups: `/mnt/project-files/atl-828/` (layout, lock, closed, texts).
