# Documentation

This folder is the single source of truth for what study-atelier is, how it is built, and why.
It is maintained alongside the code: a change that alters behaviour, architecture or a rule updates the docs in the same pull request.

| Folder                         | Contents                                                                                                                                        | Style                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| [product/](product/)           | Vision, requirements, glossary, voice and tone                                                                                                  | Explanation and reference |
| [architecture/](architecture/) | System description following a lightweight [arc42](https://arc42.org) outline, with [C4](https://c4model.com) diagrams                          | Explanation               |
| [decisions/](decisions/)       | Architecture Decision Records in [MADR](https://adr.github.io/madr/) format, covering business and technical decisions                          | Reference                 |
| [guidelines/](guidelines/)     | Rules for working in this repository, for humans and Claude                                                                                     | Reference and how-to      |
| [data-model/](data-model/)     | The database modelled from the app's queries: access patterns, conceptual model, current and target schema in DBML, coverage with cost and loss | Reference                 |

The split between tutorials, how-to guides, reference and explanation follows [Diátaxis](https://diataxis.fr).
