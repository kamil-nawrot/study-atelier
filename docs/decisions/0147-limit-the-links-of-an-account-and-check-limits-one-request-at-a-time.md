# 0147. Limit the links of an account and check limits one request at a time

- Status: accepted
- Date: 2026-10-27

## Context and problem statement

The code review of release 0.13 found two gaps in the account limits of [ADR-0133](0133-limit-the-storage-and-the-rows-of-one-account.md). The rows that link artworks to values, visits and own fields had no limit, so a script could add millions of them. And two requests sent at the same moment each counted the rows or the bytes before the other committed, so together they could pass a limit or the quota. How are the links limited, and how are the checks kept exact?

## Decision drivers

- An honest learner never meets a limit; the local development atelier (292 artworks) has at most 9 values on one artwork.
- The limits hold whatever client calls the API, so they stay in the database.
- The fix must not slow down saving an artwork in a way the learner notices.

## Considered options

- Limit the links per artwork or per visit
- Limit the links per account, like the other rows

## Decision outcome

Chosen by the owner: limit the links per account with the same `private.limit_rows` trigger, and serialise the checks of one account.

| Rows                              | Limit  |
| --------------------------------- | ------ |
| Values on artworks                | 100000 |
| Artworks on visits                | 20000  |
| Entries in own fields on artworks | 100000 |

That is 20 values and 20 own field entries for each of 5000 artworks, and 20 artworks for each of 1000 visits. Each table gets an index on `owner_id` for the count.

- `private.limit_rows` takes a transaction-level advisory lock on the table and each owner in the statement before it counts. A second request of the same account waits until the first commits and then counts its rows.
- `public.storage_has_room(bytes)` takes a lock on the storage of the learner and then compares the used bytes plus the declared size with the quota; the storage insert and update policies call it instead of reading `storage_usage()` directly. The lock is held while Storage finishes the upload, so one learner's uploads run one after another.
- At a link limit the learner sees a message that names the limit and what to do, as for the other rows.
- An import counts the rows of the copy against the limits before uploading any image and names the first table that does not fit; the daily limits are left to the database.

### Consequences

- Good: no table of one account can grow without end, and two requests cannot pass a limit together.
- Good: an import that does not fit fails at once, without uploading images first.
- Bad: each save of links counts the account's links, up to 100000 rows through an index.
- Bad: parallel uploads of one learner are serialised.

## More information

- Issue ATL-358.
