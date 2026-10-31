# Data model

The database is modelled from the queries the app makes, not from the tables it has. Four steps, each a file that a pull request can review as text:

| Step | File                                         | What it holds                                                                                       |
| ---- | -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1    | [access-patterns.yaml](access-patterns.yaml) | every view and write: what it shows, the data it needs, how narrow (`one`, `few`, `all`), how often |
| 2    | [conceptual.md](conceptual.md)               | the entities and relations behind the patterns, as a Mermaid ER diagram                             |
| 3    | [current.dbml](current.dbml)                 | the schema as the migrations build it, in [DBML](https://dbml.dbdiagram.io/docs)                    |
| 3    | [target.dbml](target.dbml)                   | the schema the model proposes; `diff current.dbml target.dbml` is the change                        |
| 4    | [coverage.yaml](coverage.yaml)               | how each pattern is served before and after, and for each change its cost and what it gives up      |

## Proposed rules

These rules are proposals until the owner accepts the model. Decision D1 of [coverage.yaml](coverage.yaml) is taken; D2 to D4 are open. The model was reviewed by four independent reviewers on 2026-10-31 and their findings are folded into the files.

- A view reads what it shows. A pattern with scope `one` or `few` takes the narrowing parameter (id, number, phrase) to the database; only a pattern with scope `all` reads a whole table.
- What a tooltip shows may load on hover, when it is one row read by id with no filtering in the app.
- A relation a view reads in reverse ("what points at this") is stored as rows when its source can be read exactly, like the links of a note (M1). A relation computed by a matching rule, like term mentions, is filtered in the database by its phrases (Q2) until that grows slow.
- A new view or write adds its pattern to step 1 in the same pull request, and a schema change updates `current.dbml`.
- A change of the model goes through step 4 before an ADR: the patterns it serves, its cost, its losses and the alternatives.

## Producing current.dbml

`current.dbml` was generated once on 2026-10-30 from the migrations up to `20261030140000_compute_the_streak_once_a_day.sql`, applied to an empty Postgres 16 with the Supabase stubs (roles, `auth`, `storage`), by reading the catalog: columns, defaults, primary and unique keys, foreign keys, indexes and Row Level Security. A partial index keeps its condition in a note. DBML has no place for checks, policies, triggers or functions; those stay in the migrations.

The generator is not committed yet, so the file cannot be regenerated from the repository; decision D2 proposes committing it with a check in CI. Both DBML files parse with `@dbml/cli` (`dbml2sql --postgres`), and the SQL of `target.dbml` applies on top of the migrations.

Decision: [ADR-0165](../decisions/0165-model-the-database-from-the-app-access-patterns.md). Context: spike [ATL-403](https://linear.app/kamil-nawrot/issue/ATL-403).
