# 0102. Name the wall's address parameters in English

- Status: accepted
- Date: 2026-10-21

## Context and problem statement

The wall keeps its filter and its grouping in the address ([ADR-0042](0042-filter-the-collection-in-the-browser.md), [ADR-0085](0085-group-the-wall-by-era-period-and-style.md)) under Polish names: `epoka`, `typ`, `rok`, `autor`, `bez-autora`, `okres`, `styl`, `material`, `miejsce`, `braki`, `ulubione` and `grupuj=epoka|okres|styl`. Everything else in the code is English, and the owner wants the parameters to match (ATL-155).

## Decision drivers

- One language in the code and its interface to the browser.
- A saved link never breaks the page.

## Decision outcome

Chosen by the owner (ATL-155):

- The parameters are `era`, `type`, `year`, `author`, `unknown-author`, `period`, `style`, `material`, `location`, `missing` and `favourites`. The grouping is `group=era|period|style`.
- No redirect and no reading of the old names: a link saved with them opens the wall without those filters.
- An unknown parameter, or an unknown or malformed value of a known one, is ignored, and the wall opens with whatever is valid.

### Consequences

- Good: the address uses the same English names as the code.
- Bad: links and bookmarks saved before this release lose their filters and grouping.

## More information

- Changes the parameter names of [ADR-0042](0042-filter-the-collection-in-the-browser.md) and [ADR-0085](0085-group-the-wall-by-era-period-and-style.md); the rest of both stands.
- Issue: ATL-155, milestone 0.7.1.
