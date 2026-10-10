# 0007. Load artwork images on the fly from open sources

- Status: accepted
- Date: 2026-10-10
- Deciders: Kamil

## Context and problem statement

Each artwork needs an image. Storing images ourselves uses storage quota and raises licensing questions.

## Considered options

- Store a copy of every image
- Store only a reference (URL, source, licence) and load the image from an open source on the fly, with an optional user-uploaded override

## Decision outcome

Chosen option: store a reference and load images on the fly. The learner can upload their own image, which then overrides the external one and is stored by the app.

Candidate free sources: Wikimedia Commons and Wikidata, Art Institute of Chicago API, Metropolitan Museum Open Access API, Cleveland Museum of Art Open Access; with a free key: Europeana, Rijksmuseum, Harvard Art Museums. The choice of sources is still open.

### Consequences

- Good: almost no storage needed; metadata can be prefilled from the same sources.
- Bad: depends on external availability; attribution and licence must be stored and shown for every image.
