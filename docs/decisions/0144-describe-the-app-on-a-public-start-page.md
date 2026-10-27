# 0144. Describe the app on a public start page

- Status: accepted
- Date: 2026-10-27

## Context and problem statement

`/` showed a short text in the layout of the sign-in pages. Someone who gets a link from a friend learned little about Study Atelier before creating an account, a shared link showed no preview, and search engines were allowed everywhere. What does the start page show, and how does a shared link describe the app when the pages render in the browser only (`ssr = false`)?

## Decision drivers

- Say what the app is and what each module does, in the editorial look of the app.
- Nothing to keep up to date when the views change.
- No requests to Supabase before signing in.
- A preview in messengers although the page head is built in the browser.

## Considered options

- The sign-in layout with a list of modules, an editorial page with screenshots of the modules, or an editorial page with the module icons
- Sharing tags in each page's head, or in the page shell from the server

## Decision outcome

Chosen by the owner: an editorial page with icons, with the stage of the sign-in pages.

- `StartPage` (`#lib/start`): the top half of the screen is the stage of the sign-in pages (a random artwork in its frame over the same image under a scrim, with its credit), beside it the logo, "Zaloguj się", the title, the description written with the owner, "Załóż konto" and "Masz już konto? Zaloguj się". Below, "Co znajdziesz w atelier" lists the six modules with their menu icons at 40 px and texts written by the owner, in as many columns as fit, and the footer links the terms, the privacy policy and `kontakt@studyatelier.art`. A signed-in learner is still sent to the atelier.
- No screenshots of the modules, so nothing goes stale.
- The server `handle` hook puts the description and the Open Graph and Twitter tags into the page shell, with `/og-image.png` (1200 × 630: logo, title and address) on the host that serves the page. With `ssr = false` a tag in a page's `<svelte:head>` is never seen by a crawler.
- `robots.txt` allows `/`, `/terms`, `/privacy` and the image, and disallows everything else.

### Consequences

- Good: a visitor sees what the app does before signing up, and a shared link shows a preview.
- Good: the page makes no request to Supabase and has no image to regenerate when the views change.
- Bad: the sharing tags are the same for every page, which is enough while only the start page is public.
- Bad: the image is a fixed file; a new title means rendering it again.

## More information

- Issue ATL-336; the mockups are attached to the issue.
