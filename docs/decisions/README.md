# Decisions

Architecture Decision Records in [MADR](https://adr.github.io/madr/) format. New records start from [template.md](template.md). Rules: [documentation guidelines](../guidelines/documentation.md#architecture-decision-records).

| # | Decision | Status |
| --- | --- | --- |
| [0001](0001-record-decisions-in-adrs.md) | Record decisions as ADRs and keep docs in the repository | accepted |
| [0002](0002-gitflow-and-conventional-commits.md) | Use gitflow, Conventional Commits and owner-approved pull requests | accepted |
| [0003](0003-monorepo.md) | Keep all project code in one repository | accepted |
| [0004](0004-svelte-frontend.md) | Build the frontend with SvelteKit (Svelte 5) in TypeScript | accepted |
| [0005](0005-no-custom-backend.md) | Do not build a custom backend for now; use Supabase directly | accepted |
| [0006](0006-zero-cost-hosting.md) | Host on free tiers: Cloudflare Pages, GitHub Actions | accepted |
| [0007](0007-images-from-open-sources.md) | Load artwork images on the fly from open sources | accepted |
| [0008](0008-supabase-database-and-auth.md) | Use Supabase for the database and authentication | accepted |
| [0009](0009-linear-for-tracking.md) | Track work in Linear | accepted |
| [0010](0010-design-tokens-figma-sync.md) | Keep the design system in code and sync design tokens with Figma through Tokens Studio | accepted |
| [0011](0011-deploy-from-github-actions.md) | Deploy to Cloudflare Pages from GitHub Actions | accepted |
| [0012](0012-database-migrations-from-github-actions.md) | Apply database migrations from GitHub Actions | accepted |
| [0013](0013-component-library-with-storybook.md) | Build Svelte components in a workspace package documented in Storybook | accepted |
| [0014](0014-artwork-collection-data-model.md) | Store the atelier in shared category-value tables with per-learner record numbers | accepted |
| [0015](0015-typed-message-dictionaries-for-i18n.md) | Keep UI text in typed message dictionaries, one file per language | accepted |
| [0016](0016-supabase-auth-in-the-browser.md) | Sign in with Supabase Auth from the browser, email and password only | accepted |
| [0017](0017-ui-icons-from-lucide.md) | Use Lucide icons through a shared Icon component | accepted |
| [0019](0019-encode-ui-standards-in-tokens-and-the-library.md) | Encode UI standards in design tokens and the component library | accepted |
