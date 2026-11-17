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

These rules are proposals until the owner accepts the model. Decisions D1, D2, D3 and D4 of [coverage.yaml](coverage.yaml) are taken. The model was reviewed on 2026-10-31 by two rounds of four independent reviewers; the findings that change the design are folded into the files.

- A view reads what it shows. A pattern with scope `one` or `few` takes the narrowing parameter (id, number, phrase) to the database; only a pattern with scope `all` reads a whole table.
- What a tooltip shows may load on hover, when it is one row read by id with no filtering in the app.
- A relation a view reads in reverse ("what points at this") is stored as rows when its source can be read exactly, like the links of a note (M1). A relation computed by a matching rule, like term mentions, is filtered in the database by its phrases (Q2) until that grows slow.
- A new view or write adds its pattern to step 1 in the same pull request, and a schema change regenerates `current.dbml` with `pnpm data-model`.
- A change of the model goes through step 4 before an ADR: the patterns it serves, its cost, its losses and the alternatives.

## Producing current.dbml

`pnpm data-model` writes `current.dbml` from [`tools/data-model/generate-dbml.mjs`](../../tools/data-model/generate-dbml.mjs). It reads the catalog of a database the migrations were applied to (the local Supabase after `pnpm db:start`, or `--url <postgres url>`): columns, defaults, primary and unique keys, foreign keys, indexes, Row Level Security, and the values a `check` allows on a column. A partial index keeps its condition in a note. DBML has no place for checks that span columns, policies, triggers or functions; those stay in the migrations.

A sentence a catalog cannot give, such as who writes a table, sits in [`tools/data-model/table-notes.json`](../../tools/data-model/table-notes.json) and is added to the note of that table.

The `Migrations` workflow replays the migrations on a local Supabase and runs `pnpm data-model --check`, so a pull request that changes the schema without the regenerated file fails. Both DBML files parse with `@dbml/cli` (`dbml2sql --postgres`), and the SQL of `target.dbml` applies on top of the migrations.

Decision: [ADR-0165](../decisions/0165-model-the-database-from-the-app-access-patterns.md). Context: spike [ATL-403](https://linear.app/kamil-nawrot/issue/ATL-403).
