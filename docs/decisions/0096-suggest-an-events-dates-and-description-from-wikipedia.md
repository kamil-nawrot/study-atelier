# 0096. Suggest an event's dates and description from Wikipedia, quietly

- Status: accepted
- Date: 2026-10-21

## Context and problem statement

The learner adds historical events to the timeline by hand ([ADR-0093](0093-show-the-collection-and-historical-events-on-a-timeline.md)). The glossary already suggests a definition from Polish Wikipedia ([ADR-0074](0074-keep-a-glossary-of-terms-with-definitions-from-wikipedia.md)). ATL-231 settled how the event form suggests dates and a description. The owner expects many suggestions to miss, so they must not get in the way.

A check on real data showed that Wikidata's own search misses common Polish names: "odsiecz wiedeńska" finds paintings, not the battle. Polish Wikipedia's search finds "Bitwa pod Wiedniem" at once. The article's Wikidata item had dates for nearly every sample event, from the Peloponnesian War to the Napoleonic Wars.

## Decision drivers

- Work as the glossary does, so the two forms behave alike.
- A miss costs nothing: no message, no waiting text.
- Never replace what the learner wrote.

## Decision outcome

Chosen by the owner (ATL-231):

- **Search.** Polish Wikipedia, as in the glossary, leaving out disambiguation pages. The first article whose Wikidata item has dates wins. At most 5 articles are offered.
- **Dates** come from the item:
  - start and end time (P580, P582) give "Od – do";
  - otherwise the point in time (P585), or a lone start or end, gives "Rok";
  - a period that starts and ends in the same year gives one year;
  - a negative year is "p.n.e.";
  - "ok." is set when a date is less precise than a year or when there are several different dates, and the earliest of them is taken;
  - preferred statements win and deprecated ones are left out.
- **Description**: the first sentence of the article, as in the glossary, shortened to 300 characters.
- **When.** After a pause in typing the name, while the dates are empty or still the suggested ones, or the description is empty or still the suggested text. Each part is filled only when it is replaceable. When nothing is found, a suggestion still in the form is taken back. An event opened for editing has its own dates, so it does not search by itself.
- **Quiet until a match.** The form says nothing about Wikipedia before a match: no hint, no "Szukam…" and no message when nothing is found or the request fails. After a match, the line "Na podstawie: Wikipedia, „…”, CC BY-SA 4.0" stands under the description with "Wybierz inny artykuł" and "Usuń źródło", as in the glossary.
- **Another article.** The glossary's article dialog lists the articles with their dates. Choosing one fills the dates and the description. When the learner has changed either, the form first asks "Zastąpić Twoje daty i opis?".
- **Source.** The article's title, address, licence and the day it was fetched are saved with the event, as in the glossary. The event card shows the same source line, with links to the article and the licence.

### Consequences

- Good: a learner who types a known event gets its dates and a short description with no extra step.
- Good: a miss leaves the form exactly as it would be without the feature.
- Bad: a wrong match fills the dates silently, and the learner has to notice it; the source line is the only hint.
- Bad: four more columns on `timeline_events`.

## More information

- Supersedes nothing; it settles the suggestions planned in [ADR-0093](0093-show-the-collection-and-historical-events-on-a-timeline.md).
- Issue: ATL-231, milestone 0.7.
