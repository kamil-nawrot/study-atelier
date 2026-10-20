# 0071. Put the plan first on the review start

- Status: accepted
- Date: 2026-10-16

## Context and problem statement

The owner found the start of the reviews ([ADR-0061](0061-review-the-collection-in-one-mixed-session.md)) hard to read on a first visit, although the session itself reads well. It asked for the scope and the form before the start button, offered every era even with one artwork waiting ([ADR-0064](0064-narrow-the-review-scopes.md)), estimated the time, and showed a bar per era ("1 z 1") and unnamed thumbnails without saying what they meant. What should the start show, and in what order?

## Decision drivers

- The usual day needs one click: the plan and the start button come first.
- Every number on the screen says what it counts.
- A scope is offered only when it is worth a session of its own.

## Considered options

- Keep the start and only rename its texts.
- Lead with the plan, hide the choices behind a disclosure, explain the reviews and show the state of the atelier in three groups.

## Decision outcome

Chosen option: the second one, as the owner decided, with the texts the owner wrote.

- With a plan for today: "Na dziś do powtórki zaplanowane masz {n dzieł}", the lead "{n} powracających i {m} nowych" (a part is left out when it is 0), and "Zacznij powtórkę" right under it. There is no estimate of the time.
- "Zmień zakres lub formę" is a disclosure, closed at first, with "Co powtarzamy?" (each scope with how many artworks wait in it) and "W jakiej formie?" with one sentence about the chosen form: "Fiszki i quizy, dobrane do tego, jak dobrze znasz dzieło.", "Przypominasz sobie dzieło, odkrywasz kartę i oceniasz, jak Ci poszło.", "Wybierasz jedną z czterech odpowiedzi.".
- "Cała kolekcja" is always a scope. An era, a period or a style is offered only when it has at least 20 artworks with an image and at least 10 of them are due today; new artworks do not count towards the 10, because until the daily limit is used every large scope would reach it with new artworks alone. When the chosen scope is no longer offered, the start falls back to "Cała kolekcja". When only "Cała kolekcja" is left, the scope row is not shown.
- Nothing left today: "Nic nowego do powtórki" and "Kolejne dzieła będą na Ciebie czekać jutro." or "za {n} dni".
- Fewer than 20 artworks with an image: "Powtórki będzie można rozpocząć, gdy w Twoim atelier znajdzie się przynajmniej 20 dzieł ze zdjęciami. Obecnie brakuje jeszcze {n}." and "Dodaj dzieło" as the `primary` link to the add form.
- Always visible: "Jak działają powtórki?" with "Do puli codziennie dobierane są nowe dzieła, które dodasz do atelier, a także takie, które wymagają powtórki. Im lepiej pamiętasz dzieło, tym rzadziej będzie pojawiać się w kolejnych dniach."
- The side panel "Jak dobrze znasz swoje atelier?" shows one bar in three shades and three groups of the artworks with an image: "Utrwalone" (remembered for longer than a week), "W trakcie nauki" (reviewed, not settled yet) and "Nowe" (never reviewed), each with its number and one line about it. "Ostatnio sprawiały kłopot" lists each artwork with a thumbnail, its title and authors, linking to its page.
- The top bar of the start and the summary leads back to the atelier like the card index and the trash, instead of repeating the view title.

### Consequences

- Good: a usual day is one click, and every number names what it counts.
- Good: the scope row shows up only when a narrower session has enough to review.
- Bad: on the first days only "Cała kolekcja" is offered, until artworks of one era or style come back for review together.
- Bad: the learner no longer sees how long a session takes, nor how well each era is known.

## More information

Changes the start in [ADR-0061](0061-review-the-collection-in-one-mixed-session.md) and the scopes in [ADR-0064](0064-narrow-the-review-scopes.md); requirement R-77. ATL-180, with the scope rule of ATL-176.
