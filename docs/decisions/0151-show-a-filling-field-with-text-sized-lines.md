# 0151. Show a filling field with text-sized lines

- Status: accepted
- Date: 2026-10-28

## Context and problem statement

[ADR-0150](0150-lock-the-fields-an-external-fetch-fills.md) locked the fields an external fetch fills by disabling them and laying the image `Primer` over them, with the status line under the field. In use the owner found it too loud: the field lost its white outline, the old text stayed visible under the strokes, the line under the field moved the form, and the text area showed the browser's scrollbar. How should a filling field look?

## Decision drivers

- The field looks like itself; only its content shows that it is being filled.
- Nothing changes size or moves while a fetch runs.
- The text area uses the app's overlay scrollbar like every other scroll area.

## Considered options

- Keep the image primer over a disabled field
- Faint text-sized lines inside a read-only field

## Decision outcome

Chosen by the owner: faint text-sized lines inside a read-only field.

- `filling` makes the field read-only and `aria-busy`, keeps its outline and background, and covers its content with the library `FillingLines`: faint bars of the height of a text line (one short bar in a one-line field, up to four in a text area, the last one short), shown after the loading delay and pulsing slowly unless motion is reduced. The old text is hidden, not cleared, so stopping the fetch brings it back.
- `TextArea` takes a `fillingNote`: the app puts `FillingStatus` ("Wyszukiwanie w Wikipedii… Przerwij") into the bottom of the field, so the form does not move. Only when an event fetch fills the dates alone does the line stand under "Opis".
- `TextArea` draws the overlay scrollbar in its frame (`overlayScrollbarBeside`), so a text area never shows the browser's bar.
- The rest of ADR-0150 stands: which fields lock, the disabled submit, "Przerwij" and the timeouts.

### Consequences

- Good: a fetch is visible without shouting, and the layout stays still.
- Bad: a filling field no longer looks disabled, so its lock is told only by the lines and the note.

## More information

- Issue ATL-365.
