# 0040. Manage category values in a card index view

- Status: accepted
- Date: 2026-10-13

## Context and problem statement

Since [ADR-0038](0038-chain-era-period-and-style.md) the learner builds every list of [category values](../product/glossary.md) alone: there are no starting lists, a period belongs to the eras of the artworks that use it, and a style to their periods. Values are only ever created while filling in an artwork (R-9). Typos, duplicates ("gotyk" and "gotyk międzynarodowy" meant as one) and wrong links (a period linked to the wrong era by one mistyped artwork) can only be fixed artwork by artwork. Where and how should the learner rename, merge, re-link and delete values?

## Decision drivers

- The lists are the learner's own map of art history; the view should show that map, not a list of records.
- Changes that touch many artworks happen only after the learner confirms them, and never by a stray click ([ADR-0028](0028-trash-as-a-list-with-confirmed-deletes.md)).
- No data the learner entered is lost by tidying up.
- Reuse the library (`Dialog`, `ValueField`, `Tag`) instead of new components where possible.

## Considered options

Which lists the view covers:

1. Periods (with eras), styles and materials
2. Every category value: also authors and locations
3. Only periods and styles

Layout of periods and styles:

1. A tree: the six eras one under another, their periods under them, the styles of a period under the period
2. Flat alphabetical lists in tabs, with the parents of each value as tags
3. Columns: era, period, style side by side, one column at a time on a phone

Look of the tree: period cards, a timeline, or a band per era.

How the learner edits a value: a "…" menu with one dialog per action, one dialog for the whole value, or a panel that opens in place.

How two values are merged: by renaming a value to the name of another, or with a separate "merge with" field.

When a value can be deleted: only when no artwork uses it, also when used (it is removed from the artworks), or never (unused values disappear by themselves).

Where the view is opened from: only the menu, or the menu and the artwork form.

What happens to artworks when a period is moved to another era: they follow the period, or a link that an artwork uses cannot be removed.

## Decision outcome

Chosen: a card index view ("Kartoteka") of every category value, with periods and styles as a timeline of the six eras, one dialog per value, merging by renaming, deleting only unused values, opened from the menu, and artworks following a period moved to another era.

### The view

- **Entry.** A new menu item "Kartoteka" under "Atelier", with the Lucide icon `list-tree`. The artwork form does not link to it.
- **Tabs.** "Okresy i style", "Materiały", "Autorzy", "Miejsca". Materials, authors and locations are alphabetical lists in the same look as the periods: the name large, the number of artworks after it.
- **Timeline.** "Okresy i style" shows the six eras in their fixed order along a vertical line. Each era is a filled square with its icon from ADR-0038, its name in the title font (Newsreader italic) and its years. Under an era are its periods, each a large name with its number of artworks; under a period are its styles as tags, each with its own number of artworks. A period linked to several eras appears under each of them, and a style under each of its periods. An era without periods says "W tej epoce nie ma jeszcze okresów.". After the eras come the groups "Okresy bez epoki" and "Style bez okresu", shown only when they are not empty.
- **Counts.** The number of artworks counts artworks in the trash too, so a value that a restored artwork needs is never shown as unused.

### The value dialog

- Clicking a period's name, a style tag, or a material, author or location opens one library `Dialog` (default size, so full screen on a phone) titled with the value's name, with its kind and number of artworks as the description ("Styl · 1 dzieło").
- Fields: "Nazwa" for every value; "Epoki" for a period and "Okresy" for a style, each as tags with a remove button and an add control that offers only existing eras or periods.
- Footer: "Usuń" (danger) on the left, "Anuluj" and "Zapisz" on the right. Nothing changes until "Zapisz".

### Rename and merge

- A new name follows R-25: a name that matches another value of the same kind, ignoring letter case and diacritics, is that value. Changing only the letter case or the diacritics of the value itself is a rename.
- When the name matches another value, a hint under the field says so ("Masz już styl „gotyk” (3 dzieła). Zapisz, a połączę je w jeden.") and the primary button reads "Połącz".
- Merging asks first in a small `Dialog` ("Połączyć z „gotyk”?") whose description says what changes: how many artworks get the other value and which links it gains. It cannot be undone.
- A merge moves every use to the remaining value: artworks that had the merged value get the remaining one (an artwork that had both keeps one), and the merged value's links (eras of a period, periods of a style, styles of a period) are added to the remaining value's. The merged value is then deleted. The view confirms with a toast ("Połączono z „gotyk”.").

### Links

- Adding an era to a period, or a period to a style, only adds a link, so the value is suggested there too (R-45). It changes no artwork.
- Removing an era from a period, which is how a period moves to another era, also moves the artworks: every artwork with that period and that era gets an era the period has after the save. Before saving, a small `Dialog` names the number of those artworks and their new era; when the period has several eras left, it lets the learner pick one, and when it has none, it says the artworks lose their era. Their period and styles stay.
- Removing a period from a style is possible only while no artwork has that style together with that period, because an artwork cannot lose its period through a style. Otherwise the remove button is disabled and says why.

### Delete

- "Usuń" is enabled only for a value that no artwork uses, trash included. For a used value it is disabled, with the reason under it: "Ten styl ma jeszcze 1 dzieło, więc nie da się go usunąć. Możesz go połączyć z innym stylem.".
- Deleting asks first in a small `Dialog` and removes the value with its links.

### Texts

The texts are conversational, as in [voice and tone](../product/voice-and-tone.md): the hint says what will happen and what the learner can do. The view and the menu item are named "Kartoteka".

### Consequences

- Good: the learner sees and tidies their own map of eras, periods and styles in one place, which is the theme of version 0.2.
- Good: one dialog for every kind of value and every change; merging needs no extra control, because it follows from naming two values the same.
- Good: nothing used by an artwork disappears without the learner seeing how many artworks change.
- Bad: a merge cannot be undone; two values merged by mistake can only be split by editing the artworks again.
- Bad: moving a period changes the era of artworks, which the learner may not expect when the link came from a single mistyped artwork; the confirmation with the number of artworks is the only guard.
- Bad: new database functions are needed, since a merge and a move must change artworks, values and links in one transaction.

## More information

- Design issue ATL-95; build issue ATL-97. Requirements R-48 to R-51.
- Mockups of the chosen options are kept with the project files under `atl-95/`.
- Work for ATL-97 in the database: a function that merges two values of one kind atomically (artwork values, links, then delete); a function that removes an era from a period and moves the affected artworks; deletes on `period_eras` and `style_periods` limited by the rules above; and a query for the number of artworks per value, trash included. The links from [ADR-0038](0038-chain-era-period-and-style.md) stay as they are; saving an artwork keeps adding them.
