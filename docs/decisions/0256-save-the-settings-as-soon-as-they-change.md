# 0256. Save the settings as soon as they change

- Status: accepted
- Date: 2026-11-12

## Context and problem statement

The tabs "Profil", "Powtórki", "Widok dzieła" and "Źródła" of Ustawienia kept "Anuluj" and "Zapisz" in a bar at the bottom of the screen, so a change of one switch took a second tap, and on a phone the whole settings view was a task without the bottom bar ([ADR-0252](0252-overhaul-the-app-on-a-phone.md)). The owner asked to drop the bar ([ATL-664](https://linear.app/kamil-nawrot/issue/ATL-664)).

## Decision drivers

- A switch, a checkbox or a choice says what it does; confirming it again is one tap too many.
- The name is typed letter by letter, so it is the one field that needs confirming.
- Without a bar, Ustawienia is a view like any other on a phone.

## Considered options

- How a save is confirmed: quietly, with a message after every change, or with a mark at the section.

## Decision outcome

Chosen option: "quietly", by the owner.

- A switch, a checkbox, a choice and the photo are saved as soon as they change. The saves of a tab run one after another in the order of the changes (`SaveQueue`), so a quick series of taps ends in the last state.
- A switch or a choice saves without a message. Saving the photo ends with "Zapisano zdjęcie.", removing it with "Usunięto zdjęcie.".
- The name has its own "Zapisz" next to the field, shown only while the name differs from the saved one; Enter saves it too, and it ends with "Zapisano imię.". A switch saved meanwhile keeps the saved name, so a name being typed is never saved by the way. Leaving with an unsaved name still asks "Odrzucić zmiany?".
- A failed save turns the changed values back to the saved ones and drops the changes waiting behind it, with the error in an `Alert` at the top of the tab.
- The tabs keep their card (`SettingsCard`) without the bar, and on a phone Ustawienia shows the bottom bar; the back arrow stays.

### Consequences

- Good: one tap changes a setting, and the settings no longer hide the bottom bar.
- Bad: each change is a request; a series of taps sends a series of requests.
