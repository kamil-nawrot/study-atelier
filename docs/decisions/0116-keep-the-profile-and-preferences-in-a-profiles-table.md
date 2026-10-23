# 0116. Keep the profile and the preferences in a profiles table

- Status: accepted
- Date: 2026-10-23

## Context and problem statement

Version 0.10 gives the learner a profile (a display name and an avatar) and preferences for the reviews and the artwork view. Until now an account is only the email address and the password in Supabase Auth ([ADR-0016](0016-supabase-auth-in-the-browser.md)); the menu shows the first letter of the email as the avatar. Where do the profile and the preferences live, and where is the avatar stored?

## Decision drivers

- The review session is built by database functions ([ADR-0065](0065-build-review-sessions-in-the-database.md)), so the review preferences have to be readable there.
- Other learners may one day see a learner's name, for example with shared exhibitions (idea ATL-130).
- Running costs stay at zero and the storage quota (1 GB) is kept for artwork images.

## Considered options

1. `user_metadata` of the Supabase Auth user for the name and the avatar path, no migration
2. A `profiles` table with one row per learner for the profile and the preferences

## Decision outcome

Chosen by the owner: option 2.

- `profiles` has `owner_id` (primary key, references `auth.users` and is deleted with it), `display_name`, `avatar_path` and the preferences of [ADR-0118](0118-preferences-for-the-reviews-and-the-artwork-view.md), each with its default in the database. RLS lets a learner read and change only their own row.
- A learner without a row, or with a column left at its default, gets the defaults; the first save creates the row.
- The avatar is the learner's own photo, cropped to a square and made 256 px JPEG in the browser (reusing the own image resizing of [ADR-0091](0091-make-large-own-images-smaller-in-the-browser.md)), stored in the existing `artwork-images` bucket as `<owner_id>/avatar-<uuid>.jpg`. A new photo replaces the old file, which is removed. Without a photo the avatar is the first letter of the name, or of the email without a name.
- `unused_images()`, which the daily clean-up uses, keeps the path in `profiles.avatar_path`; otherwise the avatar would be removed after 24 hours.
- An artwork from the collection as the avatar is left as an idea.

### Consequences

- Good: `review_session` and `free_review_session` read the review preferences with a join, and the profile is ready to be shown to others later.
- Good: no new bucket and no public files; the existing storage policies already cover `<owner_id>/...`.
- Bad: a migration, SQL tests and hand-written database types now, where `user_metadata` needed none.
- Bad: the menu needs one more query for the name and the avatar after sign-in.

## More information

- Issues ATL-286 (design), ATL-287 (profile and password), ATL-291 (preferences). Spike ATL-186.
