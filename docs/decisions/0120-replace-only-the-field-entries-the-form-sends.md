# 0120. Replace only the field entries the form sends

- Status: accepted
- Date: 2026-10-23

## Context and problem statement

[ADR-0104](0104-let-the-learner-define-own-artwork-fields.md) made `save_artwork` replace all text and tick entries of an artwork whenever it is given `field_entries`. The code review of 0.8 found two ways this loses or blocks data:

- The artwork form lists the own fields it loaded when it opened. A field added in another tab afterwards is unknown to the form, yet saving the artwork deleted the entries of that field.
- A list field deleted in another tab is still in the form's `values_by_category`. Its category no longer exists, so `check_value_category` rejects the value (23503) and the whole save fails with a general error.

Separately, the names of values (built-in categories and own lists) had no limit on length or control characters in the database, although names of fields and texts of entries have one.

## Decision drivers

- Saving an artwork never deletes data the learner did not see in the form.
- A field deleted elsewhere does not block saving.
- The database enforces the same limits as the form, for every caller.

## Considered options

1. Replace the entries of the fields the form names, and ignore categories that no longer exist. The form names every own field it knows, with an empty text or an unticked box for the cleared ones.
2. Keep deleting all entries and ask the form to resend the fields it does not know. The form cannot send what it never loaded.
3. Compare timestamps of the field list and refuse the save when it changed. It turns a harmless difference into an error the learner has to resolve.

## Decision outcome

Chosen option 1.

- `save_artwork` deletes only the entries whose field is a key of `field_entries`, then stores the non-empty ones. Entries of fields the form did not name stay.
- It drops the keys of `values_by_category` that name no category the learner can read, so values of a deleted list field are ignored instead of failing the save.
- The form sends an empty text (`""`) or `false` for every known field the learner cleared, instead of leaving the key out.
- `category_values.name` gets a check of at most 200 characters and no control characters, added as `not valid` so existing rows are not rechecked. The form limits the inputs to 200 characters and turns control characters into spaces, like the text entries.

### Consequences

- Good: a save cannot erase an entry of a field the form never showed.
- Good: deleting a list field in another tab no longer breaks saving in an open form; its values are simply gone.
- Bad: an open form saves without a field added in another tab; the new field shows after the next load.

## More information

- Issue ATL-270.
