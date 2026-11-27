# 0351. Do not add museum collections as image sources for now

- Status: accepted
- Date: 2026-11-27

## Context and problem statement

Wikimedia Commons, reached through Wikidata, is the only external image source ([ADR-0007](0007-images-from-open-sources.md) left the other sources open). Several museums publish their public-domain works under CC0 with good photos and open APIs: the Met, the Rijksmuseum, the Art Institute of Chicago, the National Gallery of Art, the Smithsonian, the Cleveland Museum of Art, and the aggregator Europeana ([ATL-855](https://linear.app/kamil-nawrot/issue/ATL-855/spike-images-from-open-access-museum-collections)).

Should the app look up artwork images in these collections next to Commons?

## Decision drivers

- A new source must give a better image, or a first one, to a noticeable share of the artworks.
- Every image source is a new kind of image across the data model, the credit, the loupe, the palette, export and import and the check for broken images, and each API is code to keep up to date.
- The owner's collection leans on European museums, architecture and sculpture in situ.

## Considered options

1. Add one or more museum APIs as image sources.
2. Add none for now and keep Commons as the only external source.

## Decision outcome

Chosen option: 2, by the owner on 2026-11-27, because the measured gain is small and the upkeep is not.

- Coverage was measured on the DEV test set (295 artworks, not the owner's collection) through the museum identifiers in Wikidata (P3634 Met, P4610 Art Institute of Chicago, P4683 National Gallery of Art, P11110 Cleveland, P4704 Smithsonian American Art Museum, P195 Rijksmuseum). Only 16 artworks (5 %) are in one of these collections, and all 16 already have a Commons image, most often the museum's own file uploaded to Commons. Since [ADR-0346](0346-show-more-images-of-the-same-artwork-in-the-candidate-dialog.md) the other photos of the item's Commons category are offered too.
- The collections the set uses most are the Louvre, the Musée d'Orsay, the Prado, the Uffizi and the Vatican Museums. The museums above hold little of that canon and no architecture or sculpture in situ, about a quarter of the artworks.
- Europeana answers searches for Polish art ("Matejko", "Bitwa pod Grunwaldem", "Wyspiański") mostly with scans of postcards and reproductions from libraries, mixes rights per object and needs an API key.
- The APIs change: the Met retired its search endpoint on 2026-10-01 for a paginated one, and its image files send no CORS header, so the palette would need the image proxy of [ADR-0223](0223-read-colours-of-linked-images-through-an-image-proxy.md).

### Consequences

- Good: no new kind of image and no adapter per museum to maintain.
- Bad: an artwork whose Commons image is poor while a museum has a better one gets no help from the app; the learner can still link or upload that image.
- The question can come back when the owner meets such artworks in the collection; it would then start from a measurement on the production collection and from the cheaper variants that add no source, such as preferring the museum's own file on Commons or a link to the museum's page from Wikidata.

## More information

- What answered from a cloud session on 2026-11-27: the Met object API (CORS `*`), its image files (no CORS header), the Art Institute of Chicago API and IIIF images (CORS `*`, no longer behind a Cloudflare challenge), the Cleveland API (CORS `*`, CC0 per record) and Europeana (CORS `*`, with a key). The Rijksmuseum, National Gallery of Art and Smithsonian APIs and the Cleveland image server were blocked by the environment and not checked.
- The spike's findings are attached to ATL-855 as a document.
