# 0186. Tidy up the settings view

- Status: accepted
- Date: 2026-11-04

## Context and problem statement

The settings view ([ADR-0117](0117-settings-view-in-tabs-opened-from-the-avatar.md)) grew tab by tab, and its tabs no longer looked or read alike. "Konto" and "Dane" had sections with headings and dividers as wide as the form, "Powtórki" had none. Its labels mixed questions ("Z ilu dzieł powinna składać się pojedyncza sesja?") with commands ("Dołączaj do sesji…"), and it used three kinds of controls without any grouping. The rank switch sat in "Powtórki", while the rank form it governs sat in "Profil". The e-mail address was shown in two tabs. The storage bar in "Dane" looked like one more divider, and the view had no way back. The glossary definitions were switched on at every review start ([ADR-0153](0153-add-glossary-definitions-to-the-review-as-extra-questions.md)), apart from the other extra questions, which are switched in the settings ([ADR-0181](0181-turn-the-questions-about-time-on-in-the-review-settings.md)). How should the view be tidied up?

## Decision drivers

- Every tab looks and reads the same way.
- A setting sits next to what it governs.
- All the extra questions of a session are switched in one place and kept on the account.
- No new screen; texts stay close to the owner's wording.

## Considered options

- Group "Powtórki" into sections, with noun-phrase labels or with questions everywhere.
- Set the storage bar apart by a thick bar on a dark track (with the used space in bold), a box around the section, or a large number.
- Give every tab a description, or only the tabs without parts.

## Decision outcome

Chosen by the owner in ATL-489, after going through the tabs together:

- The view has a `BackLink` in the top bar (falling back to "Atelier"), and the title has the same gap to its lead as the other views.
- "Konto", "Powtórki" and "Dane" put their parts in a shared `SettingsSection`: a heading, the content at the width of a form, one spacing under the heading, and a hairline above every section but the first, running the full width of the tab like the line under the tabs.
- "Profil": no photo hint and no e-mail field (the address stays in "Konto"). The photo and its buttons fill a column as wide as the fields. "Pokazuj stopień i Ekspozycję" moves here above "Forma stopni", which is disabled while it is off, with the hint "Po wyłączeniu ani postęp, ani eksponaty nie będą widoczne w atelier, ale nadal będą zliczane, więc w każdej chwili możesz je ponownie włączyć." It is saved with the profile.
- "Konto": the heading "Zmiana adresu e-mail", with the current address in bold in the hint of the new one.
- "Powtórki" has the sections "Sesja" ("Dzieła w jednej sesji", "Nowe dzieła dziennie", "Domyślna forma", "Powtórka swobodna"), "Quizy" (the quiz kinds) and "Pytania dodatkowe" ("Pytania ze Słowniczka" above "Liczba pytań w sesji", then "Luka w Twoich notatkach" and "Rok powstania i kolejność dzieł"). The labels are short noun phrases in the style of field labels, with a hint where the name alone does not say what happens.
- The glossary definitions are switched on or off in "Pytania dodatkowe", stored on the account (`profiles.review_glossary_on`, on by default) next to the count, which is disabled while they are off and kept. The switch at the review start is removed. This supersedes the start switch of ADR-0153.
- "Dane": the storage bar is a thick `Meter` on the dim track, with the used megabytes in bold in the sentence above it.
- Only the tabs without parts have a description: "Źródła" keeps its own, and "Widok dzieła" gets "Ustaw, co powinno być widoczne w widoku dzieła zaraz po otwarciu. Pinezki i lupę możesz też zawsze włączyć, korzystając z przycisków w prawym górnym rogu głównego panelu dzieła." In "Źródła" the image of an artwork is called "obraz".

### Consequences

- Good: the tabs share one section pattern, so a new setting has an obvious place and look.
- Good: every extra question of a session is chosen once, in one place, on every device.
- Bad: the glossary definitions can no longer be left out of a single session without changing the settings.
- Bad: the profile photo is shown larger than the 256 px it is stored at, so it is slightly upscaled.

## More information

- Issue ATL-489, pull request #540. Rules in [ui-patterns.md](../guidelines/ui-patterns.md#settings).
