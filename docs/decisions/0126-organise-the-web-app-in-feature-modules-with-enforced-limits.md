# 0126. Organise the web app in feature modules with enforced limits

- Status: accepted
- Date: 2026-10-24

## Context and problem statement

After ten versions the owner found that files keep growing and the structure of `apps/web` no longer reads well. The spike ATL-307 measured the code on `develop` at version 0.10.0:

- Functions are small and simple: none is longer than 60 lines, none nests deeper than 4 levels, 3 exceed a cyclomatic complexity of 15.
- `lib/collection` holds 84 files and 11.8k lines, 41% of `lib`. It mixes the artwork card, the wall, the card index, the artwork image and loupe, the filters, the trash, the app layout and code every other module needs (`types.ts` with 70 types, eras, year formatting, the discard dialog, `fetchAll`).
- Other modules import from `collection` more than 50 times, and five pairs of modules import each other: `collection` with `glossary`, `pins`, `images` and `profile`, and `export` with `import`.
- 13 components are longer than 400 lines (`ArtworkView` 954, of which 421 are styles), and the wall and review pages keep about 280 lines of logic each in `routes/`.
- The save flow of a form (saving state, error alert with a scroll to it, saved snapshot) is repeated in seven forms; network error detection in five modules; safe `localStorage` access in seven; a UUID pattern in three; the Wikipedia source columns in two.
- Files that call Supabase are named `*-data.ts` in ten cases and without a suffix in about fifteen.
- Nothing in lint or CI checks file size, cycles or which module may import what.

How should the web app be organised, and which rules keep it that way?

## Decision drivers

- One feature lives in one folder that a reader can find from the feature's name.
- Code shared by several features does not live inside one of them.
- Rules are checked by tools, not only by review, and new code follows them from the first day.
- The migration does not mix moving files with changing behaviour.

## Considered options

Structure of `lib/`:

1. Feature modules on top of a technical `shared` layer and a `catalogue` domain model, with a `shell` for the app layout
2. Only move the shared code out of `collection`, keeping the rest of it together
3. Layers for the whole app (`data/`, `logic/`, `components/`)

Size limits: enforced by lint with a shrinking allowlist; enforced strictly at once; written in the guidelines only.

Boundaries: `dependency-cruiser` for cycles and directions plus ESLint for the Supabase client; `eslint-plugin-boundaries` for everything; review only.

Files that call Supabase: a `-data.ts` suffix; a `data/` subfolder per module; one `data.ts` per module.

Message dictionary: one file per section in `i18n/pl/`; messages next to each module; one file.

Timing: the refactor as version 0.11; the foundation now and the rest alongside features; everything alongside features.

Raised by the owner after the first eight decisions, from the layout he is used to:

- Types: a `types/` folder per module with files by topic; a `types/` folder with one type per file; one `types.ts` per module.
- Files and their tests: side by side, with a folder only for a component split into parts; a folder per file, imported straight; a folder per file with an `index.ts`.
- Helpers: `utils/` in each module and in `shared`, with files by topic inside; no `utils`, files named by topic; one `lib/utils/` instead of `shared`.

## Decision outcome

Chosen by the owner, topic by topic:

1. **Feature modules (option 1).** `apps/web/src/lib` is split into:
   - `shared/`: technical code that knows nothing about artworks: the Supabase client and generated types, `fetchAll`, the error-message factory, safe storage, `isUuid`, the Wikipedia source mapping, search normalisation, dates, history navigation and the form helpers (`FormState`, `UnsavedChanges`, `DiscardDialog`, year inputs);
   - `i18n/`;
   - `catalogue/`: the domain model several features share, without Supabase and without components: artwork and value types, eras, artwork types, record numbers and years;
   - feature modules: `artworks`, `images`, `wall`, `card-index`, `notes`, `pins`, `glossary`, `timeline`, `review`, `profile`, `auth`, `feedback`, `data-transfer` (export and import);
   - `shell/`: the atelier layout, the menu, the theme and the rail.

   Dependencies point down only: `shared` imports nothing from `lib` but `i18n`; `catalogue` imports `shared` and `i18n`; a feature module imports `shared`, `i18n`, `catalogue` and other feature modules without cycles; only `routes/` imports `shell`.

