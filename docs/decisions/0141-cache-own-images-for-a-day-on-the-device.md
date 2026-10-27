# 0141. Cache own images for a day on the device

- Status: accepted
- Date: 2026-10-27

## Context and problem statement

The learner's own images are private files in Supabase Storage, shown through signed URLs. A URL lived for an hour and was remembered only while the page was open, and the files had Supabase's default one-hour cache header. Every visit signed new URLs, so the browser downloaded every image again, which costs Storage egress (5 GB a month on the Free plan) once many learners use the app. How long does a signed URL live, and where is it kept?

## Decision drivers

- An image is downloaded as rarely as possible.
- A signed URL is a link to a private file; it must not outlive its use by much or reach another learner on the same device.
- A file never changes: its name is a random UUID.

## Considered options

- 24-hour URLs kept in `localStorage`
- 24-hour URLs kept in `sessionStorage`
- One-hour URLs as before, with only a longer cache header

## Decision outcome

Chosen by the owner: 24-hour URLs kept in `localStorage`.

- `SIGNED_URL_SECONDS` is 24 hours. `ResolvedImages` stores the signed URLs with the learner's id under `study-atelier:signed-images` and drops the expired ones when it loads or saves them. The root layout passes the signed-in learner: signing out, or another learner signing in, clears them.
- Uploads (own images, their small copies, avatars, imported files) set `cacheControl` to a year.
- The wall still signs a URL again when its image fails to load and the URL has expired.

### Consequences

- Good: a device downloads each own image at most once a day, and Storage egress drops by about the number of visits a day.
- Bad: a leaked signed URL works for up to 24 hours instead of one.
- Bad: files uploaded before keep the one-hour header; they are still cached within the hour.

## More information

- Issue ATL-334; the measurements are in [hosted environments](../architecture/hosted-environments.md#load-and-limits).
