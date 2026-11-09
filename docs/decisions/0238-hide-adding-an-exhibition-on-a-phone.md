# 0238. Hide adding an exhibition on a phone

- Status: accepted
- Date: 2026-11-09

## Context and problem statement

Adding blocks on a phone is a separate step of the build ([ADR-0199](0199-tell-stories-in-exhibitions-of-the-learners-artworks.md)), and the toolbox is not shown there ([ADR-0226](0226-dock-the-toolbox-at-the-right-edge-of-the-editor.md)). In 0.21 "Dodaj wystawę" on a phone made an empty exhibition to which no block could be added, while "Edytuj" lets the learner change texts and the order of blocks. The code review of 0.21 found it (ATL-588).

## Considered options

- Hide "Dodaj wystawę" on a phone; "Edytuj" stays.
- Show exhibitions only, hiding "Edytuj" too.
- Keep both, with a message in an empty exhibition that blocks are added on a computer.
- Build adding blocks on a phone in 0.21.

## Decision outcome

Chosen by the owner in ATL-588: "Dodaj wystawę" is hidden at the widths where the toolbox is not shown; "Edytuj" stays for texts and order. Adding on a phone stays a later step of ADR-0199.

### Consequences

- Good: no exhibition is started where it cannot be filled, and no new text is needed.
- Bad: a learner on a phone cannot start an exhibition at all until the later step.
