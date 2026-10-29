# 0108. Collapse own lists in Kartoteka and show their values as tags

- Status: accepted
- Date: 2026-10-22

## Context and problem statement

After trying own fields ([ADR-0104](0104-let-the-learner-define-own-artwork-fields.md)) the owner found three things hard to use (ATL-268): a list field with many values makes the "Własne pola" tab of Kartoteka long, the sections of different fields run together, and in the artwork view the values of a list read as one line of text, unlike the other values.

## Decision drivers

- Own fields look like the built-in ones wherever both appear.
- A tab with several list fields can be browsed field by field.

## Decision outcome

Asked for by the owner; the label "Wartości" and the closed start are Claude's proposal, to be checked in the app:

- **Kartoteka.** The values of a list field sit in a `Disclosure` "Wartości" with their number, closed at first. A list without values still says so. A hairline across the content divides the sections of the fields.
- **Artwork view.** The values of a list field are tags, as the period, style, material and place are; they have no summary card, as own values have no page. A text and a ticked field stay plain text.
- This replaces "list values separated by commas" of ADR-0104; the rest of it stands.

### Consequences

- Good: a long list no longer hides the fields below it, and own fields read like the built-in ones in the artwork view.
- Bad: one more click before the values of a list in Kartoteka.

## More information

- Issue ATL-268; requirements R-127 and R-128.
