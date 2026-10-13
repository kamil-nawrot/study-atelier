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

- `artworks`: one row per artwork, with its per-learner record number, its era (`era_code`), image references and the width and height of its current image ([ADR-0022](../decisions/0022-add-and-edit-an-artwork-in-one-full-form.md), [ADR-0038](../decisions/0038-chain-era-period-and-style.md)).
- `category_values` and `artwork_values`: authors, periods, styles, materials and locations, shared between a learner's artworks.
- `period_eras` and `style_periods`: the links of the chain era, period, style ([ADR-0038](../decisions/0038-chain-era-period-and-style.md)). A period is linked to each era it was saved under and a style to each period it was saved under, so one value can have several parents. Both tables have a composite key of the child and the parent, a trigger that checks the categories of the linked values, and cascade on delete of a value.
- `categories`, `artwork_types` and `eras`: fixed lists, extended by migrations. The six eras have a code and a position; their names and years are app texts (`m.eras`).
- Storage bucket `artwork-images`: the learner's own images, private, one folder per learner, at most 5 MB each in JPG, PNG, WebP, GIF or AVIF. The app mirrors these settings in `#lib/images/bucket.ts` ([ADR-0025](../decisions/0025-upload-the-own-image-when-the-artwork-is-saved.md)).

Every learner-owned row is protected by Row Level Security on `owner_id`. An artwork and its category values are saved together by the database function `save_artwork` in one transaction ([ADR-0024](../decisions/0024-save-an-artwork-in-one-database-function.md)).

## 6. Runtime view

### Starting the app

1. The Cloudflare worker renders the page shell. The server `handle` hook (`hooks.server.ts`) puts `LoadingScreen` into it, and the library styles are linked in its head, so the loading screen shows from the first paint; its logo mark appears after 300 ms ([ADR-0030](../decisions/0030-loading-states-for-the-first-load-and-images.md)).
2. The client `init` hook in `hooks.client.ts` hydrates the loading screen.
3. The root layout load reads the session from Supabase Auth; the route groups redirect by session, and the first view loads its data ([ADR-0016](../decisions/0016-supabase-auth-in-the-browser.md)).
4. The root layout mounts and removes the loading screen.

### Opening the atelier

1. The `/atelier` page load asks Supabase for the learner's artworks outside the trash, newest first, with their authors and eras (`#lib/collection/artworks.ts`).
2. In parallel it asks the Wikimedia Commons API for the direct thumbnail URL of every Commons image (up to 50 files per request, identified by an `Api-User-Agent` header, one retry after `Retry-After` on 429) and Supabase Storage for signed URLs of uploaded images. Tiles load thumbnails straight from `upload.wikimedia.org`; only when the API does not answer they fall back to `Special:FilePath`, which redirects ([ADR-0023](../decisions/0023-atelier-routes-and-commons-thumbnails.md)).
3. The wall places each tile into the shortest column by the image size stored with the artwork ([ADR-0022](../decisions/0022-add-and-edit-an-artwork-in-one-full-form.md)), and offers thumbnails up to that width. An artwork without a stored size counts as 4:5 and gets thumbnails up to the tile width; if Commons does not answer the wall still shows every image.
4. Search by title runs in the browser on the loaded list.
5. The order of the wall is chosen in the top bar and remembered in `localStorage` (`#lib/collection/wall-order.ts`). By era, `groupByEra` in `#lib/collection/periods.ts` puts each artwork under its era, keeps the eras in their fixed order, orders the artworks by year inside them, and leaves out artworks without an era ([ADR-0033](../decisions/0033-order-the-wall-by-period-with-a-period-rail.md), [ADR-0038](../decisions/0038-chain-era-period-and-style.md)). The bounds of an era come from the years of its artworks.
6. In that order `PeriodTracker` (`#lib/collection/period-tracker.svelte.ts`) measures where each era starts on the wall and follows the scroll with a reference line that moves from the bottom of the top bar to the bottom of the screen, so the first and the last era are both reached. `PeriodRail` shows the result at the right edge when the margin beside the wall is at least `MIN_RAIL_MARGIN` wide, `PeriodStrip` under the top bar otherwise.

### Suggesting category values

