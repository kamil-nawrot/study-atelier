# 0301. Ask about relations in the review

- Status: accepted
- Date: 2026-11-15

## Context and problem statement

Typed relations between artworks and between authors ([ADR-0259](0259-relate-artworks-and-authors-with-typed-relations.md)) are shown on both cards and nowhere else; review questions on them were left as an idea for later ([ATL-683](https://linear.app/kamil-nawrot/issue/ATL-683)). How should the review ask about a relation, and how often?

## Decision drivers

- A relation the learner recorded is knowledge worth recalling: which painting a study prepares, who taught an artist.
- No new setting and no new table: relations are few, and the question needs no schedule.
- The question fits the other extra questions (glossary, symbols, notes, pairs).

## Considered options

- Answers: four text answers (titles or names); image tiles of artworks.
- Which relations: every type; every type but the catch-all `related`; only directed types.
- How often: one per 20 places of the round, one or two; a setting like the symbol questions.
- Saving: nothing saved; a log entry and a schedule per relation.

## Decision outcome

Chosen by Claude without the owner, to be reviewed with the scope of 0.24 (assumptions in `0.24-zalozenia.md` in the project files):

1. **The question.** The stage shows one end of a relation and the question asks for the other, in the words of its type seen from the shown end, for example "Do jakiego dzieła powstało to studium lub projekt?" or "Kto był nauczycielem?". An artwork relation shows the artwork with "Dzieło: …"; an author relation shows an artwork of that author drawn at random with "Autor: …". Either end can be asked. Changed with the owner on 2026-11-15 (ATL-781): the heading carries the title of the artwork shown, in italics and in the nominative ("Częścią jakiego dzieła jest _…_?", "Które dzieło jest częścią dzieła _…_?"), with no line under it; author questions point at the artwork shown ("Kto był nauczycielem autora tego dzieła?").
2. **Answers.** Four text answers: the right title or name and three others drawn at random from the atelier, never the shown record or any record related to it, with no two equal labels. A relation without three such answers, or without an artwork with an image to show, is not asked.
3. **Types.** Every artwork type but the catch-all `related`, whose question would say nothing. Among authors only pupil and teacher, since influence, collaboration and family are too vague to quiz (owner, 2026-11-15, ATL-781).
4. **How often.** One relation question per 20 places of a round, at least one and at most two, among the extra questions, in every form and scope, while relations exist. A relation is asked once per session; a wrong answer brings it back later like the other extra questions.
5. **Saving.** Nothing is logged and no card is kept; a right first answer gives 1 point of the museum career like the other extra questions. Free rounds ask relation questions and save nothing.
6. **Summary.** A line "Poprawnie wskazane powiązania:" with "x/y" counts the first answer of each relation.

### Consequences

- Good: relations the learner recorded come back in the review without any new setting.
- Good: no migration; the browser reads the two relation tables once per session.
- Bad: no schedule, so a well known relation is asked as often as a new one.
- Bad: text answers name artworks by title only; two artworks with the same title never stand side by side, but the learner may not tell a distractor by its title.

## More information

- ATL-683, requirement R-311.
