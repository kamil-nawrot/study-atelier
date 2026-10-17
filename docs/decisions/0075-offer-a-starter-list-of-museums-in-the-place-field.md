# 0075. Offer a starter list of museums in the place field

- Status: accepted
- Date: 2026-10-17

## Context and problem statement

The learner types every place by hand, so the same museum can end up under several spellings and its country has to be filled in on its page ([ADR-0057](0057-location-country-and-type-of-place.md)). The owner asked for a ready-made list of museums, the same for everyone, offered in the place field of an artwork. It must stay out of the card index until it is used, and then be an ordinary place with its country already filled in. Places belong to one learner ([ADR-0014](0014-artwork-collection-data-model.md)): every row, policy and unique name is scoped to its owner. Where does the list live, and when does an entry become the learner's place?

## Decision drivers

- Nothing changes for places, merging, the trash or the card index: they keep working on the learner's own rows.
- The list is the same for every learner and nobody can change it from the app.
- The cloud session has no database: data reaches it only through migrations.

## Considered options

- Rows in `category_values` with no owner, visible to everyone.
- A copy of the whole list in every learner's `category_values`, hidden from the card index by a flag.
- A shared, read-only catalogue table; an entry is copied into the learner's own places when an artwork is saved with it.

## Decision outcome

Chosen option: a shared, read-only catalogue table, `catalogue_museums` (Wikidata id, name, English name, ISO country). Every signed-in learner can read it and nobody can write it from the app; it is filled by a migration.

- **Offering.** The place field suggests catalogue entries in a group of their own, "Z listy startowej", after the places the learner already uses, from the second character typed and at most six at a time. The text is matched against the name and the English name, so "Louvre" finds "Luwr". An entry whose name (or English name) the learner already has as a place is not offered again, and a typed name that is on the list is not offered as new. Each entry shows its country on the right, and so do the learner's own places that have one.
- **Becoming a place.** `save_artwork` creates the place as before. When it creates a new place whose name is the name of a catalogue entry (letter case ignored), it also creates its details with the country, the type "Muzeum" and the catalogue entry it came from. An entry that is never saved on an artwork creates nothing, so the card index shows only places in use. A name typed by hand that equals a catalogue name is treated the same way.
- **After that** the place is the learner's own: it can be renamed, merged, deleted when unused and edited. `location_details.catalogue_wikidata_id` only records where it came from, and is not shown. The card index has no filter or mark for it, as the owner decided.
- **The list.** Names are Polish Wikipedia labels (English label when there is none), taken from Wikidata: museums that are art museums or a kind of one, with at least 12 language editions, in a country of the app's country list, 725 entries, plus four museums of the Netherlands and Russia that Wikidata does not class as art museums. Wikidata classes some well-known museums, for example Zachęta, as plain museums, which the query could not take within its time limit, so they are not in the first list. More can be added with a migration.

### Consequences

- Good: places, the card index, merging, the trash and the policies stay as they were; the learner gets consistent names and countries without typing them.
- Good: the catalogue can grow by migrations, and a place keeps the Wikidata id it came from for later use.
- Bad: a museum the learner already typed under another name (for example "Louvre") is not linked to its catalogue entry.
- Bad: the list is a snapshot from 2026-10-17 and does not follow Wikidata.
- Bad: names are not always the ones a Polish learner knows ("Prado", "Muzeum Brytyjskie" are, a few long Wikipedia labels are not); learners can type any other name.

## More information

Requirements R-93, R-94. Migration `20261017060000_museum_catalogue.sql`, tests `supabase/tests/security.sql`; ATL-177.
