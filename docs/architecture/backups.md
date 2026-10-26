# Backups

How the production data is backed up and brought back ([ADR-0134](../decisions/0134-back-up-production-to-encrypted-github-artifacts.md)). The Supabase Free plan has no backups of its own, and Pro's daily backups cover only the database, not the files in Storage.

## What is saved, and when

| Backup            | When                                                                      | What                                                                  | Artifact                              |
| ----------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------- |
| Before migrations | Every push to `main`, in the `database` job of `ci.yml`, before `db push` | The production database                                               | `database-before-migrations-<commit>` |
| Weekly            | Sundays at 04:17 UTC from `develop` (`production-backup.yml`), or by hand | The production database and every file of the `artwork-images` bucket | `production-backup-<run id>`          |

Each artifact holds one file, `*.tar.gz.age`, kept for 30 days. The repository is public, so anyone signed in to GitHub can download an artifact; without the private key it is useless.

The database part has five files from `supabase db dump`: `roles.sql`, `schema.sql`, `data.sql` (every schema the platform does not manage, `auth` and `storage` included, so accounts and file records come back) and `history-schema.sql` with `history-data.sql` (the applied migrations). The weekly backup adds `images/` with the files under their own paths.

## The key

The backups are encrypted with [`age`](https://github.com/FiloSottile/age) to a public key. The private key lives only with the owner, in the password manager, never in GitHub or the repository.

1. Install `age` and run `age-keygen -o study-atelier-backup.key`. It prints the public key, `age1…`.
2. GitHub, Settings, Environments, `production`, Variables: add `BACKUP_AGE_RECIPIENT` with the public key.
3. Put the contents of `study-atelier-backup.key` in the password manager and delete the file.

Without the variable a release stops before migrating production, and the weekly backup fails. A lost private key makes every backup unreadable: make a new pair, replace the variable, and run the weekly backup by hand.

## Bringing a backup back

1. Download the artifact from the run (Actions, the run, Artifacts) or with `gh run download <run id>`.
2. Decrypt and unpack it, with the private key in a file only for this time:

   ```sh
   mkdir backup
   age --decrypt --identity study-atelier-backup.key production-backup.tar.gz.age | tar --extract --gzip --directory backup
   ```

3. Restore the database into an empty Supabase project (a new project, or the rehearsal stack below), with the connection string of that project:

   ```sh
   cd backup/database
   psql --single-transaction --variable ON_ERROR_STOP=1 \
     --file roles.sql --file schema.sql \
     --command 'SET session_replication_role = replica' --file data.sql \
     --command 'RESET session_replication_role' \
     --file history-schema.sql --file history-data.sql \
     --dbname "<connection string>"
   ```

   A database that already holds the schema cannot take `schema.sql`. To bring production back in place, Supabase support or a new project is the way, not a restore over the live database.

4. Put the images back with that project's URL and secret key:

   ```sh
   SUPABASE_URL=<project url> SUPABASE_SECRET_KEY=<secret key> node .github/scripts/copy-bucket.mjs upload backup/images
   ```

5. Sign in with an account from the backup and open the atelier: the artworks, their own images and the review counter are there.

6. Delete `backup/`, the artifact file and the key file.

## Rehearsal on a separate local stack

A rehearsal never touches the develop or production project, nor the local stack of the repository. It runs on a second local Supabase stack with its own name and ports:

```sh
mkdir rehearsal && cd rehearsal && supabase init
```

In `supabase/config.toml` set `project_id = "rehearsal"`, move the ports from `543xx` to `553xx`, and switch off `studio`, `realtime`, `analytics`, `edge_runtime`, `storage.vector` and `storage.s3_protocol`. Then `supabase start`, and run steps 3 to 5 with `postgresql://postgres:postgres@127.0.0.1:55322/postgres`, `http://127.0.0.1:55321` and the secret key `supabase start` prints. Finish with `supabase stop --no-backup` in that folder, which removes its data.

The steps were rehearsed this way on 2026-10-26 with a dump of a local database: the accounts, artworks, glossary, review history and migration history came back with the same counts, a seeded learner signed in and read only their own artworks, and images went up and down unchanged.

## The guarded clean-up

The unused images clean-up ([ADR-0090](../decisions/0090-clean-up-unused-images-daily-from-github-actions.md)) refuses to remove more than 100 files in one run: it lists them, removes nothing and fails. After checking the list, the owner runs the workflow by hand with "allow_mass_delete" ticked.
