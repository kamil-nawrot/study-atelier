# 0339. Give figures life years, a country and a portrait and share the image stage

- Status: accepted
- Date: 2026-11-22

## Context and problem statement

A figure of the glossary ([ADR-0338](0338-keep-figures-on-a-tab-of-their-own-in-the-glossary.md)) was a term with another set of categories: the same form, the same labels and no data about the person. The owner asked for the form of a figure to speak about a person, for the life years, the country and a portrait the card index gives its authors, and for the forms of an author and a figure to show their portrait on the stage of the artwork form ([ADR-0337](0337-show-the-artwork-image-on-a-stage-in-the-artwork-form.md)). Three small faults of the glossary came with it: the name and the category of a list row were not centred on one line, the hints under an image were 14 px instead of 12 px, and the lines between the attributes of a figure in a symbol view were as strong as the lines between sections ([ATL-843](https://linear.app/kamil-nawrot/issue/ATL-843)).

## Decision drivers

- A figure is a person, so its form says "Znana również jako" and "Notka biograficzna", not "Synonimy" and "Definicja".
- Authors and figures keep the same data about a life, entered by the same fields.
- Every form with an image looks and behaves like the artwork form.

## Considered options

- Storage: columns on `glossary_entries` with the columns of `author_details`; a table of its own for the details of a figure.
- Forms: copy the stage into the author and the figure forms; one shared layout component.

## Decision outcome

Chosen options: columns on `glossary_entries` and one shared layout component.

- `glossary_entries` gets `birth_year`, `death_year`, `years_approximate`, `country` and the image columns of `author_details` (`source_wikidata_id`, `source_image_*`, `own_image_path`, `own_image_url`, `image_width`, `image_height`) with the same checks. Only a figure writes them; a term leaves them empty. `unused_images()` keeps the uploads of figures, and the data transfer remaps their paths.
- The form of a figure has the fields "Lata życia" and "Kraj" with the components and hints of the author form, and a portrait with the same texts as an author's. Its labels and hints are written for a person (`m.glossary.form.figure`); the form of a term keeps its own.
- `StagedFormColumns` (`shared/forms`) is the layout of the artwork form, now shared: the stage on the left half, sticky under the top bar, the form on the right half. The artwork form, the author form and the figure form use it; the other forms of the card index keep their single column.
- The page of a figure shows its portrait at the left, from 768 px, and the life years and the country under the name, as the page of an author does.
- `ImageField` always renders the row for its slots, so the stage keeps the same rows with or without thumbnails; the hints under an image are 12 px (the `caption` class of their rows no longer enlarges them) and centred with their icons.
- The name and the category of a glossary row are centred on one line, and the lines between the attributes of a figure use the colour of tags, as the lines between entries of the list do ([ADR-0338](0338-keep-figures-on-a-tab-of-their-own-in-the-glossary.md)).

### Consequences

- Good: a figure holds what a learner wants to know about a person, and the portrait makes the glossary page and the form of a figure resemble those of an author.
- Good: one layout for every form with an image.
- Bad: a person can now be an author and a figure with the data entered twice; the warning of the figure form about an author of the card index stays.

## More information

- Requirement R-329.
- The category "Pozostałe" for figures that fit none of the six is not decided and not part of this change.
