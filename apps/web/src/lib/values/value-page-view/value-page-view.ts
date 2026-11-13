import { canDelete } from '#lib/card-index/card-index/card-index.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { CardIndexPlace } from '#lib/card-index/types/card-index-place.ts';
import type { ValueSubject } from '#lib/card-index/types/value-subject.ts';
import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';

type DeleteState = { deletable: boolean; blocked: string };

type WallTexts = { artworks: string; noArtworks: string };

export function deleteState(
	record: CardIndexRecord | undefined,
	places: readonly CardIndexPlace[]
): DeleteState {
	if (!record) return { deletable: false, blocked: '' };
	const kind = m.cardIndex.kinds[record.category];
	return {
		deletable: canDelete(record, places.length),
		blocked:
			places.length > 0
				? m.valuePage.cityDeleteBlocked(record.count, places.length)
				: m.valuePage.deleteBlocked(kind.demonstrative, m.atelier.count(record.count), kind.other)
	};
}

export function wallTexts(subject: ValueSubject, city: boolean): WallTexts {
	return city ? m.valuePage.city : m.valuePage.kinds[subject.kind];
}
