---
name: study-atelier-exhibit-design
description: Design an exhibit of "Ekspozycja" with the owner (engraving, crop, name, texts, curiosities, tiers) and record it in the design issue, an ADR and a build issue. Use when the owner asks to design an exhibit or starts a "Design the … exhibit" issue.
---

# study-atelier exhibit design

Use this for an issue titled "Design the … exhibit" (made from an idea issue), or when the owner asks for a new exhibit of the display case. The design settles the look and the texts; the counting is built later in its own issue. The owner makes every choice: Claude prepares the candidates, checks the facts and records the outcome.

Before starting, read from `develop`:

- `docs/product/voice-and-tone.md`, sections "Curiosities" (the source rules, the naming rule, the hint rule and the table of themes).
- [ADR-0185](../../../docs/decisions/0185-name-each-exhibit-after-what-its-engraving-shows.md) and the two newest exhibit ADRs (`grep -l exhibit docs/decisions/*.md`), whose shape the new ADR follows.
- `tools/exhibit-art/README.md` (the manifest fields and the commands) and the `app` map of `tools/exhibit-art/manifest.json`, to see which engravers and motifs the case already shows.
- The design issue, its idea issue and their comments.

Talk to the owner in Polish; everything written to the repository and Linear is in English, except the Polish texts of the exhibit. Ask one question per message.

## 1. Start

- Check that no other session works on the issue (its status, `git branch -r`, open pull requests), then set it In Progress and assign it.
- Work in the main checkout unless another session uses it: a branch `feature/atl-<n>-design-the-…` from `develop`.

## 2. Candidates

Propose two or three objects with their engravings, each in a few lines: what the engraving shows, why the motif fits what the exhibit counts, and its weak points (a motif or engraver the case already has, an object that is only a small detail, a scene that does not read as an object or a place). Recommend one.

Finding engravings on Wikimedia Commons:

- Send one API request at a time with a pause of 2–3 s and a `User-Agent`; bursts get HTTP 429.
- Search files with `list=search&srnamespace=6`; for a known illustrated book, search categories (`srnamespace=14`) and list them with `list=categorymembers`, which is faster than searching plate by plate.
- Check several files in one `prop=imageinfo&iiprop=size|extmetadata&titles=A|B|…` request: keep only `Public domain` or `CC0`, and prefer scans over 2500 px on the short side.
- For previews ask `iiurlwidth` only at a standard width (960, 1280); other widths also get 429.
- Museum prints (Rijksmuseum, NGA, Met, Cleveland) are CC0 and well dated; book illustrations are often split across many small scans, so look for the large one. A series of prints is often in the Rijksmuseum under one object number with a running suffix (`RP-P-2004-73-<n>`).
- An engraving that is not on Commons, or only as a poor scan, can come straight from a museum whose image is in the public domain (for example the Staatliche Museen zu Berlin mark their photos with the Public Domain Mark): give `source_url` and `source_page` in the manifest instead of `commons_file`. The owner may find such a page; check its licence statement before using it.
- When the owner likes a candidate but doubts how it works as an exhibit, render it (step 3) before deciding; a page full of text or a small print on a large album sheet shows its weakness only at 400 × 520.

Download the originals of every candidate into `tmp/mockups/atl-<n>/` (ignored by git) before asking, with file names that say which candidate they are (`A-…`, `B1-…`), look at them yourself, and give the Windows path (`\\wsl.localhost\Ubuntu\home\kamil\projects\study-atelier\tmp\mockups\atl-<n>`). Record the candidates in a comment on the issue as soon as the owner picks one, so the others stay for later exhibits.

## 3. Crops

- Add two or three variants of the chosen engraving to `manifest.json` under a provisional exhibit code (`snake_case`, after the object), with `status` `alternative`, the Commons file, the licence, an English credit and the `crop` as fractions of the source.
- The crop must be close to 10:13 in pixels of the source: `(x1 - x0) * width / ((y1 - y0) * height) ≈ 0.77`. Work the fractions out from the full size of the file, not the preview.
- Edit the manifest with a script that loads and dumps it (`json.dumps(…, indent=2, ensure_ascii=False)`), never with Prettier: the file is not Prettier-formatted, and `pnpm format` would rewrite all of it.
- Render with `exhibit-art build --fetch --only <code> --out tmp/mockups/atl-<n>` (from `tools/exhibit-art`, with its virtual environment) and look at `platinum.png` of each variant yourself before showing them: a hidden or single-tier exhibit is seen in platinum once found, a tiered one in every metal.
- Show the variants with one line each and a recommendation. Once the owner picks one, set it `chosen`, the others `alternative` or `rejected`, and map the code to it in `app`.

