# 0086. Fetch the inflected forms of synonyms from Wiktionary, with at most three synonyms

- Status: accepted
- Date: 2026-10-19

## Context and problem statement

A glossary term has a name, synonyms and inflected forms, and notes mark it by any of them in their exact form ([ADR-0079](0079-connect-the-lexicon-and-suggest-forms-from-wiktionary.md)). Only the name's forms come from Polish Wiktionary, so a synonym is found in a note only in the case it was typed in. Should the forms of synonyms come from Wiktionary too, and where do they go (ATL-204)?

The database keeps at most 50 forms per term. The owner's terms have one or two synonyms, and a word has eight to ten forms.

## Decision drivers

- A term should be found in notes whichever of its names is used, in any case, without typing the forms by hand.
- No migration unless it pays off.
- The form stays as it is: synonyms in their field, all forms in "Odmiana".

## Considered options

Where the forms of a synonym go: (A) into the one list of forms, with the name's; (B) a list per synonym, in a new column.

When a synonym is removed: (A) its forms go with it if they were fetched in the same edit, and stay otherwise; (B) they always stay.

The limit of 50 forms: raise it in a migration, cap the list, or limit the number of synonyms.

## Decision outcome

Chosen by the owner: A, A, and both a limit of three synonyms and a cap of the list.

- When the learner adds a synonym, the app fetches its forms from Polish Wiktionary by the rules of the name (not for the category Osoba nor for more than two words) and adds them to "Odmiana". While it searches, the frame says "Szukam odmiany „{synonim}” w Wikisłowniku…"; when Wiktionary has nothing, "Nie udało się odszukać „{synonim}” w słowniku. Możesz dopisać formy samodzielnie."; a failed request gives the message of the name.
- Removing a synonym in the same edit takes away the forms it brought, except those the name or another synonym also has. The forms of a saved term do not record which word they came from, so removing a synonym later leaves its forms until the learner removes them or fetches again.
- "Pobierz z Wikisłownika" and "Pobierz ponownie", and the automatic fetch of a new term, fetch the forms of the name and of every synonym and replace the whole list.
- A term has at most three synonyms. With three, the field hides its input and the hint says "Najwyżej 3 synonimy. Usuń któryś, żeby dodać inny."; the hint otherwise reads "Inne nazwy tego samego. Pokażą się pod nazwą, a ich odmiana trafi do „Odmiany”. Każdą zatwierdzasz Enterem.". The limit lives in the form (`max` of `ValueField`), not in the database.
- The list of forms is capped at 50, the name's forms first and then the synonyms' in the order they were added, so a save never breaks the database limit.

### Consequences

- Good: a term is found in notes under any of its names in any case.
- Good: no migration and no new field in the form.
- Bad: the forms of a synonym removed from a saved term stay until the learner removes them or fetches again.
- Bad: with three long synonyms the last forms can be cut off at 50.

## More information

- Builds on [ADR-0079](0079-connect-the-lexicon-and-suggest-forms-from-wiktionary.md), whose rules for fetching forms it applies to synonyms.
- Issue: ATL-204. The limit follows the owner's numbers of synonyms and forms.
