# 0187. Reward a sent idea with a hidden exhibit

- Status: accepted
- Date: 2026-11-05

## Context and problem statement

The learner sends bugs and ideas through "Zgłoś uwagę" in the menu ([ADR-0076](0076-collect-feedback-in-a-table-from-a-menu-dialog.md)). The owner wants to thank a learner who sends an idea with a hidden single-tier exhibit of the display case, like "Straż nocna", "Puchar Nemezis" and the Mona Lisa ([ADR-0160](0160-gamify-learning-as-a-museum-career.md), [ADR-0162](0162-show-the-exhibits-as-toned-engravings-in-frames.md)). What counts, how is it counted, which engraving does it show and how does it read?

## Decision drivers

- Exhibits are counted from the learner's data and unlocked retroactively; an unlocked tier stays unlocked.
- The learner cannot read the `feedback` table, and the export does not carry it.
- The engraving comes from a public-domain or CC0 source and is named after what it shows (ADR-0185, in pull request #539).
- A hidden exhibit keeps its secret until found, but its hint still points the way.

## Considered options

For what counts: only an idea; an idea or a bug.

For ideas sent before the release: they count; only ideas sent after the release count.

For the object: the Bocca di Leone, the lion's-mouth letter box of the Doge's Palace in Venice; the Bocca della Verità, the mouth of truth; Mercury, the messenger of the gods; a quill and an inkwell.

For the engraving of the mouth of truth: Georg Pencz's _The Mouth of Truth_, close or wide; Lucas van Leyden's woodcut _The Mouth of Truth_, close or wide.

For the name: "Paszcza prawdy"; "Lew prawdy"; "Usta prawdy".

For the hint: "Niektórzy mówią wprost, czego brakuje im w atelier."; "Najlepsze muzea słuchają swoich zwiedzających."; "Niektóre słowa warto powierzyć lwu."; "Lew nie gryzie tych, którzy mają coś do powiedzenia."; "Lew czasem przyjmuje coś więcej niż przysięgi."

## Decision outcome

Chosen by the owner in ATL-491.

### Counting

- The exhibit `mouth_of_truth` counts the learner's `feedback` rows of the kind `idea`; a bug report does not count. It has one tier, at 1, and gives 50 points once as an easter egg, like the other hidden exhibits.
- Every idea in the table counts, also one sent before the release. This is the simplest way: no date condition and no backfill in the migration, because `career_standing` unlocks the exhibits on the next career refresh after the release, and the menu icon flashes as for any new tier.
- A deleted `feedback` row leaves the tier and the points, and an imported atelier keeps them from the exported tiers and ledger although the ideas themselves are not exported.
- After a successful send the dialog refreshes the career, so the menu icon flashes when the dialog closes; sending feedback does not go through the data cache and would otherwise wait for the next write or ten minutes.

### Display case

- Place: at the end, after "Puchar Nemezis".
- Object: the Bocca di Leone was the first choice, but no public-domain engraving of it was found: Wikimedia Commons has only modern photographs, the one old drawing (Carl Theodor Reiffenstein, 1851, Städel Museum) shows an empty outline, and eleven illustrated books on Venice from 1847 to 1908 on the Internet Archive and Europeana had no picture of it. The mouth of truth is drawn as a lion in the prints of the 16th century, so the exhibit keeps the lion's mouth.
- Engraving: the wide crop of Georg Pencz's _The Mouth of Truth_ (c. 1533–1534, Cleveland Museum of Art 1922.150, CC0), with the lion and the kneeling woman, variant `pencz-mouth-of-truth` in `tools/exhibit-art/manifest.json`; the close crop and two crops of Lucas van Leyden's woodcut (c. 1512, National Gallery of Art, CC0) stay there as alternatives. Credit: Georg Pencz, „Usta prawdy”, 1533–1534.
- Name "Paszcza prawdy"; the story of the object: "Georg Pencz wyrył w latach 1533–1534 kobietę, która przysięga na swoją niewinność z dłonią w paszczy kamiennego lwa."; the hint while hidden: "Lew nie gryzie tych, którzy mają coś do powiedzenia."; what it was awarded for: "Za pierwszy zgłoszony pomysł."
- The curiosity of its tier, on the theme of the hidden exhibits, one story about the work itself:

| Tier | Curiosity                                                                                                                                                                                                                 | Source                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1    | Pencz pokazał na rycinie legendę o kobiecie oskarżonej o zdradę. Z dłonią w lwiej paszczy przysięgła, że leżała tylko w ramionach męża i błazna. Lew jej nie ugryzł, bo mówiła prawdę, tyle że błazen był jej kochankiem. | [Cranach Digital Archive](https://lucascranach.org/en/DE_BStGS-GNMN_Gm1108/) |

The Rijksmuseum describes the same engraving as a woman accused of adultery who swears to her innocence ([RP-P-OB-11.050](https://www.rijksmuseum.nl/en/collection/RP-P-OB-11.050)). The version of the legend in which the lover dresses as a fool and embraces her in front of everyone is told only by guides to Rome, so the curiosity leaves it out.

### Consequences

- Good: a learner who helps shape the app finds a reward, and the hint keeps the secret without hiding the way.
- Good: no new column, table or backfill: the exhibit counts a table that already exists.
- Bad: a learner can send a one-word idea only for the exhibit; nothing but a badge is won, so it is accepted, and the owner sees such a report in the hourly digest ([ADR-0142](0142-mail-new-feedback-to-the-owner-every-hour.md)).
- Bad: the exhibit shows the mouth of truth rather than the Venetian letter box the owner first chose.

## More information

Designed in ATL-491; the build gets its own issue. The WebP images go to `apps/web/static/exhibits/mouth_of_truth/` with `exhibit-art publish --only mouth_of_truth` once the exhibit exists in the app and the database.
