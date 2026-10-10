# study-atelier

An app for learning art history, where the learner builds their own atelier: a personal database of artworks assembled as part of studying.

> Status: project setup. The web app is an empty skeleton.

## Development

Requirements: Node.js 22 (see `.nvmrc`) and pnpm 10.

```sh
pnpm install
pnpm dev      # start the web app
pnpm lint     # Prettier and ESLint
pnpm check    # type check
pnpm test     # unit tests
pnpm build    # production build
```

Deployment to Cloudflare Pages runs in GitHub Actions; see [ADR-0011](docs/decisions/0011-deploy-from-github-actions.md).

CI runs the same checks on every pull request ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Documentation

Project documentation, decisions and working rules live in [`docs/`](docs/).
