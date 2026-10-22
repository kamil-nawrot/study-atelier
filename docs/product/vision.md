# Product vision

## Problem

Learning art history means memorising many artworks together with their authors, dates, styles and context.
Ready-made flashcard decks and textbooks deliver this knowledge passively.

## Idea

study-atelier lets the learner build their own atelier: a personal, searchable collection of artworks they add while studying.
Assembling the collection is part of the learning process itself. The collection then feeds learning tools.

## Users

For now a single user: the project owner, learning art history. In the long run the app is designed for many learners, each with their own atelier, so what a learner records is not limited to what the owner foresees ([ADR-0104](../decisions/0104-let-the-learner-define-own-artwork-fields.md)).

## Principles

- The learner's own collection is the centre of the app.
- Artwork images come from open sources by default; the learner can override them with their own image.
- Running costs stay at zero while the app has a single user.

## Scope

The first version covers building and browsing the atelier; learning tools come later. See [requirements.md](requirements.md).
