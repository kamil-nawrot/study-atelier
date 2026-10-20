# 0085. Group the wall by era, period and style, apart from the order and the filters

- Status: accepted
- Date: 2026-10-19

## Context and problem statement

The wall can be ordered "Według epok", which puts the artworks in one block per era with the period rail beside them ([ADR-0033](0033-order-the-wall-by-period-with-a-period-rail.md), [ADR-0038](0038-chain-era-period-and-style.md)), but the blocks run into each other in the masonry columns and nothing names them on the wall. The owner wants to see the collection laid out the way the subject is taught: a heading per era with its own wall, and inside it the periods and the styles, without hiding anything, while search and the filters keep working. How should the wall be grouped, and how does grouping fit with the order and the filters (ATL-211)?

An era is a single value from a fixed list, a period a single value of the learner's own and a style any number of values, each period under an era and each style under a period. The owner's collection has 102 artworks in two eras, six periods and 23 styles; 9 artworks have two styles, and every artwork has an era and a period.

## Decision drivers

- Grouping shows the structure of the subject; it changes only how the wall is laid out, never which artworks are on it.
- Filters, search and the order keep working with and without grouping.
- Every artwork stays reachable: nothing drops out because a value is missing.
- No database change: the wall already has the era, period and styles of every artwork in the browser ([ADR-0042](0042-filter-the-collection-in-the-browser.md)).
- The top bar stays within the width of the wall.

## Considered options

Relation to "Według epok":

- grouping replaces the order by era, which becomes an order by date of creation;
- grouping sits beside the order by era;
- grouping combines with it.

Artworks with several styles: in every style group, only under the first style, or in a combined group. Artworks without an era, period or style: a "Bez …" group at the end of their parent, or left out as in the order by era.

Order of periods and styles: alphabetical, or chronological by the earliest year of their artworks.

The control:

- a select in the top bar;
- a section in the filter panel;
- step buttons under the page title;
- a button in the top bar that opens the steps in a popover.

Where the choice is kept: on the device like the order, or in the URL like the filter. What the rail shows while grouping: always the eras, the second level of grouping, or the deepest level.

## Decision outcome

Chosen by the owner, after a prototype on the wall:

### Grouping and the order

- The learner groups the wall in steps: by era, by era and period, or by era, period and style. Each group has a heading with its count and its own wall from a new line; a period is nested in its era and a style in its period. Groups without artworks are left out.
- Grouping applies to the wall after the filters and the search, and the count above the wall counts every artwork once.
- "Według epok" is gone. In its place the order "Według daty powstania" puts the whole wall by year, a year span by its end, artworks without a year last; a remembered "Według epok" becomes this order. With grouping, every group follows the chosen order inside: by date it is the former order by era with headings, by author it is A to Z without author blocks.
- Eras follow their fixed order. Periods and styles follow the earliest year of their artworks, then their name; groups without a year come after the dated ones. Alphabetical order was dropped after the owner's data showed that it puts the Neolithic before the Palaeolithic and Etruria before Egypt.
- An artwork with several styles stands in each of its style groups. "Bez epoki" comes last on the wall, "Bez okresu" last in its era and "Bez stylu" last in its period; because period needs an era and style needs a period, "Bez epoki" and "Bez okresu" have no groups inside.
- The choice is kept in the URL (`?grupuj=epoka`, `okres` or `styl`) with the filter, so it survives a reload and the way back from an artwork.

### On the wall

- Era headings are section titles (`h2`) with the era's icon, period headings subsection titles (`h3`) and style headings a new minor title (`h4`), muted, with an outlined count. A hairline in `--color-tag` divides the eras.
- Every group is a disclosure, open at first, as in the review summary ([ADR-0083](0083-collapse-the-review-summary-groups.md)). "Zwiń wszystkie" collapses every group at every level and "Rozwiń wszystkie" opens them again; it stands next to the count while grouping. Which groups are collapsed survives the way back from an artwork.
- While grouping, the period rail and strip show the eras, measured from the section headings. Grouping by period or style keeps the eras on the rail.
- The wall still draws its tiles 60 at a time ([ADR-0044](0044-load-wall-images-near-the-screen.md)), with one budget for all groups, and a collapsed group draws nothing.
- Previous and next in the artwork view ([ADR-0048](0048-flip-through-the-wall-from-the-artwork-view.md)) follow the groups; a repeated artwork counts once, where it first appears, collapsed groups included.

### The control

- On a larger screen a button between the search field and the order opens a popover with the steps "Epoka › Okres › Styl" as large tiles under "Grupuj". A tile turns grouping on down to its level and presses every tile above it; the pressed deepest tile turns its level off ("Kliknij jeszcze raz najniższy poziom, żeby go wyłączyć."). The wall changes at once and the popover stays open until a click outside or Escape.
- The closed button shows three short lines set as steps, the chosen levels bright, and a tooltip names them: "Grupowanie: epoka › okres" or "Grupowanie: wyłączone".
- To make room, "Filtry" and "Dodaj dzieło" are icons with tooltips, "Filtry" filled while a filter is on, and the search field narrows. The controls of the top bar line up with both edges of the wall.
- On a phone the steps sit in the "Widok" dialog under the order.
- A select with stepped options and the steps under the title were tried in the prototype and turned down: the first did not look right, the second put the control out of the top bar.
- The popover (`PopupButton`), the steps (`StepSelect`), the collapsible group (`Disclosure`, also used by the review summary) and an underlined text button (`TextButton`, also used by "Wyczyść filtry") are library components. The popover is a `button` with a `div` of role `dialog`, not a native control.
- Tooltips now open on hover and on keyboard focus only, so a clicked button does not keep its tooltip, and stay hidden while the button's panel is open.

### Consequences

- Good: the learner sees the collection as eras, periods and styles, with how many artworks each has, and can collapse it to an outline.
- Good: filters, search and the order work inside the groups, and nothing drops out of the wall for a missing value.
- Good: no database change.
- Bad: groups of one or two artworks leave much empty space in four columns; the owner's collection has eight styles with one artwork.
- Bad: the counts of style groups can add up to more than the count above the wall.
- Bad: an artwork reached from its second style group gets the neighbours of its first group in the artwork view.
- Bad: "Filtry" and "Dodaj dzieło" lose their visible labels on a larger screen.

## More information

- Supersedes the order by era of [ADR-0033](0033-order-the-wall-by-period-with-a-period-rail.md) and [ADR-0038](0038-chain-era-period-and-style.md); the rail and strip of ADR-0033 stay.
- Spike and prototype: ATL-211. The owner's tree of eras, periods and styles was checked with a read-only query before the order was chosen.
