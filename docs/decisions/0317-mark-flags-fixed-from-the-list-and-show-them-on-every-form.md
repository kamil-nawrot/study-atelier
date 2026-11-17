# 0317. Mark flags fixed from the list and show them on every form

- Status: accepted
- Date: 2026-11-16

## Context and problem statement

After the first use of Zaplecze ([ADR-0313](0313-collect-flagged-weak-items-and-missing-data-in-zaplecze.md)) the owner found that a flag could be withdrawn only by saving its form, that a form showed the flag only when it was opened from Zaplecze, that every flag of an item was a separate step of the round, and that the note stood under its field ([ATL-798](https://linear.app/kamil-nawrot/issue/ATL-798)).

## Decision drivers

- A flag that needs no edit is gone in one click, and a click by mistake can be undone.
- The learner sees the flags of an item wherever its form opens.
- One visit per item, with all its flags.

## Considered options

1. Marking a flag fixed from the list: at once with a toast; at once with "Cofnij" in the toast; after a confirmation.
2. The notes of a form opened outside Zaplecze: a note with a button, a plain "Zapisz" marks nothing; a note without a button, "Zapisz" marks every flag; a note with a button and a second save button.
3. Several flags of one item: all at once on the form and one visit in the round; as before, one step per flag.

## Decision outcome

Chosen by the owner on 2026-11-16: the second option of question 1 and the first of questions 2 and 3.

1. **"Oznacz jako poprawione" on the list.** Each row of "Twoje flagi" has the button beside "Popraw". It withdraws the flag at once, and the toast "Oznaczono jako poprawione." carries "Cofnij", which saves the flag again with its reason, comment, question, image, pin and hold. Missing data has no such button: it goes when the data is filled in. A `Toast` may carry one action for this.
2. **Notes on every form.** The forms of an artwork, a term and a symbol and the meanings of a symbol view load the flags of their item and show each above the field it is about, also outside Zaplecze. Each note has "Oznacz jako poprawione"; a marked note says "Oznaczono jako poprawione." with "Cofnij" in its place. A plain "Zapisz" marks nothing, because an edit may not be about the flag.
3. **One visit per item.** The list keeps a row per flag. "Popraw" and "Poprawiaj po kolei" open each item once, and "Zapisz i popraw kolejne" (formerly "Zapisz i dalej") withdraws all its flags.
4. **Texts and layout.** The lead of Zaplecze becomes "Na Zapleczu gromadzą się dzieła i kartki ze Słowniczka, które wymagają poprawki – zarówno te oflagowane przez Ciebie, jak i te z brakami w informacjach. Możesz tutaj zająć się ich porządkowaniem i uzupełnianiem."; a row shows where the flag came from and "wstrzymane w powtórkach" as tags with the comment on a line under them; a note joins the reason and the comment with a colon.

### Consequences

- Good: a flag that needs no edit no longer needs the form.
- Good: a form shows its flags however it was opened.
- Bad: every edit form of an artwork, a term or a symbol makes one more small request for its flags.
- Bad: "Cofnij" saves a new flag, so the flag comes back with a new id and a new date.
