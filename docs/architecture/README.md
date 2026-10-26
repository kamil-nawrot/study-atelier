# Architecture

A lightweight [arc42](https://arc42.org) outline. Sections are filled in as the system takes shape.

## 1. Introduction and goals

See [product vision](../product/vision.md).

## 2. Constraints

- Single user for now; running costs must stay at zero ([ADR-0006](../decisions/0006-zero-cost-hosting.md)).
- Monorepo ([ADR-0003](../decisions/0003-monorepo.md)) with a Svelte frontend ([ADR-0004](../decisions/0004-svelte-frontend.md)) and no custom backend: Supabase provides the database, auth and server functions ([ADR-0005](../decisions/0005-no-custom-backend.md), [ADR-0008](../decisions/0008-supabase-database-and-auth.md)).

## 3. Context and scope

To be described with a C4 system context diagram.

## 4. Solution strategy

To be described once the stack decisions are accepted.

## 5. Building blocks

To be described with C4 container and component diagrams.

- `apps/web`: the SvelteKit app.
- `packages/ui`: shared Svelte components, token CSS, fonts and base styles, documented in Storybook ([ADR-0013](../decisions/0013-component-library-with-storybook.md)); interface icons come from Lucide through its `Icon` component ([ADR-0017](../decisions/0017-ui-icons-from-lucide.md)).

### Data model

The atelier lives in Supabase Postgres ([ADR-0014](../decisions/0014-artwork-collection-data-model.md)):

- `artworks`: one row per artwork, with its per-learner record number, its era (`era_code`), image references the width and height of its current image and its favourite flag (`favourite`, [ADR-0058](../decisions/0058-mark-artworks-as-favourites-with-a-heart.md)) ([ADR-0022](../decisions/0022-add-and-edit-an-artwork-in-one-full-form.md), [ADR-0038](../decisions/0038-chain-era-period-and-style.md)).
- `category_values` and `artwork_values`: authors, periods, styles, materials and locations, shared between a learner's artworks.
- `period_eras` and `style_periods`: the links of the chain era, period, style ([ADR-0038](../decisions/0038-chain-era-period-and-style.md)). A period is linked to each era it was saved under and a style to each period it was saved under, so one value can have several parents. Both tables have a composite key of the child and the parent, a trigger that checks the categories of the linked values, and cascade on delete of a value.
- `period_details`, `style_details`, `material_details`, `author_details` and `location_details`: the learner's page content about a value (summary, notes and the fields of the kind), one row per value, created when the value's form is first saved ([ADR-0049](../decisions/0049-give-every-category-value-a-page-of-its-own.md), [ADR-0050](../decisions/0050-store-value-pages-in-details-tables.md)). Each has a fixed `category_code` in a composite foreign key to `category_values`, so a row cannot belong to a value of another kind or learner, and cascades on delete of the value. `era_details` holds the same for the shared eras, keyed by the learner and the era.
- `catalogue_museums`: the starter list of museums (Wikidata id, Polish and English name, ISO country), the same for every learner, readable by signed-in users and writable only by migrations. `save_artwork` copies an entry into the learner's own places, with its country and the type of place, when it creates a place with the same name; `location_details.catalogue_wikidata_id` keeps the entry it came from ([ADR-0075](../decisions/0075-offer-a-starter-list-of-museums-in-the-place-field.md)).
- `glossary_entries`: the learner's glossary ([ADR-0074](../decisions/0074-keep-a-glossary-of-terms-with-definitions-from-wikipedia.md)), one row per term or person, with its name (unique per learner, ignoring letter case), one of six fixed category codes (`person`, `architecture`, `painting`, `sculpture`, `technique`, `general`), an optional definition, its synonyms (`synonyms`, shown under the name), its inflected forms (`forms`, never shown), both used with the name for matching in notes, an optional sort name (`sort_name`, for the order and the letter of the list, [ADR-0079](../decisions/0079-connect-the-lexicon-and-suggest-forms-from-wiktionary.md)) and an optional Wikipedia source (title, address, licence and the day it was fetched, all filled or all empty). It depends on no artwork, so deleting an entry changes nothing else.
- `timeline_events`: the learner's own events on the timeline ([ADR-0093](../decisions/0093-show-the-collection-and-historical-events-on-a-timeline.md)), one row per historical event or period, with a name, a date like an artwork's (`year_to` always, `year_from` only for a span and earlier than `year_to`, signed years without a year 0, and one `year_approximate` flag), and an optional description of at most 300 characters with its Wikipedia source (title, address, licence and day fetched, all four set or none, [ADR-0096](../decisions/0096-suggest-an-events-dates-and-description-from-wikipedia.md)). It depends on no artwork, so deleting an event changes nothing else.
- `visits` and `visit_artworks`: the chronicle ([ADR-0128](../decisions/0128-log-museum-visits-in-a-chronicle.md)). A visit has a place, which a composite foreign key with a fixed `category_code` of `location` keeps a place of the same learner, a date stored as the first day of what is known (`visited_on`) with its precision (`day`, `month` or `year`), and an optional note; `visit_artworks` holds the artworks seen on it and cascades on the delete of the visit or the permanent delete of the artwork, so an artwork in the trash keeps its visits. A place with visits cannot be deleted. `save_visit(visit, place, artwork_ids, existing_id)` saves a visit and its artworks in one transaction and creates the place by its name like `save_artwork`.
- `feedback`: the bugs and ideas the learner sends from the menu ([ADR-0076](../decisions/0076-collect-feedback-in-a-table-from-a-menu-dialog.md)), with a kind (`bug` or `idea`), a title and an optional description, each owned by the sender. Authenticated users have only an insert grant, so nobody reads the table through the app; the owner reads it in the Supabase dashboard.
- `review_cards` and `review_log`: the review of the atelier ([ADR-0062](../decisions/0062-schedule-reviews-with-fsrs.md)). `review_cards` holds the FSRS state of one artwork and facet (`recognise` for now), created at the first answer, so an artwork without a card is new; `review_log` keeps every answer with its mode, rating, whether a quiz answer was right and the time it took. Both reference the artwork with its owner and cascade on its permanent delete; an artwork in the trash keeps its card.
- `categories`, `artwork_types` and `eras`: fixed lists, extended by migrations. The six eras have a code and a position; their names and years are app texts (`m.eras`).
- Storage bucket `artwork-images`: the learner's own images, private, one folder per learner, at most 5 MB each in JPG, PNG, WebP, GIF or AVIF. The app mirrors these settings in `#lib/images/bucket/bucket.ts` ([ADR-0025](../decisions/0025-upload-the-own-image-when-the-artwork-is-saved.md)). Next to every uploaded file lies a 500 px JPEG copy, `<learner id>/<uuid>-thumb.jpg`, which the wall loads ([ADR-0063](../decisions/0063-make-a-small-copy-of-every-own-image.md)).

The card index changes values through database functions that run as the learner (`security invoker`, so Row Level Security applies), each in one transaction ([ADR-0040](../decisions/0040-manage-category-values-in-a-card-index.md)): `merge_category_values` moves the artwork values, links and visits of one value to another and deletes it, `set_period_eras` and `set_style_periods` set the links of a period and a style (the first moves the era of the artworks that lose theirs, the second refuses to drop a period an artwork still uses with the style), and `delete_unused_value` deletes a value no artwork and no visit uses. `value_usage`, `period_era_usage` and `style_period_usage` return the number of artworks per value and per link, artworks in the trash included, and `value_usage` also the number of visits of a place. `save_value_details` and `save_era_details` insert or update a details row with the fields they are given and leave the others. `value_page_content` says whether a value has page content and returns the path of an uploaded author portrait, which the app removes from Storage after the value is deleted or merged. `notes_mentions(needle)` returns the notes of the six details tables, of the artworks outside the trash and of the visits that contain a text (all notes without one), with the kind and the id or record number and title of each (for a visit the place and the date as far as it is known; visits come newest first), for "Wspomniane w" and the glossary's "Pojawia się w notatkach" in one request ([ADR-0082](../decisions/0082-find-note-mentions-with-one-database-function.md)).

A review answer goes through `record_review`, which upserts the card state computed in the browser with `ts-fsrs` and appends to the log in one transaction; `review_counts(day_start)` returns what the menu counter needs (due cards, new artworks, cards started today, artworks with an image). `review_session(day_start, session_form, scope_kind, scope_value, free_round)` builds a whole session with its quizzes and returns it as JSON ([ADR-0065](../decisions/0065-build-review-sessions-in-the-database.md)); with `free_round` it builds a free round of reviewed artworks, the weakest first, and the browser saves none of its answers ([ADR-0084](../decisions/0084-free-review-after-the-day-is-done.md)). In the mixed and quiz forms every third artwork with a pin that has a glossary entry is asked "Co to jest?" first (`quiz_pin`): the item carries the place and the image of one such pin, drawn at random, and four terms, the other three from the same glossary category first and never a term of another pin on that image; without four terms it falls back to the other quizzes ([ADR-0109](../decisions/0109-pin-details-on-the-artwork-image.md)). `review_streak(day_start, time_zone)` counts the days in a row with a logged answer in the learner's time zone ([ADR-0078](../decisions/0078-show-a-streak-of-days-with-reviews-on-the-review-start.md)).

Every learner-owned row is protected by Row Level Security on `owner_id`. An artwork and its category values are saved together by the database function `save_artwork` in one transaction ([ADR-0024](../decisions/0024-save-an-artwork-in-one-database-function.md)).

## 6. Runtime view

### Starting the app

1. The Cloudflare worker renders the page shell. The server `handle` hook (`hooks.server.ts`) puts `LoadingScreen` into it, and the library styles are linked in its head, so the loading screen shows from the first paint; its logo mark appears after 300 ms ([ADR-0030](../decisions/0030-loading-states-for-the-first-load-and-images.md)).
2. The client `init` hook in `hooks.client.ts` hydrates the loading screen.
3. The root layout load reads the session from Supabase Auth; the route groups redirect by session, and the first view loads its data ([ADR-0016](../decisions/0016-supabase-auth-in-the-browser.md)); the auth emails go through Gmail SMTP with Polish templates kept in `supabase/templates` ([hosted environments](hosted-environments.md#auth-emails)).
4. The root layout mounts and removes the loading screen.

### Opening the atelier

1. The `/atelier` page load asks Supabase for the learner's artworks outside the trash, newest first, with their authors (and each author's sort name) and eras (`#lib/wall/wall-data/wall-data.ts`). Supabase returns at most 1000 rows per request, so the load asks for pages of 1000 rows, ordered by creation time and `id`, until a page is not full; the trash does the same ([ADR-0041](../decisions/0041-load-the-whole-collection-in-pages-of-1000.md)).
2. The wall appears with the rows alone. When a tile comes near the screen, `ImageQueue` asks the Wikimedia Commons API for the direct thumbnail URL of its Commons image (up to 50 files per request, identified by an `Api-User-Agent` header, one retry after `Retry-After` on 429) and Supabase Storage for the signed URL of its uploaded image ([ADR-0044](../decisions/0044-load-wall-images-near-the-screen.md)). Tiles load thumbnails straight from the host the API names (`upload.wikimedia.org` or `thumb.wikimedia.org`); only when the API does not answer they fall back to `Special:FilePath`, which redirects ([ADR-0023](../decisions/0023-atelier-routes-and-commons-thumbnails.md)). A tile of an image linked straight to a file on `upload.wikimedia.org` takes that file's thumbnails too, and no `srcset` anywhere offers the original of a file wider than 3840 px ([ADR-0115](../decisions/0115-cap-the-loupe-image-and-thumbnail-linked-wikimedia-images.md)).
   `ResolvedImages` (`#lib/images/resolved-images/resolved-images.ts`) remembers each resolved thumbnail URL, and each signed URL until it expires, while the page is open, so a tile shown before gets its image at once on the next visit without asking again. The Commons request lets the browser keep its answer for a day (`maxage`) ([ADR-0052](../decisions/0052-remember-wall-images-and-cap-their-width.md)).
   The wall signs the small copies; for an uploaded image without one it signs the original and makes the copy in the background (`#lib/images/thumbnail-backfill/thumbnail-backfill.ts`). An uploaded image whose URL could not be signed is shown as unavailable, not as missing, with one "Spróbuj ponownie" action above the wall. A signed URL lives for an hour (`SIGNED_URL_SECONDS`); when a tile reports that its image did not load and its URL is older than that, the wall signs it again (`refreshExpiredImages`, one request for all failed tiles) and the tile loads the new URL.
3. The wall places each tile into the shortest column by the image size stored with the artwork ([ADR-0022](../decisions/0022-add-and-edit-an-artwork-in-one-full-form.md)), and offers thumbnails up to that width, but not wider than 960 px ([ADR-0052](../decisions/0052-remember-wall-images-and-cap-their-width.md)). An artwork without a stored size counts as 4:5 and gets thumbnails up to the tile width; if Commons does not answer the wall still shows every image.
4. Search by title runs in the browser on the loaded list.
5. The order of the wall is chosen in the top bar and remembered in `localStorage` (`#lib/wall/wall-order/wall-order.ts`). By era, `groupByEra` in `#lib/wall/periods/periods.ts` puts each artwork under its era, keeps the eras in their fixed order, orders the artworks by year inside them, and leaves out artworks without an era ([ADR-0033](../decisions/0033-order-the-wall-by-period-with-a-period-rail.md), [ADR-0038](../decisions/0038-chain-era-period-and-style.md)). The bounds of an era come from the years of its artworks.
6. In that order `PeriodTracker` (`#lib/wall/period-tracker/period-tracker.svelte.ts`) measures where each era starts on the wall and follows the scroll with a reference line that moves from the bottom of the top bar to the bottom of the screen, so the first and the last era are both reached. `PeriodRail` shows the result at the right edge when the margin beside the wall is at least `MIN_RAIL_MARGIN` wide, `PeriodStrip` under the top bar otherwise.

### Suggesting category values

1. The form loads the learner's authors, materials and locations once, through their artworks outside the trash, so values used only by trashed artworks are not suggested ([R-23](../product/requirements.md#artworks), `#lib/card-index/category-values-data/category-values-data.ts`). There are no starting lists: the learner builds every list ([ADR-0038](../decisions/0038-chain-era-period-and-style.md)). The one exception is the place field: `#lib/card-index/place-starter-data/place-starter-data.ts` also loads `catalogue_museums` and the countries of the learner's places, and `suggestValues` offers the museums in a group of their own ([ADR-0075](../decisions/0075-offer-a-starter-list-of-museums-in-the-place-field.md)).
2. The periods and styles come from the chain instead: `#lib/card-index/value-links-data/value-links-data.ts` reads the names of the period and style values and both link tables, and builds the periods of each era and the styles of each period (keyed by the period name's comparison key). The Okres field suggests the periods of the chosen era and the Styl field the styles of the chosen period; both are locked until the level above is chosen, and changing or clearing a level clears the levels below it. A value left on an artwork without a parent (an old period, or a style without a period) stays visible in its locked field and can be removed.
3. While the learner types, `#lib/card-index/value-suggestions/value-suggestions.ts` builds the list in the browser: a likely typo of a used value first ("Masz już „…”"), then used values, then the new value. Values starting with the typed text come before values containing it; chosen values are left out.
4. Values are compared by a key that ignores letter case, diacritics and repeated spaces. A new value with the same key as a used one is not offered; the used one is. A likely typo is a different key within one edit (letters added, removed, changed or swapped) for keys of 4 to 8 characters, or two edits from 9 characters on, and is checked only when the typed text is not already part of that value ([R-25](../product/requirements.md#category-values)).

### Finding the artwork image

1. "Znajdź obraz" opens the candidate dialog and sends one SPARQL query to the Wikidata Query Service (`#lib/images/wikidata/wikidata.ts`). It runs two searches for the title and merges them: the start of item labels and aliases in Polish with the usual fallbacks, then the full text of items, so the words of a title match in any order ("Bust of Nefertiti" finds "Nefertiti Bust"). Items found by the first search come first. The query keeps items that have an image and are not people, taxa or disambiguation pages, and reads each item's image file, inception date with its precision and the names of its creators. Nothing is searched while the learner types ([R-11](../product/requirements.md#images)).
2. `#lib/images/image-search/image-search.ts` ranks the items in the browser. When some creators match the learner's authors (ignoring letter case and diacritics, or sharing a surname), only those items are shown; otherwise items with a creator come first. The list is cut to 8.
3. One Commons API request (`#lib/images/commons/commons.ts`) reads the 330 px thumbnail, the original size, the licence and the photographer of every candidate file. An item whose file Commons does not return is left out of the list ([ADR-0055](../decisions/0055-list-only-image-candidates-that-have-an-image.md)).
4. Both requests send the `Api-User-Agent` header and are retried once after `Retry-After` on a 429 (`#lib/images/wikimedia/wikimedia.ts`); a second failure shows a message in the dialog with a button to search again.
5. Picking a candidate stores the Wikidata id, the file, its licence, its attribution and its size with the form ([ADR-0022](../decisions/0022-add-and-edit-an-artwork-in-one-full-form.md)); the form shows the image with its credit and changes no other field.

### Adding the learner's own image

1. "Dodaj własne" opens a dialog with "Wybierz plik z dysku" and a field for an image URL.
2. A picked file is checked against the bucket's types; a file over 5 MB (up to 50 MB) is made smaller in the browser, its longer side cut to 3200, 2400 or 1600 px as a JPEG ([ADR-0091](../decisions/0091-make-large-own-images-smaller-in-the-browser.md)). The file is shown from a local object URL; its width and height are read from that preview. Nothing is uploaded yet.
3. A URL must be a full `https` address. The browser loads its image to read the width and height; an address whose image does not load is rejected under the field ([ADR-0025](../decisions/0025-upload-the-own-image-when-the-artwork-is-saved.md)).
4. An own image replaces an image from the image source and the other way round, because the form holds one image at a time.
5. An image can also be pasted ([ADR-0032](../decisions/0032-paste-the-own-image-from-the-clipboard.md), `#lib/images/clipboard/clipboard.ts`). Ctrl+V uses the browser's `paste` event and needs no permission; "Wklej ze schowka" reads `navigator.clipboard.read()`, which asks the browser for access. Both look in the clipboard for an image file, then an `https` address as text, then the `src` of an `<img>` in copied HTML. A pasted image becomes a `File` and follows step 2; an address follows step 3. Ctrl+V is ignored when the focus is in a field the learner types in, and asks before replacing an image already in the form.

### Saving an artwork

1. `#lib/artworks/artwork-record/artwork-record.ts` checks the required fields (title, an author or "author unknown", a valid year or year span) and returns field errors without calling Supabase. When they pass, `ArtworkForm` reads the titles and authors of the learner's artworks outside the trash and compares them with `#lib/artworks/duplicates/duplicates.ts` (the value key for titles, the set of author keys for authors). A match opens the dialog "Masz już takie dzieło", and the save continues only after "Zapisz mimo to". When editing, the check runs only if the title or the authors changed, and the artwork never matches itself; if the artworks cannot be read, the save continues without the check ([ADR-0039](../decisions/0039-confirm-saving-a-duplicate-artwork.md)).
2. If the learner picked their own file, it uploads it to `artwork-images` at `<learner id>/<random uuid>.<extension>` (`#lib/images/own-image-data/own-image-data.ts`). The browser then makes the small copy and uploads it too; a copy that fails never stops the save ([ADR-0063](../decisions/0063-make-a-small-copy-of-every-own-image.md)). A failed upload stops the save ([ADR-0025](../decisions/0025-upload-the-own-image-when-the-artwork-is-saved.md)).
3. It calls the `save_artwork` RPC once with the artwork's columns and its value names by category; the years `year_from` (only for a year span) and `year_to` are stored negative before the common era ([ADR-0014](../decisions/0014-artwork-collection-data-model.md), [ADR-0046](../decisions/0046-enter-the-date-of-creation-as-a-year-span.md)).
4. The function inserts or updates the artwork, creates the names the learner does not have yet, replaces the artwork's value links, links its period to its era and its styles to its period, and returns the record number, all in one transaction ([ADR-0024](../decisions/0024-save-an-artwork-in-one-database-function.md)).
5. If the database rejected the save (the error carries a code), the file uploaded in step 2 is removed. If no answer came back (a network error), the file stays, because the artwork may have been saved and would point to a deleted file; at worst it is an orphaned file, which the daily clean-up removes ([ADR-0090](../decisions/0090-clean-up-unused-images-daily-from-github-actions.md)). If it succeeded and the artwork's previous uploaded file was replaced or removed, that file is removed.

### Viewing an artwork

1. `/atelier/<record number>` reads the artwork the same way as the edit page, without the category values (`loadArtwork`), and shows the same not-found state ([ADR-0026](../decisions/0026-artwork-view-as-a-stage-with-an-information-panel.md)).
2. The stage and the full-screen view take the image from `#lib/images/artwork-image/artwork-image.ts`: Commons widths up to the stored width, or the image URL, or the signed URL of an uploaded image.
3. Whether the information panel is closed is kept in the browser's `localStorage` (`#lib/artworks/artwork-panel/artwork-panel.ts`); without storage the panel is always open.
4. Next to the artwork, the page loads the summaries of its values (`loadValueSummaries` in `#lib/card-index/value-summaries-data/value-summaries-data.ts`): one request for the artwork's values with their details tables embedded, found by the record number, and one for the learner's era summaries. A value with a summary opens a `Popover` card in the panel ([ADR-0059](../decisions/0059-value-summary-card-in-the-artwork-view.md)).

### Editing an artwork

1. `/atelier/<record number>/edit` reads the artwork by record number with its values, outside the trash, together with the category values (`loadArtwork` in `#lib/artworks/artwork-data/artwork-data.ts`). A record number that is not a positive whole number, an unknown one or one in the trash shows a not-found state.
2. For an uploaded image it asks Supabase Storage for a signed URL, used only for the preview; the form keeps the storage path.
3. The same form as adding starts from the loaded values, so "Odrzucić zmiany?" compares against them. There is no "Zapisz i dodaj kolejne".
4. Saving passes the artwork's id and its loaded image to the save above, then replaces the edit page in the history with the artwork page, which confirms the save with a toast.

### Managing category values

1. `/atelier/values` ("Kartoteka", opened from the menu) reads the three usage functions and the authors' sort names in pages of 1000 rows (`loadCardIndex` in `#lib/card-index/card-index-data/card-index-data.ts`), then `#lib/card-index/card-index/card-index.ts` builds the timeline of the six eras with their periods and styles, and the alphabetical lists of materials, authors (by their sort name, [ADR-0060](../decisions/0060-order-authors-by-their-sort-name.md)) and locations.
2. Each value, and each era name on the timeline, is a link to the value page `/atelier/values/<kind>/<id>` (an era uses its code). The tab of the card index is remembered for the session (`#lib/card-index/card-index-tab/card-index-tab.ts`).
3. The value page (`loadValuePage` in `#lib/values/value-page-data/value-page-data.ts`) reads the card index, the whole collection outside the trash and the value's row of its details table, then picks the value's artworks in the browser by name, or by era code, in chronological order (`#lib/card-index/value-pages/value-pages.ts`, [ADR-0051](../decisions/0051-load-and-save-a-value-page.md)). The parents under the name (the eras of a period, the periods of a style) link to their pages.
4. The form `/atelier/values/<kind>/<id>/edit` saves in steps: the summary and notes through `save_value_details` or `save_era_details`, then the links (`set_period_eras` or `set_style_periods`), then the rename or the merge into the value whose name it now matches by the comparison key of R-25. Removing an era from a period that artworks use and merging ask first; a merge skips the typed summary and notes. Saving returns to the value page (the remaining value's page after a merge) with a toast passed in the page state (`valueMessage`). Deleting is done from the value page's top bar and returns to the card index with a toast the same way.
5. An author's form also holds the portrait, the years of life and the sort name ([ADR-0056](../decisions/0056-author-portrait-years-of-life-and-sort-name.md)). The portrait uses the artwork image field and search with a people query (`searchWikidataPeople` in `#lib/images/wikidata/wikidata.ts`); on save a new own portrait is uploaded first, the details go through `save_value_details`, and a replaced upload is removed. The image columns are mapped in `#lib/images/image-record/image-record.ts`, shared with the artwork record.
6. A location's form holds the country (an ISO code from `#lib/catalogue/countries/countries.ts`, picked in `SearchSelect`) and the type of place (`#lib/catalogue/place-types/place-types.ts`), saved through `save_value_details` ([ADR-0057](../decisions/0057-location-country-and-type-of-place.md)).
7. The suggestions in the artwork form read the same tables, so a merge or a delete shows there at once.

### Deleting and restoring an artwork

1. "Usuń" in the artwork view asks first, then sets `deleted_at` on the artwork (`moveToTrash` in `#lib/artworks/trash-data/trash-data.ts`) and returns to the wall, which confirms with a toast. Every other query filters on `deleted_at is null`, so the artwork disappears from the wall, the suggestions and its own pages ([ADR-0028](../decisions/0028-trash-as-a-list-with-confirmed-deletes.md)).
2. `/atelier/trash` reads the artworks with `deleted_at` set, most recently deleted first, with the same images as the wall (`loadTrash` in `#lib/wall/wall-data/wall-data.ts`).
3. "Przywróć" clears `deleted_at`; the record number stays. "Usuń na zawsze" asks first, deletes the row, whose values go with it, then removes the uploaded image from Storage. A failed storage removal leaves an orphaned file, removed by the daily clean-up, but no broken artwork. The record number counter never goes back, so the number is not reused ([R-2](../product/requirements.md#artworks)).

## 7. Deployment view

- The web app is a SvelteKit build for Cloudflare Pages, project `study-atelier`.
- GitHub Actions ([`ci.yml`](../../.github/workflows/ci.yml)) runs lint, type check, unit and component tests and the build, then deploys with Wrangler ([ADR-0011](../decisions/0011-deploy-from-github-actions.md)). To save free runner minutes, the [UI library](../../.github/workflows/ui.yml) and [migrations](../../.github/workflows/migrations.yml) checks run on a pull request only when it touches their files, and a change to documentation alone starts no CI; every push to `develop` and `main` runs all checks.
- The same workflow checks `packages/ui` and builds its Storybook without deploying it ([ADR-0013](../decisions/0013-component-library-with-storybook.md)).

| Trigger           | Deployment                                   |
| ----------------- | -------------------------------------------- |
| Push to `main`    | Production at `study-atelier.pages.dev`      |
| Push to `develop` | Preview at `develop.study-atelier.pages.dev` |
| Pull request      | Checks only, no deployment                   |

- `develop` and `production` each have their own Supabase project and GitHub environment. Migrations in [`supabase/migrations`](../../supabase/migrations) are applied by the `database` job in `ci.yml` after a push to `develop` (develop database) or `main` (production database) ([ADR-0037](../decisions/0037-separate-databases-for-develop-and-production.md), setup in [hosted environments](hosted-environments.md)). Before migrating production the job saves an encrypted dump, and a weekly workflow saves the production database and images ([backups](backups.md)).
- The scheduled workflow [`supabase-keep-alive.yml`](../../.github/workflows/supabase-keep-alive.yml) calls the `keep_alive()` database function of both projects daily so the free projects are not paused.
- The scheduled workflow [`unused-images-cleanup.yml`](../../.github/workflows/unused-images-cleanup.yml) removes, daily in both projects, the uploaded images that no artwork or author has used for 24 hours: the `unused_images()` database function lists them and the Storage API removes them, with the project's secret key ([ADR-0090](../decisions/0090-clean-up-unused-images-daily-from-github-actions.md)).

## 8. Crosscutting concepts

- Authentication: Supabase Auth from the browser with email and password; the session lives in `localStorage` and server-side rendering is off ([ADR-0016](../decisions/0016-supabase-auth-in-the-browser.md)).
- UI text: typed message dictionaries in `apps/web/src/lib/i18n`, Polish only for now ([ADR-0015](../decisions/0015-typed-message-dictionaries-for-i18n.md)).
- UI patterns: tokens, the component library and base styles carry the shared look and behaviour; the remaining rules are in [ui-patterns.md](../guidelines/ui-patterns.md) ([ADR-0019](../decisions/0019-encode-ui-standards-in-tokens-and-the-library.md)).

## 9. Architecture decisions

See [decisions/](../decisions/).

## 10. Quality requirements

Not yet described.

## 11. Risks and technical debt

- The free Supabase project is paused after one week without database activity ([ADR-0008](../decisions/0008-supabase-database-and-auth.md)); the daily keep-alive runs only from the default branch (`develop`).
- Development and production have separate databases. A migration reaches the development database from `develop` and the production database only with a release, together with the code that needs it, so a migration does not have to keep the previous code working; the production deployment is uploaded just before its migrations are applied ([ADR-0037](../decisions/0037-separate-databases-for-develop-and-production.md)).

## 12. Glossary

See [product glossary](../product/glossary.md).
