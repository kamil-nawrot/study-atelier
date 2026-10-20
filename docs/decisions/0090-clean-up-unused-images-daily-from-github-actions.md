# 0090. Clean up unused images daily from GitHub Actions

- Status: accepted; cleaning both environments on a manual run is superseded by [0092](0092-clean-up-images-by-hand-for-one-environment.md)
- Date: 2026-10-20

## Context and problem statement

Own images are uploaded to the `artwork-images` bucket when the artwork is saved ([ADR-0025](0025-upload-the-own-image-when-the-artwork-is-saved.md)). A save that gets no answer keeps its upload on purpose, because the artwork may have been saved, and "Usuń na zawsze" tolerates a failed removal ([ADR-0028](0028-trash-as-a-list-with-confirmed-deletes.md)), so files no artwork uses can stay in the free storage (ATL-109, from point 1.6 of an external audit). [ADR-0088](0088-up-to-five-images-and-an-automatic-best-match.md) defines when a file is in use. What runs the clean-up, and how old an unused file must be before it goes?

Supabase rejects a direct `delete` on `storage.objects` (the `protect_objects_delete` trigger), so a file can only be removed through the Storage API; a database function alone can find the unused files but not remove them.

On 2026-10-20 the production bucket held 17 files (5.9 MB), all in use.

## Decision drivers

- Nothing new to host or deploy, at no cost ([ADR-0005](0005-no-custom-backend.md), [ADR-0006](0006-zero-cost-hosting.md)).
- Never remove a file a save is about to point to.
- The fewest places that hold a key with full access.

## Considered options

- A: the app cleans up after sign-in, as the learner, through a database function and the Storage API.
- B: a scheduled GitHub Actions workflow, like the keep-alive, with the project's secret key.
- C: a Supabase Edge Function called on a schedule by `pg_cron` and `pg_net`.

## Decision outcome

Chosen by the owner: B, with a grace period of 24 hours.

- The database function `unused_images()` returns the paths in `artwork-images` that are older than 24 hours and are neither the own image of an artwork (also in the trash), of a row of `artwork_images` or of an author's portrait, nor the small copy (`-thumb.jpg`) of one; at most 1000, oldest first. Only `service_role` may call it.
- The workflow `unused-images-cleanup.yml` runs daily and on demand, once for `develop` and once for `production`. It calls the function with the secret key and removes the paths it returns in one Storage API request. The log lists the removed paths.
- Each GitHub environment gets the secret `SUPABASE_SECRET_KEY`, the project's secret key, which the owner adds by hand. Only this workflow reads it.
- 24 hours: a save points to its upload within seconds, so a day covers a slow connection, a retried save and a save in another tab with room to spare.

### Consequences

- Good: no new service, and nothing changes in the app.
- Good: the database decides what is in use, with the same rule as ADR-0088, and the rule is tested.
- Bad: the secret key bypasses row level security and lives in GitHub; the workflow runs from `develop`, so code merged there can read the production key, as it already can the database password ([hosted environments](../architecture/hosted-environments.md)).
- Bad: until a release brings the function to production, the production run fails.

## More information

- Option A needed no secret, but tied the clean-up to someone opening the app and added work to its start. Option C needs a deployment of Edge Functions, which the project does not have, and a key stored in the database for `pg_cron`.
- Issue: ATL-109.