1. The form loads the learner's authors, materials and locations once, through their artworks outside the trash, so values used only by trashed artworks are not suggested ([R-23](../product/requirements.md#artworks), `#lib/collection/category-values.ts`). There are no starting lists: the learner builds every list ([ADR-0038](../decisions/0038-chain-era-period-and-style.md)).
2. The periods and styles come from the chain instead: `#lib/collection/value-links.ts` reads the names of the period and style values and both link tables, and builds the periods of each era and the styles of each period (keyed by the period name's comparison key). The Okres field suggests the periods of the chosen era and the Styl field the styles of the chosen period; both are locked until the level above is chosen, and changing or clearing a level clears the levels below it. A value left on an artwork without a parent (an old period, or a style without a period) stays visible in its locked field and can be removed.
3. While the learner types, `#lib/collection/value-suggestions.ts` builds the list in the browser: a likely typo of a used value first ("Masz już „…”"), then used values, then the new value. Values starting with the typed text come before values containing it; chosen values are left out.
4. Values are compared by a key that ignores letter case, diacritics and repeated spaces. A new value with the same key as a used one is not offered; the used one is. A likely typo is a different key within one edit (letters added, removed, changed or swapped) for keys of 4 to 8 characters, or two edits from 9 characters on, and is checked only when the typed text is not already part of that value ([R-25](../product/requirements.md#category-values)).

### Finding the artwork image

1. "Znajdź zdjęcie" opens the candidate dialog and sends one SPARQL query to the Wikidata Query Service (`#lib/images/wikidata.ts`). It runs two searches for the title and merges them: the start of item labels and aliases in Polish with the usual fallbacks, then the full text of items, so the words of a title match in any order ("Bust of Nefertiti" finds "Nefertiti Bust"). Items found by the first search come first. The query keeps items that have a creator, an architect or an image and are not people, taxa or disambiguation pages, and reads each item's image file, inception date with its precision and the names of its creators. Nothing is searched while the learner types ([R-11](../product/requirements.md#images)).
2. `#lib/images/image-search.ts` ranks the items in the browser. When some creators match the learner's authors (ignoring letter case and diacritics, or sharing a surname), only those items are shown; otherwise items with a creator come first. The list is cut to 8.
3. One Commons API request (`#lib/images/commons.ts`) reads the 330 px thumbnail, the original size, the licence and the photographer of every candidate file. An item whose file Commons does not return is shown as having no free image.
4. Both requests send the `Api-User-Agent` header and are retried once after `Retry-After` on a 429 (`#lib/images/wikimedia.ts`); a second failure shows a message in the dialog with a button to search again.
5. Picking a candidate stores the Wikidata id, the file, its licence, its attribution and its size with the form ([ADR-0022](../decisions/0022-add-and-edit-an-artwork-in-one-full-form.md)); the form shows the image with its credit and changes no other field.

### Adding the learner's own image

1. "Dodaj własne" opens a dialog with "Wybierz plik z dysku" and a field for an image URL.
2. A picked file is checked against the bucket's types and size limit and shown from a local object URL; its width and height are read from that preview. Nothing is uploaded yet.
3. A URL must be a full `https` address. The browser loads its image to read the width and height; an address whose image does not load is rejected under the field ([ADR-0025](../decisions/0025-upload-the-own-image-when-the-artwork-is-saved.md)).
4. An own image replaces an image from the image source and the other way round, because the form holds one image at a time.
5. An image can also be pasted ([ADR-0032](../decisions/0032-paste-the-own-image-from-the-clipboard.md), `#lib/images/clipboard.ts`). Ctrl+V uses the browser's `paste` event and needs no permission; "Wklej ze schowka" reads `navigator.clipboard.read()`, which asks the browser for access. Both look in the clipboard for an image file, then an `https` address as text, then the `src` of an `<img>` in copied HTML. A pasted image becomes a `File` and follows step 2; an address follows step 3. Ctrl+V is ignored when the focus is in a field the learner types in, and asks before replacing an image already in the form.

### Saving an artwork

1. `#lib/collection/artwork-record.ts` checks the required fields (title, an author or "author unknown", a valid year) and returns field errors without calling Supabase.
2. If the learner picked their own file, it uploads it to `artwork-images` at `<learner id>/<random uuid>.<extension>` (`#lib/images/own-image.ts`). A failed upload stops the save ([ADR-0025](../decisions/0025-upload-the-own-image-when-the-artwork-is-saved.md)).
3. It calls the `save_artwork` RPC once with the artwork's columns and its value names by category; the year is stored negative before the common era ([ADR-0014](../decisions/0014-artwork-collection-data-model.md)).
4. The function inserts or updates the artwork (an update that sends no `era_code` keeps the stored era, so code from before the era existed does not erase it), creates the names the learner does not have yet, replaces the artwork's value links, links its period to its era and its styles to its period, and returns the record number, all in one transaction ([ADR-0024](../decisions/0024-save-an-artwork-in-one-database-function.md)).
5. If the save failed, the file uploaded in step 2 is removed. If it succeeded and the artwork's previous uploaded file was replaced or removed, that file is removed.

### Viewing an artwork

1. `/atelier/<record number>` reads the artwork the same way as the edit page, without the category values (`loadArtwork`), and shows the same not-found state ([ADR-0026](../decisions/0026-artwork-view-as-a-stage-with-an-information-panel.md)).
2. The stage and the full-screen view take the image from `#lib/collection/artwork-image.ts`: Commons widths up to the stored width, or the image URL, or the signed URL of an uploaded image.
3. Whether the information panel is closed is kept in the browser's `localStorage` (`#lib/collection/artwork-panel.ts`); without storage the panel is always open.

### Editing an artwork

1. `/atelier/<record number>/edit` reads the artwork by record number with its values, outside the trash, together with the category values (`loadArtwork` in `#lib/collection/artwork-record.ts`). A record number that is not a positive whole number, an unknown one or one in the trash shows a not-found state.
2. For an uploaded image it asks Supabase Storage for a signed URL, used only for the preview; the form keeps the storage path.
3. The same form as adding starts from the loaded values, so "Odrzucić zmiany?" compares against them. There is no "Zapisz i dodaj kolejne".
4. Saving passes the artwork's id and its loaded image to the save above, then replaces the edit page in the history with the artwork page, which confirms the save with a toast.

### Deleting and restoring an artwork

1. "Usuń" in the artwork view asks first, then sets `deleted_at` on the artwork (`moveToTrash` in `#lib/collection/trash.ts`) and returns to the wall, which confirms with a toast. Every other query filters on `deleted_at is null`, so the artwork disappears from the wall, the suggestions and its own pages ([ADR-0028](../decisions/0028-trash-as-a-list-with-confirmed-deletes.md)).
2. `/atelier/trash` reads the artworks with `deleted_at` set, most recently deleted first, with the same images as the wall (`loadTrash` in `#lib/collection/artworks.ts`).
3. "Przywróć" clears `deleted_at`; the record number stays. "Usuń na zawsze" asks first, deletes the row, whose values go with it, then removes the uploaded image from Storage. A failed storage removal leaves an orphaned file but no broken artwork. The record number counter never goes back, so the number is not reused ([R-2](../product/requirements.md#artworks)).

## 7. Deployment view

- The web app is a SvelteKit build for Cloudflare Pages, project `study-atelier`.
- GitHub Actions ([`ci.yml`](../../.github/workflows/ci.yml)) runs lint, type check, unit and component tests and the build, then deploys with Wrangler ([ADR-0011](../decisions/0011-deploy-from-github-actions.md)).
- The same workflow checks `packages/ui` and builds its Storybook without deploying it ([ADR-0013](../decisions/0013-component-library-with-storybook.md)).

| Trigger | Deployment |
| --- | --- |
| Push to `main` | Production at `study-atelier.pages.dev` |
| Push to `develop` | Preview at `develop.study-atelier.pages.dev` |
| Pull request | Checks only, no deployment |

- `develop` and `production` each have their own Supabase project and GitHub environment. Migrations in [`supabase/migrations`](../../supabase/migrations) are applied by the `database` job in `ci.yml` after a push to `develop` (develop database) or `main` (production database) ([ADR-0037](../decisions/0037-separate-databases-for-develop-and-production.md), setup in [hosted environments](hosted-environments.md)).
- The scheduled workflow [`supabase-keep-alive.yml`](../../.github/workflows/supabase-keep-alive.yml) calls the `keep_alive()` database function of both projects daily so the free projects are not paused.

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
- Production runs the older code from `main` until a release, so migrations must stay backward compatible; the production deployment is uploaded just before its migrations are applied ([ADR-0037](../decisions/0037-separate-databases-for-develop-and-production.md)).

## 12. Glossary

See [product glossary](../product/glossary.md).