## 4. Facts

For a tiered exhibit, settle the structure first, in one table: what it counts, the thresholds against the owner's data, the code, the name, the counter label, the story and the credit, and the theme of the curiosities. Research the curiosities only once the owner accepts it, since a theme the owner finds too narrow changes all of them.

- Date and author of the engraving from a museum or library catalogue page (or the Commons file's institution); say "około" when the catalogues disagree.
- Each curiosity follows `voice-and-tone.md`: one page of a museum, another institution, Britannica, Smarthistory, a university or major press, which states every fact of the text. Never Wikipedia, Wikimedia, Wikidata, Wiktionary, the text of a work on Project Gutenberg, or a travel blog. Open the page and quote the facts to yourself before writing.
- Some allowed sites refuse automated reading (Britannica, Smarthistory, the British Museum, the Royal Academy, the Art Institute of Chicago, the NGA and the MFA Boston answer 403; the Getty collection pages render with a script; the Met answers 429 in bursts). Never work around that with a browser user agent or another trick: pick a page that opens, or ask the owner to paste the text of the page, which then counts as read. Pages that opened well: the Uffizi, the Rijksmuseum (collection and press), the Rembrandthuis, the V&A, the BnF Essentiels, the Sovrintendenza Capitolina, Guinness World Records, and the Commons file pages for licences and dates.
- Search the allowed sites with `allowed_domains` first, then open the page and check it before proposing the text: a search summary is not a source.
- A hidden exhibit's curiosity tells one story about the work itself; a tiered exhibit's curiosities follow its theme in the table of `voice-and-tone.md`, one per tier.
- A legend whose sources disagree stays out of the curiosity; it may still be the motif of the hint.

## 5. Texts

Propose all texts in one table, the recommended option first, with the facts' sources below it:

| Field           | What it is                                                                                    |
| --------------- | --------------------------------------------------------------------------------------------- |
| Kod             | the exhibit code                                                                              |
| Nazwa           | an object or a place, then whose or where (ADR-0185)                                          |
| O obiekcie      | one sentence on what the engraving shows, who made it and when                                |
| Podpowiedź      | hidden exhibits only: a riddle through the engraving's motif                                  |
| Za co / poziomy | a hidden exhibit: what it was awarded for; a tiered one: the thresholds and the counter label |
| Podpis ryciny   | engraver, title of the work in Polish „…”, date                                               |
| Ciekawostka     | one per tier, each with its source                                                            |

- Keep the owner's own wording when they give one, and polish it as little as possible.
- The hint gets its own round when the owner is not convinced: five or six short options on different motifs of the engraving, each in one line with why it works; when the owner leans to one, offer two or three tuned versions and say what each change does. Rejected hints go into the ADR's considered options.
- For a tiered exhibit, propose thresholds against the owner's real data (read-only SQL on the local Supabase, see the memory on the local collection) and a theme for its row in `voice-and-tone.md`; when a theme is narrow, mix it with a neighbouring one and order the curiosities so the last tier crowns the hardest goal.
- Apply the owner's word changes as given and re-check that the source still states the changed wording (for example "przed nocą" against "dès le soir même").

## 6. Record

When every field is settled:

1. **Linear:** replace the design issue's "To settle" paragraph with a "Settled with the owner (date)" section listing every field and the source of each curiosity, and agent notes with the manifest variants.
2. **ADR:** the first number free on `develop` and in open pull requests, from `docs/decisions/template.md`, in the shape of the newest exhibit ADR: context, drivers, every considered option (objects, crops, names, hints, awards), the outcome with the display case fields and the curiosity table, and consequences. Add it to the index. A tiered exhibit also adds its theme row to `voice-and-tone.md`.
3. **Build issue:** "Build the … exhibit", label `Feature`, related to the design and idea issues, listing the counting, the texts from the ADR, `exhibit-art publish --only <code>`, and the questions about the counting to settle with the owner (what counts, deleted or trashed data, data before the release, the place in the case). Link it from the ADR's "More information".
4. **Pull request:** two commits, `feat(design): add the crops of the … exhibit` (the manifest) and `docs(decisions): record the design of the … exhibit`; title `docs(decisions): ATL-<n> - record the design of the … exhibit`, with the `study-atelier-pr-create` skill. The texts are approved in the conversation, so the pull request is merged at a green "Web app" (see the memory on working in a loop); then set the issue Done and switch the checkout back to `develop`.