2. **Size limits enforced by lint with a ratchet.** A `.ts` file has at most 300 lines, a `.svelte` file at most 400, of which the script at most 200 and the styles at most 150; a test file at most 800; a function a cyclomatic complexity of at most 15. Generated files, the message dictionary and long reference data are exempt. Files over a limit when the check is added are listed in an allowlist that may only shrink; a refactor that brings a file under the limit removes its entry.
3. **`dependency-cruiser` and ESLint.** `dependency-cruiser` checks cycles and the directions above in `pnpm lint` and CI. ESLint `no-restricted-imports` allows the Supabase client only in data files.
4. **Data files carry the `-data.ts` suffix** and sit next to the module's logic; only they import the Supabase client.
5. **The repeated code moves to `shared`**, and the library `Form` takes the form error and its title and shows the error `Alert` itself, with the scroll to it, next to the focus on the first invalid field it already sets. `FormState` keeps the saving state, the error and the saved snapshot.
6. **Thin routes.** A page whose script grows past about 80 lines moves its logic into a view component of its module, for example `wall/WallPage.svelte`; the page keeps `load`, `snapshot` and navigation.
7. **`i18n/pl.ts` stays one file**, exempt from the size limits. The owner chose this over a file per section.
8. **Version 0.11 is the refactor.** The steps run one after another without feature work in between, so moves cause no conflicts; features continue in 0.12 in the new structure.
9. **One type per file in `types/`.** Every type a module exports lives in a file of its own, named after the type in kebab-case, in the module's `types/` folder (`wall/types/wall-order.ts` exports `WallOrder`). A type used by one file only stays in that file. The owner chose this over files by topic.
10. **Every code file has a folder of its own name, with its tests.** A `.ts` or `.svelte` file sits in a folder named like the file without its extension, next to its tests (`wall/filter/filter.ts` and `wall/filter/filter.spec.ts`; `wall/components/ArtworkWall/ArtworkWall.svelte` and `ArtworkWall.svelte.spec.ts`). Imports name the file itself (`#lib/wall/filter/filter.ts`); there are no `index.ts` files. Type files in `types/`, SvelteKit files in `routes/` and the message dictionary keep their places. The owner chose this over keeping a file and its test side by side.
11. **Helpers in `utils/`.** General helpers of one module sit in its `utils/` folder, helpers shared by several modules in `shared/utils/`; each helper has a file named by its topic (`utils/years/years.ts`), never one `utils.ts`. Domain logic (the wall filter, the grouping, the timeline layout) stays in the module, outside `utils/`.

### Consequences

- Good: a feature is found by its name, and shared code has an obvious home; the five cycles disappear.
- Good: lint reports a file that grows too big or an import in the wrong direction while the code is written, and the allowlist shows how much is left to split.
- Good: each of the seven forms loses its copy of the save flow and the error alert.
- Bad: moving files touches imports across the app, so the moves need a quiet window and fast merges, and `git log --follow` is needed to trace a moved file.
- Bad: a new development dependency (`dependency-cruiser`), a small lint script that measures the blocks of a Svelte file, and an allowlist to maintain.
- Bad: the message dictionary keeps growing as one file.
- Good: a folder holds one file and everything about it, and a type is found by its name.
- Bad: many more files and folders (one per exported type, one folder per code file), longer import paths, and a larger first move.

## More information

- Analysis with the measurements: the document attached to ATL-307 in Linear.
- Rules for writing code: [code-conventions.md](../guidelines/code-conventions.md#web-app-layout).
- Follow-up issues in the Linear milestone 0.11.
